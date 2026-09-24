import {
  isTonightFilmClassification,
  isTonightSeriesClassification,
} from '../../data/domain/programmeClassification.ts';
import type { StoredProviderScheduleObservation } from '../epg/ingest.ts';
import type { NormalisedProgrammeObservation } from '../epg/normalise.ts';
import { matchFilmIdentity } from './filmMatcher.ts';
import type { ProgrammeExternalContentRepository } from './externalContentRepository.ts';
import { matchSeriesIdentity } from './seriesMatcher.ts';
import type { TmdbGateway } from './tmdbGateway.ts';
import { normaliseIdentityText } from './titleIdentity.ts';
import type {
  ExternalContentMatchDecision,
  ProgrammeExternalContentDecision,
} from './types.ts';

const DEFAULT_CONCURRENCY = 3;
const DECISION_WRITE_LIMIT = 256;

export type ExternalContentEnrichmentResult = {
  eligibleProgrammeCount: number;
  uniqueIdentityWorkCount: number;
  resolvedCount: number;
  unresolvedCount: number;
  ambiguousCount: number;
  providerFailureCount: number;
  persistedReferenceCount: number;
  clearedReferenceCount: number;
  ignoredStaleCount: number;
  persistenceFailureCount: number;
};

type EligibleObservation = {
  stored: StoredProviderScheduleObservation;
  item: NormalisedProgrammeObservation;
  family: 'film' | 'series';
};

function sortedEvidence(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map(normaliseIdentityText).filter(Boolean))].sort();
}

function workKey(input: EligibleObservation): string {
  const external = input.item.externalProgramme;
  return JSON.stringify({
    family: input.family,
    title: normaliseIdentityText(input.item.programme.title),
    year: external.productionDate?.year ?? null,
    directors: sortedEvidence(external.credits?.director),
    actors: sortedEvidence(external.credits?.actor),
    episodeNumbers: (external.episodeNumbers ?? [])
      .map(({ system, value }) => ({
        system: system?.trim().toLocaleLowerCase('en-US') ?? '',
        value: value.trim(),
      }))
      .sort((left, right) =>
        left.system.localeCompare(right.system) || left.value.localeCompare(right.value),
      ),
  });
}

function eligibleObservation(
  stored: StoredProviderScheduleObservation,
  item: NormalisedProgrammeObservation,
): EligibleObservation | null {
  const observedAtMs = Date.parse(stored.observedAt);
  const endMs = Date.parse(item.programme.endAt);
  if (!Number.isFinite(observedAtMs) || !Number.isFinite(endMs) || endMs <= observedAtMs) {
    return null;
  }

  if (isTonightFilmClassification(item.classification)) {
    return { stored, item, family: 'film' };
  }
  if (isTonightSeriesClassification(item.classification)) {
    return { stored, item, family: 'series' };
  }
  return null;
}

async function match(
  input: EligibleObservation,
  gateway: TmdbGateway,
): Promise<ExternalContentMatchDecision> {
  const matcherInput = {
    title: input.item.programme.title,
    programme: input.item.externalProgramme,
  };
  return input.family === 'film'
    ? matchFilmIdentity(matcherInput, gateway)
    : matchSeriesIdentity(matcherInput, gateway);
}

async function mapWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  operation: (item: T) => Promise<void>,
): Promise<void> {
  const workers = Math.max(1, Math.min(concurrency, items.length || 1));
  let index = 0;

  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (index < items.length) {
        const current = items[index];
        index += 1;
        if (current !== undefined) await operation(current);
      }
    }),
  );
}

function programmeDecision(
  input: EligibleObservation,
  decision: ExternalContentMatchDecision,
): ProgrammeExternalContentDecision {
  return {
    programmeId: input.item.programme.id,
    channelId: input.item.programme.channelId,
    startAt: input.item.programme.startAt,
    endAt: input.item.programme.endAt,
    title: input.item.programme.title,
    observedAt: input.stored.observedAt,
    decision,
  };
}

export async function enrichStoredExternalContent(input: {
  observations: readonly StoredProviderScheduleObservation[];
  gateway: TmdbGateway;
  repository: ProgrammeExternalContentRepository;
  clock?: () => Date;
  concurrency?: number;
}): Promise<ExternalContentEnrichmentResult> {
  const latestByProgrammeId = new Map<string, EligibleObservation>();

  for (const stored of input.observations) {
    for (const item of stored.programmes) {
      const eligible = eligibleObservation(stored, item);
      if (!eligible) continue;

      const current = latestByProgrammeId.get(item.programme.id);
      if (!current || Date.parse(current.stored.observedAt) <= Date.parse(stored.observedAt)) {
        latestByProgrammeId.set(item.programme.id, eligible);
      }
    }
  }

  const eligible = [...latestByProgrammeId.values()];
  const work = new Map<string, EligibleObservation[]>();
  for (const item of eligible) {
    const key = workKey(item);
    const grouped = work.get(key) ?? [];
    grouped.push(item);
    work.set(key, grouped);
  }

  const decisions: ProgrammeExternalContentDecision[] = [];
  let providerFailureCount = 0;
  const groups = [...work.values()];

  await mapWithConcurrency(
    groups,
    input.concurrency ?? DEFAULT_CONCURRENCY,
    async (group) => {
      const representative = group[0];
      if (!representative) return;
      try {
        const decision = await match(representative, input.gateway);
        for (const item of group) decisions.push(programmeDecision(item, decision));
      } catch {
        providerFailureCount += group.length;
      }
    },
  );

  let persistedReferenceCount = 0;
  let clearedReferenceCount = 0;
  let ignoredStaleCount = 0;
  let persistenceFailureCount = 0;
  const resolvedAt = (input.clock?.() ?? new Date()).toISOString();

  const byObservedAt = new Map<string, ProgrammeExternalContentDecision[]>();
  for (const decision of decisions) {
    const grouped = byObservedAt.get(decision.observedAt) ?? [];
    grouped.push(decision);
    byObservedAt.set(decision.observedAt, grouped);
  }

  for (const [observedAt, grouped] of byObservedAt) {
    for (let index = 0; index < grouped.length; index += DECISION_WRITE_LIMIT) {
      const chunk = grouped.slice(index, index + DECISION_WRITE_LIMIT);
      try {
        const result = await input.repository.applyDecisions({
          observedAt,
          resolvedAt,
          decisions: chunk,
        });
        persistedReferenceCount += result.resolvedReferenceCount;
        clearedReferenceCount += result.clearedReferenceCount;
        ignoredStaleCount += result.ignoredStaleCount;
      } catch {
        persistenceFailureCount += chunk.length;
      }
    }
  }

  return {
    eligibleProgrammeCount: eligible.length,
    uniqueIdentityWorkCount: groups.length,
    resolvedCount: decisions.filter(({ decision }) => decision.status === 'resolved').length,
    unresolvedCount: decisions.filter(({ decision }) => decision.status === 'unresolved').length,
    ambiguousCount: decisions.filter(({ decision }) => decision.status === 'ambiguous').length,
    providerFailureCount,
    persistedReferenceCount,
    clearedReferenceCount,
    ignoredStaleCount,
    persistenceFailureCount,
  };
}
