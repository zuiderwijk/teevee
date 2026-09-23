import type { Channel, GuideSchedule, Programme } from '@/data/domain/epg';
import type { ProgrammeClassification } from '@/data/domain/programmeClassification';

import { classifyExternalProgramme } from '../classification/classifyProgramme.ts';
import { resolveChannelMappings } from './channelMapping.ts';
import { dataQualityDiagnostic, type DataQualityDiagnostic } from './diagnostics.ts';
import type { ChannelMapping, ExternalProgramme } from './provider';

export type NormaliseProviderScheduleInput = {
  providerKey: string;
  generatedAt: string;
  canonicalChannels: Channel[];
  channelMappings: ChannelMapping[];
  programmes: ExternalProgramme[];
};

export type NormaliseProviderScheduleResult = {
  schedule: GuideSchedule;
  classifications: ProgrammeClassification[];
  diagnostics: DataQualityDiagnostic[];
  resolvedChannelMappings: ChannelMapping[];
};

function nonEmptyText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parsedTimestamp(value: string | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, '0');
}

function stableProgrammeId(identity: string): Programme['id'] {
  const reversed = Array.from(identity).reverse().join('');
  return `programme-${stableHash(identity)}${stableHash(reversed)}`;
}

function providerProgrammeKey(
  programme: ExternalProgramme,
  providerChannelId: string,
  startMs: number,
  endMs: number,
  title: string,
): string {
  const providerId = nonEmptyText(programme.id);
  if (providerId) return [providerChannelId, `id:${providerId}`, startMs].join('\u0000');
  return [providerChannelId, startMs, endMs, title].join('\u0000');
}

function canonicalProgramme(
  providerKey: string,
  channelId: Channel['id'],
  programme: ExternalProgramme,
  startMs: number,
  endMs: number,
  title: string,
): Programme {
  const providerId = nonEmptyText(programme.id);
  const identity = providerId
    ? `${providerKey}\u0000${channelId}\u0000${providerId}\u0000${startMs}`
    : `${providerKey}\u0000${channelId}\u0000${startMs}\u0000${endMs}\u0000${title}`;
  const subtitle = nonEmptyText(programme.subtitle);
  const description = nonEmptyText(programme.description);
  const genre = nonEmptyText(programme.genre);

  return {
    id: stableProgrammeId(identity),
    channelId,
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    title,
    ...(subtitle ? { subtitle } : {}),
    ...(description ? { description } : {}),
    ...(genre ? { genre } : {}),
    ...(typeof programme.isLive === 'boolean' ? { isLive: programme.isLive } : {}),
    ...(typeof programme.isRepeat === 'boolean' ? { isRepeat: programme.isRepeat } : {}),
  };
}

function addOverlapDiagnostics(programmes: Programme[], diagnostics: DataQualityDiagnostic[]) {
  const byChannel = new Map<Channel['id'], Programme[]>();

  for (const programme of programmes) {
    const list = byChannel.get(programme.channelId) ?? [];
    list.push(programme);
    byChannel.set(programme.channelId, list);
  }

  for (const [channelId, channelProgrammes] of byChannel) {
    let furthestEndMs = Number.NEGATIVE_INFINITY;
    let furthestProgramme: Programme | null = null;

    for (const programme of channelProgrammes) {
      const startMs = Date.parse(programme.startAt);
      const endMs = Date.parse(programme.endAt);

      if (furthestProgramme && startMs < furthestEndMs) {
        diagnostics.push(
          dataQualityDiagnostic(
            'warning',
            'overlapping-programmes',
            `Programme ${programme.id} overlaps ${furthestProgramme.id} on channel ${channelId}.`,
            { channelId, programmeId: programme.id },
          ),
        );
      }

      if (endMs > furthestEndMs) {
        furthestEndMs = endMs;
        furthestProgramme = programme;
      }
    }
  }
}

