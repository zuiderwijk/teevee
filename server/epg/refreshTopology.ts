import type { Channel } from '../../data/domain/epg.ts';

import { guideRefreshWindows } from './guideHorizonRefresh.ts';
import {
  DEVELOPMENT_CHANNELS,
  IPTV_EPG_NL_CHANNEL_MAPPINGS,
} from './developmentChannelCatalog.ts';
import type { ChannelMapping } from './provider.ts';
import { DEFAULT_DEVELOPMENT_XMLTV_URL } from './xmltvProvider.ts';

export type EpgRefreshSourceConfig = {
  key: string;
  providerKey: string;
  url: string;
  canonicalChannels: readonly Channel[];
  channelMappings: readonly ChannelMapping[];
  /**
   * Operational capacity control backed by hosted measurements.
   *
   * This is deliberately source-specific and is not a product/catalog constant.
   * The immediately-following 49-channel expansion may lower this value and/or
   * add more source configs without changing the orchestration contract.
   */
  maxProviderChannelsPerWorkItem: number;
};

export type EpgRefreshWorkItemPlan = {
  sourceKey: string;
  dayOffset: number;
  from: string;
  to: string;
  channelGroupKey: string;
  providerChannelIds: string[];
};

/**
 * Current NL capacity baseline: one complete 12-channel television day measured
 * 1145 ms CPU in hosted v12 including canonical persistence and TMDB enrichment.
 * Keep this as an operational tuning value, never as an assumption in contracts.
 */
export const IPTV_EPG_NL_OPERATIONAL_MAX_PROVIDER_CHANNELS_PER_WORK_ITEM = 12;

export const EPG_REFRESH_SOURCES = [
  {
    key: 'iptv-epg-nl',
    providerKey: 'development-xmltv',
    url: DEFAULT_DEVELOPMENT_XMLTV_URL,
    canonicalChannels: DEVELOPMENT_CHANNELS,
    channelMappings: IPTV_EPG_NL_CHANNEL_MAPPINGS,
    maxProviderChannelsPerWorkItem:
      IPTV_EPG_NL_OPERATIONAL_MAX_PROVIDER_CHANNELS_PER_WORK_ITEM,
  },
] as const satisfies readonly EpgRefreshSourceConfig[];

function normalizedIds(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function sourceProviderChannelIds(source: EpgRefreshSourceConfig): string[] {
  return normalizedIds(source.channelMappings.map(({ providerChannelId }) => providerChannelId));
}

function partition<T>(values: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new Error('maxProviderChannelsPerWorkItem must be a positive integer');
  }

  const groups: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    groups.push(values.slice(index, index + size));
  }
  return groups;
}

export function scheduledEpgRefreshRequestKey(instantMs: number): string {
  if (!Number.isFinite(instantMs) || !Number.isFinite(new Date(instantMs).getTime())) {
    throw new Error('scheduled refresh request key requires a valid timestamp');
  }
  const instant = new Date(instantMs);
  const bucketHour = Math.floor(instant.getUTCHours() / 6) * 6;
  const bucket = new Date(Date.UTC(
    instant.getUTCFullYear(),
    instant.getUTCMonth(),
    instant.getUTCDate(),
    bucketHour,
  ));
  return `cron:${bucket.toISOString().slice(0, 13)}`;
}

export function hostedRefreshProviderChannelIds(
  sources: readonly EpgRefreshSourceConfig[] = EPG_REFRESH_SOURCES,
): string[] {
  return normalizedIds(sources.flatMap(sourceProviderChannelIds));
}

export function planGuideHorizonRefreshWorkItems(input: {
  anchorMs: number;
  requestedProviderChannelIds: readonly string[];
  sources?: readonly EpgRefreshSourceConfig[];
}): EpgRefreshWorkItemPlan[] {
  const sources = input.sources ?? EPG_REFRESH_SOURCES;
  const requested = new Set(normalizedIds(input.requestedProviderChannelIds));
  const allowed = new Set(hostedRefreshProviderChannelIds(sources));

  for (const providerChannelId of requested) {
    if (!allowed.has(providerChannelId)) {
      throw new Error(`Unsupported providerChannelIds value: ${providerChannelId}`);
    }
  }

  const workItems: EpgRefreshWorkItemPlan[] = [];
  for (const window of guideRefreshWindows(input.anchorMs)) {
    for (const source of sources) {
      const sourceIds = sourceProviderChannelIds(source).filter((id) => requested.has(id));
      const groups = partition(sourceIds, source.maxProviderChannelsPerWorkItem);
      for (const [groupIndex, providerChannelIds] of groups.entries()) {
        workItems.push({
          sourceKey: source.key,
          dayOffset: window.offset,
          from: window.from,
          to: window.to,
          channelGroupKey: `group-${groupIndex + 1}`,
          providerChannelIds,
        });
      }
    }
  }

  if (workItems.length === 0) {
    throw new Error('Guide-horizon refresh plan contains no work items');
  }
  return workItems;
}

export function resolveEpgRefreshWorkItemScope(input: {
  sourceKey: string;
  providerChannelIds: readonly string[];
  sources?: readonly EpgRefreshSourceConfig[];
}): {
  source: EpgRefreshSourceConfig;
  canonicalChannels: Channel[];
  channelMappings: ChannelMapping[];
  providerChannelIds: string[];
} {
  const sources = input.sources ?? EPG_REFRESH_SOURCES;
  const source = sources.find(({ key }) => key === input.sourceKey);
  if (!source) throw new Error(`Unsupported EPG refresh source: ${input.sourceKey}`);

  const providerChannelIds = normalizedIds(input.providerChannelIds);
  if (providerChannelIds.length === 0) {
    throw new Error('EPG refresh work item must contain at least one provider channel');
  }
  if (providerChannelIds.length > source.maxProviderChannelsPerWorkItem) {
    throw new Error('EPG refresh work item exceeds source channel-group capacity');
  }

  const mappingsByProviderId = new Map(
    source.channelMappings.map((mapping) => [mapping.providerChannelId, mapping]),
  );
  const mappings = providerChannelIds.map((providerChannelId) => {
    const mapping = mappingsByProviderId.get(providerChannelId);
    if (!mapping) {
      throw new Error(
        `Provider channel ${providerChannelId} does not belong to source ${source.key}`,
      );
    }
    return mapping;
  });

  const canonicalIds = new Set(mappings.map(({ channelId }) => channelId));
  const canonicalChannels = source.canonicalChannels.filter(({ id }) => canonicalIds.has(id));
  if (canonicalChannels.length !== canonicalIds.size) {
    throw new Error(`Source ${source.key} is missing canonical channel metadata`);
  }

  return {
    source,
    canonicalChannels: [...canonicalChannels],
    channelMappings: mappings.map((mapping) => ({ ...mapping })),
    providerChannelIds,
  };
}
