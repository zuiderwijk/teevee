import type { Channel, GuideSchedule, Programme } from '@/data/domain/epg';

import type { ChannelMapping, ExternalProgramme } from './provider';

export type DataQualitySeverity = 'warning' | 'error';

export type DataQualityCode =
  | 'invalid-channel-mapping'
  | 'duplicate-channel-mapping'
  | 'unknown-canonical-channel'
  | 'unmapped-provider-channel'
  | 'missing-title'
  | 'invalid-start'
  | 'invalid-end'
  | 'invalid-range'
  | 'duplicate-provider-programme'
  | 'overlapping-programmes';

export type DataQualityDiagnostic = {
  severity: DataQualitySeverity;
  code: DataQualityCode;
  message: string;
  providerChannelId?: string;
  providerProgrammeId?: string;
  channelId?: Channel['id'];
  programmeId?: Programme['id'];
};

export type NormaliseProviderScheduleInput = {
  providerKey: string;
  generatedAt: string;
  canonicalChannels: Channel[];
  channelMappings: ChannelMapping[];
  programmes: ExternalProgramme[];
};

export type NormaliseProviderScheduleResult = {
  schedule: GuideSchedule;
  diagnostics: DataQualityDiagnostic[];
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

function diagnostic(
  severity: DataQualitySeverity,
  code: DataQualityCode,
  message: string,
  context: {
    providerChannelId?: string;
    providerProgrammeId?: string;
    channelId?: Channel['id'];
    programmeId?: Programme['id'];
  } = {},
): DataQualityDiagnostic {
  return { severity, code, message, ...context };
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
          diagnostic(
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

/**
 * Converts provider output into Teevee's canonical schedule shape while keeping
 * malformed provider records observable but non-fatal to the rest of an ingest.
 */
export function normaliseProviderSchedule(
  input: NormaliseProviderScheduleInput,
): NormaliseProviderScheduleResult {
  const providerKey = input.providerKey.trim();
  if (!providerKey) throw new Error('providerKey must not be empty');

  const generatedAtMs = Date.parse(input.generatedAt);
  if (!Number.isFinite(generatedAtMs)) throw new Error('generatedAt must be a valid timestamp');

  const diagnostics: DataQualityDiagnostic[] = [];
  const canonicalById = new Map<Channel['id'], Channel>();

  for (const channel of input.canonicalChannels) {
    if (canonicalById.has(channel.id)) {
      throw new Error(`Duplicate canonical channel id: ${channel.id}`);
    }
    canonicalById.set(channel.id, channel);
  }

  const mappingByProviderId = new Map<string, Channel['id']>();
  const ambiguousProviderIds = new Set<string>();

  for (const mapping of input.channelMappings) {
    const providerChannelId = mapping.providerChannelId.trim();
    const channelId = mapping.channelId.trim();

    if (!providerChannelId || !channelId) {
      diagnostics.push(
        diagnostic('error', 'invalid-channel-mapping', 'Channel mappings require both provider and canonical ids.'),
      );
      continue;
    }

    if (!canonicalById.has(channelId)) {
      diagnostics.push(
        diagnostic(
          'error',
          'unknown-canonical-channel',
          `Provider channel ${providerChannelId} maps to unknown Teevee channel ${channelId}.`,
          { providerChannelId, channelId },
        ),
      );
      continue;
    }

    if (mappingByProviderId.has(providerChannelId) || ambiguousProviderIds.has(providerChannelId)) {
      mappingByProviderId.delete(providerChannelId);
      ambiguousProviderIds.add(providerChannelId);
      diagnostics.push(
        diagnostic(
          'error',
          'duplicate-channel-mapping',
          `Provider channel ${providerChannelId} has more than one mapping and is excluded from this ingest.`,
          { providerChannelId },
        ),
      );
      continue;
    }

    mappingByProviderId.set(providerChannelId, channelId);
  }

  const seenProviderProgrammes = new Set<string>();
  const programmes: Programme[] = [];

  for (const external of input.programmes) {
    const providerChannelId = nonEmptyText(external.channelId) ?? '';
    const providerProgrammeId = nonEmptyText(external.id);
    const channelId = ambiguousProviderIds.has(providerChannelId)
      ? undefined
      : mappingByProviderId.get(providerChannelId);

    if (!channelId) {
      diagnostics.push(
        diagnostic(
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
        diagnostic('error', 'missing-title', 'Programme title is missing.', {
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
        diagnostic('error', 'invalid-start', `Invalid programme start: ${external.startAt ?? '(missing)'}`, {
          providerChannelId,
          ...(providerProgrammeId ? { providerProgrammeId } : {}),
          channelId,
        }),
      );
      continue;
    }

    const endMs = parsedTimestamp(external.endAt);
    if (endMs === null) {
      diagnostics.push(
        diagnostic('error', 'invalid-end', `Invalid programme end: ${external.endAt ?? '(missing)'}`, {
          providerChannelId,
          ...(providerProgrammeId ? { providerProgrammeId } : {}),
          channelId,
        }),
      );
      continue;
    }

    if (endMs <= startMs) {
      diagnostics.push(
        diagnostic('error', 'invalid-range', 'Programme must end after it starts.', {
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
        diagnostic(
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

    programmes.push(canonicalProgramme(providerKey, channelId, external, startMs, endMs, title));
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
    diagnostics,
  };
}