export function normaliseProviderSchedule(
  input: NormaliseProviderScheduleInput,
): NormaliseProviderScheduleResult {
  const providerKey = input.providerKey.trim();
  if (!providerKey) throw new Error('providerKey must not be empty');

  const generatedAtMs = Date.parse(input.generatedAt);
  if (!Number.isFinite(generatedAtMs)) throw new Error('generatedAt must be a valid timestamp');

  const mappingResolution = resolveChannelMappings(input.canonicalChannels, input.channelMappings);
  const diagnostics = [...mappingResolution.diagnostics];
  const mappingByProviderId = new Map(
    mappingResolution.mappings.map((mapping) => [mapping.providerChannelId, mapping.channelId]),
  );

  const seenProviderProgrammes = new Set<string>();
  const programmes: Programme[] = [];
  const classificationsByProgrammeId = new Map<Programme['id'], ProgrammeClassification>();

  for (const external of input.programmes) {
    const providerChannelId = nonEmptyText(external.channelId) ?? '';
    const providerProgrammeId = nonEmptyText(external.id);
    const channelId = mappingByProviderId.get(providerChannelId);

    if (!channelId) {
      diagnostics.push(
        dataQualityDiagnostic(
          'warning',
          'unmapped-provider-channel',
          `Programme references unmapped provider channel ${providerChannelId || '(missing)'}.`,
          {
            ...(providerChannelId ? { providerChannelId } : {}),
            ...(providerProgrammeId ? { providerProgrammeId } : {}),
          },
        ),
      );
      continue;
    }

    const title = nonEmptyText(external.title);
    if (!title) {
      diagnostics.push(
        dataQualityDiagnostic('error', 'missing-title', 'Programme title is missing.', {
          providerChannelId,
          ...(providerProgrammeId ? { providerProgrammeId } : {}),
          channelId,
        }),
      );
      continue;
    }

    const startMs = parsedTimestamp(external.startAt);
    if (startMs === null) {
      diagnostics.push(
        dataQualityDiagnostic(
          'error',
          'invalid-start',
          `Invalid programme start: ${external.startAt ?? '(missing)'}`,
          {
            providerChannelId,
            ...(providerProgrammeId ? { providerProgrammeId } : {}),
            channelId,
          },
        ),
      );
      continue;
    }

    const endMs = parsedTimestamp(external.endAt);
    if (endMs === null) {
      diagnostics.push(
        dataQualityDiagnostic(
          'error',
          'invalid-end',
          `Invalid programme end: ${external.endAt ?? '(missing)'}`,
          {
            providerChannelId,
            ...(providerProgrammeId ? { providerProgrammeId } : {}),
            channelId,
          },
        ),
      );
      continue;
    }

    if (endMs <= startMs) {
      diagnostics.push(
        dataQualityDiagnostic('error', 'invalid-range', 'Programme must end after it starts.', {
          providerChannelId,
          ...(providerProgrammeId ? { providerProgrammeId } : {}),
          channelId,
        }),
      );
      continue;
    }

    const duplicateKey = providerProgrammeKey(external, providerChannelId, startMs, endMs, title);
    if (seenProviderProgrammes.has(duplicateKey)) {
      diagnostics.push(
        dataQualityDiagnostic(
          'warning',
          'duplicate-provider-programme',
          'Duplicate provider programme was ignored.',
          {
            providerChannelId,
            ...(providerProgrammeId ? { providerProgrammeId } : {}),
            channelId,
          },
        ),
      );
      continue;
    }
    seenProviderProgrammes.add(duplicateKey);

    const programme = canonicalProgramme(
      providerKey,
      channelId,
      external,
      startMs,
      endMs,
      title,
    );
    programmes.push(programme);
    classificationsByProgrammeId.set(
      programme.id,
      classifyExternalProgramme({
        providerKey,
        programmeId: programme.id,
        programme: external,
      }),
    );
  }

  programmes.sort((left, right) => {
    const channelDifference = left.channelId.localeCompare(right.channelId);
    if (channelDifference !== 0) return channelDifference;
    const startDifference = Date.parse(left.startAt) - Date.parse(right.startAt);
    if (startDifference !== 0) return startDifference;
    return left.id.localeCompare(right.id);
  });

  addOverlapDiagnostics(programmes, diagnostics);

  return {
    schedule: {
      generatedAt: new Date(generatedAtMs).toISOString(),
      timezone: 'Europe/Amsterdam',
      channels: [...input.canonicalChannels].sort((left, right) => left.sortOrder - right.sortOrder),
      programmes,
    },
    classifications: programmes.map((programme) => {
      const classification = classificationsByProgrammeId.get(programme.id);
      if (!classification) {
        throw new Error(`Missing programme classification for ${programme.id}`);
      }
      return classification;
    }),
    diagnostics,
    resolvedChannelMappings: mappingResolution.mappings,
  };
}
