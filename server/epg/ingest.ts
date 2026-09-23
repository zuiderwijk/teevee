import type { Channel, GuideSchedule } from '@/data/domain/epg';
import type { ProgrammeClassification } from '@/data/domain/programmeClassification';

import type { DataQualityDiagnostic } from './diagnostics';
import { normaliseProviderSchedule } from './normalise.ts';
import type {
  ChannelMapping,
  EpgProvider,
  ProviderScheduleBatch,
} from './provider';
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

export type IngestProviderScheduleResult = {
  schedule: GuideSchedule;
  diagnostics: DataQualityDiagnostic[];
  write: IngestWriteResult;
};

export type ObserveProviderScheduleInput = {
  provider: EpgProvider;
  canonicalChannels: Channel[];
  channelMappings: ChannelMapping[];
  providerChannelIds: string[];
  from: Date;
  to: Date;
  clock?: () => Date;
};

export type ProviderScheduleObservation = {
  from: string;
  to: string;
  observedAt: string;
  coverage: ProviderScheduleBatch['coverage'];
  schedule: GuideSchedule;
  classifications: ProgrammeClassification[];
  diagnostics: DataQualityDiagnostic[];
  requestedCanonicalChannelIds: Channel['id'][];
  safeChannelIds: Channel['id'][];
  hasUnattributedProviderRecord: boolean;
};

export type IngestProviderScheduleInput = ObserveProviderScheduleInput & {
  repository: ScheduleRepository;
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
 * Fetches and normalises one provider observation without mutating canonical storage.
 *
 * Coverage remains descriptive here. Callers decide whether the observation is
 * authoritative enough for destructive schedule replacement or only suitable for
 * an exact-match sibling recovery.
 */
export async function observeProviderSchedule(
  input: ObserveProviderScheduleInput,
): Promise<ProviderScheduleObservation> {
  const fromMs = validDate(input.from, 'from');
  const toMs = validDate(input.to, 'to');
  if (toMs <= fromMs) throw new Error('to must be after from');

  const providerChannelIds = requestedProviderChannels(input.providerChannelIds);
  const requestedProviderIds = new Set(providerChannelIds);

  const clock = input.clock ?? (() => new Date());
  const observedAt = clock();
  validDate(observedAt, 'clock result');

  const batch = await input.provider.getSchedule({
    from: new Date(fromMs),
    to: new Date(toMs),
    channelIds: providerChannelIds,
  });

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

  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    observedAt: observedAt.toISOString(),
    coverage: batch.coverage,
    schedule: normalised.schedule,
    classifications: normalised.classifications,
    diagnostics: normalised.diagnostics,
    requestedCanonicalChannelIds,
    safeChannelIds,
    hasUnattributedProviderRecord: normalised.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === 'unmapped-provider-channel' &&
        diagnostic.providerChannelId === undefined,
    ),
  };
}

/**
 * Fetches one provider window, normalises it, and replaces only canonical channel
 * scopes that are safe to treat as authoritative. Provider/network errors propagate;
 * the repository is not mutated until normalisation and write-scope checks finish.
 */
export async function ingestProviderSchedule(
  input: IngestProviderScheduleInput,
): Promise<IngestProviderScheduleResult> {
  const observation = await observeProviderSchedule(input);

  if (observation.coverage === 'partial') {
    return {
      schedule: observation.schedule,
      diagnostics: observation.diagnostics,
      write: {
        status: 'skipped',
        channelIds: observation.safeChannelIds,
        reason: 'partial-provider-coverage',
      },
    };
  }

  if (observation.hasUnattributedProviderRecord) {
    return {
      schedule: observation.schedule,
      diagnostics: observation.diagnostics,
      write: {
        status: 'skipped',
        channelIds: observation.safeChannelIds,
        reason: 'unattributed-provider-record',
      },
    };
  }

  if (observation.safeChannelIds.length === 0) {
    return {
      schedule: observation.schedule,
      diagnostics: observation.diagnostics,
      write: {
        status: 'skipped',
        channelIds: [],
        reason: 'no-safe-channel-scope',
      },
    };
  }

  const result = await input.repository.replaceWindow({
    from: observation.from,
    to: observation.to,
    channelIds: observation.safeChannelIds,
    schedule: observation.schedule,
    classifications: observation.classifications,
  });

  if (result.status === 'ignored-stale') {
    return {
      schedule: observation.schedule,
      diagnostics: observation.diagnostics,
      write: {
        status: 'ignored-stale',
        channelIds: observation.safeChannelIds,
        result,
      },
    };
  }

  return {
    schedule: observation.schedule,
    diagnostics: observation.diagnostics,
    write: { status: 'stored', channelIds: observation.safeChannelIds, result },
  };
}
