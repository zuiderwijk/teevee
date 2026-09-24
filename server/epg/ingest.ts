import type { Channel, GuideSchedule } from '@/data/domain/epg';

import type { DataQualityDiagnostic } from './diagnostics';
import {
  normaliseProviderSchedule,
  type NormalisedProgrammeObservation,
} from './normalise.ts';
import type { ChannelMapping, EpgProvider, ProviderScheduleBatch } from './provider';
import type { ScheduleRepository, ScheduleWindowWriteResult } from './scheduleRepository';

type StoredWindowResult = Extract<ScheduleWindowWriteResult, { status: 'stored' }>;
type IgnoredStaleWindowResult = Extract<ScheduleWindowWriteResult, { status: 'ignored-stale' }>;

export type IngestWriteResult =
  | {
      status: 'stored';
      channelIds: Channel['id'][];
      result: StoredWindowResult;
    }
  | {
      status: 'ignored-stale';
      channelIds: Channel['id'][];
      result: IgnoredStaleWindowResult;
    }
  | {
      status: 'skipped';
      channelIds: Channel['id'][];
      reason:
        | 'partial-provider-coverage'
        | 'unattributed-provider-record'
        | 'no-safe-channel-scope';
    };

export type StoredProviderScheduleObservation = {
  from: string;
  to: string;
  observedAt: string;
  channelIds: Channel['id'][];
  programmes: NormalisedProgrammeObservation[];
};

export type IngestProviderScheduleResult = {
  schedule: GuideSchedule;
  diagnostics: DataQualityDiagnostic[];
  write: IngestWriteResult;
  /**
   * Present only after an authoritative canonical write was stored. It carries the
   * exact transient provider evidence from that same observation for server-only
   * post-write enrichments and is never part of Guide transport.
   */
  storedObservation: StoredProviderScheduleObservation | null;
};

export type IngestProviderScheduleInput = {
  provider: EpgProvider;
  repository: ScheduleRepository;
  canonicalChannels: Channel[];
  channelMappings: ChannelMapping[];
  providerChannelIds: string[];
  /** Optional batch already fetched from the same provider observation/session. */
  providerBatch?: ProviderScheduleBatch;
  from: Date;
  to: Date;
  clock?: () => Date;
};

function validDate(value: Date, label: string): number {
  const timestamp = value.getTime();
  if (!Number.isFinite(timestamp)) throw new Error(`${label} must be a valid Date`);
  return timestamp;
}

function requestedProviderChannels(channelIds: string[]): string[] {
  const unique = new Set<string>();
  for (const channelId of channelIds) {
    const trimmed = channelId.trim();
    if (trimmed) unique.add(trimmed);
  }
  if (unique.size === 0) throw new Error('providerChannelIds must contain at least one channel');
  return [...unique];
}

/**
 * Fetches one provider window, normalises it, and replaces only canonical channel
 * scopes that are safe to treat as authoritative. Provider/network errors propagate;
 * the repository is not mutated until normalisation and write-scope checks finish.
 */
export async function ingestProviderSchedule(
  input: IngestProviderScheduleInput,
): Promise<IngestProviderScheduleResult> {
  const fromMs = validDate(input.from, 'from');
  const toMs = validDate(input.to, 'to');
  if (toMs <= fromMs) throw new Error('to must be after from');

  const providerChannelIds = requestedProviderChannels(input.providerChannelIds);
  const requestedProviderIds = new Set(providerChannelIds);

  const clock = input.clock ?? (() => new Date());
  const observedAt = clock();
  validDate(observedAt, 'clock result');

  const batch =
    input.providerBatch ??
    (await input.provider.getSchedule({
      from: new Date(fromMs),
      to: new Date(toMs),
      channelIds: providerChannelIds,
    }));

  const programmes = batch.programmes.filter((programme) => {
    const providerChannelId = programme.channelId?.trim();
    return !providerChannelId || requestedProviderIds.has(providerChannelId);
  });

  const normalised = normaliseProviderSchedule({
    providerKey: input.provider.key,
    generatedAt: observedAt.toISOString(),
    canonicalChannels: input.canonicalChannels,
    channelMappings: input.channelMappings,
    programmes,
  });

  const requestedCanonicalChannelIds = [
    ...new Set(
      normalised.resolvedChannelMappings
        .filter((mapping) => requestedProviderIds.has(mapping.providerChannelId))
        .map((mapping) => mapping.channelId),
    ),
  ];

  const blockedChannelIds = new Set(
    normalised.diagnostics
      .filter(
        (diagnostic): diagnostic is DataQualityDiagnostic & { channelId: Channel['id'] } =>
          diagnostic.severity === 'error' && diagnostic.channelId !== undefined,
      )
      .map((diagnostic) => diagnostic.channelId),
  );
  const safeChannelIds = requestedCanonicalChannelIds.filter(
    (channelId) => !blockedChannelIds.has(channelId),
  );

  if (batch.coverage === 'partial') {
    return {
      schedule: normalised.schedule,
      diagnostics: normalised.diagnostics,
      write: {
        status: 'skipped',
        channelIds: safeChannelIds,
        reason: 'partial-provider-coverage',
      },
      storedObservation: null,
    };
  }

  const hasUnattributedProviderRecord = normalised.diagnostics.some(
    (diagnostic) =>
      diagnostic.code === 'unmapped-provider-channel' && diagnostic.providerChannelId === undefined,
  );
  if (hasUnattributedProviderRecord) {
    return {
      schedule: normalised.schedule,
      diagnostics: normalised.diagnostics,
      write: {
        status: 'skipped',
        channelIds: safeChannelIds,
        reason: 'unattributed-provider-record',
      },
      storedObservation: null,
    };
  }

  if (safeChannelIds.length === 0) {
    return {
      schedule: normalised.schedule,
      diagnostics: normalised.diagnostics,
      write: {
        status: 'skipped',
        channelIds: [],
        reason: 'no-safe-channel-scope',
      },
      storedObservation: null,
    };
  }

  const result = await input.repository.replaceWindow({
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    channelIds: safeChannelIds,
    schedule: normalised.schedule,
    classifications: normalised.classifications,
  });

  if (result.status === 'ignored-stale') {
    return {
      schedule: normalised.schedule,
      diagnostics: normalised.diagnostics,
      write: { status: 'ignored-stale', channelIds: safeChannelIds, result },
      storedObservation: null,
    };
  }

  const safeChannels = new Set(safeChannelIds);
  const storedProgrammes = normalised.observations.filter(({ programme }) => {
    const startMs = Date.parse(programme.startAt);
    const endMs = Date.parse(programme.endAt);
    return (
      safeChannels.has(programme.channelId) &&
      startMs < toMs &&
      endMs > fromMs
    );
  });

  return {
    schedule: normalised.schedule,
    diagnostics: normalised.diagnostics,
    write: { status: 'stored', channelIds: safeChannelIds, result },
    storedObservation: {
      from: new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
      observedAt: normalised.schedule.generatedAt,
      channelIds: safeChannelIds,
      programmes: storedProgrammes,
    },
  };
}
