import { describe, expect, it } from 'vitest';

import type { Channel } from '../../data/domain/epg.ts';
import type { ChannelMapping } from './provider.ts';
import {
  EPG_REFRESH_MAX_WORK_ITEMS_PER_RUN,
  EPG_REFRESH_SOURCES,
  hostedRefreshProviderChannelIds,
  planGuideHorizonRefreshWorkItems,
  resolveEpgRefreshWindowScope,
  resolveEpgRefreshWorkItemScope,
  scheduledEpgRefreshRequestKey,
  type EpgRefreshSourceConfig,
} from './refreshTopology.ts';

function source(
  key: string,
  providerIds: readonly string[],
  maxProviderChannelsPerWorkItem: number,
): EpgRefreshSourceConfig {
  const canonicalChannels: Channel[] = providerIds.map((providerId, index) => ({
    id: `${key}-canonical-${index + 1}`,
    name: `${key} ${index + 1}`,
    displayName: `${key} ${index + 1}`,
    sortOrder: index + 1,
    isActive: true,
  }));
  const channelMappings: ChannelMapping[] = providerIds.map((providerChannelId, index) => ({
    providerChannelId,
    channelId: canonicalChannels[index]!.id,
  }));
  return {
    key,
    providerKey: key,
    url: `https://example.test/${key}.xml`,
    canonicalChannels,
    channelMappings,
    maxProviderChannelsPerWorkItem,
  };
}

describe('EPG refresh topology', () => {
  it('derives one stable idempotency key per six-hour scheduled refresh bucket', () => {
    expect(scheduledEpgRefreshRequestKey(Date.parse('2026-09-24T06:17:00Z')))
      .toBe('cron:2026-09-24T06');
    expect(scheduledEpgRefreshRequestKey(Date.parse('2026-09-24T11:59:59Z')))
      .toBe('cron:2026-09-24T06');
    expect(scheduledEpgRefreshRequestKey(Date.parse('2026-09-24T12:17:00Z')))
      .toBe('cron:2026-09-24T12');
  });

  it('plans the 49-channel runtime as bounded NL and BE television-day jobs', () => {
    const providerChannelIds = hostedRefreshProviderChannelIds();
    const workItems = planGuideHorizonRefreshWorkItems({
      anchorMs: Date.parse('2026-09-24T09:00:00Z'),
      requestedProviderChannelIds: providerChannelIds,
    });

    expect(EPG_REFRESH_SOURCES).toHaveLength(2);
    expect(providerChannelIds).toHaveLength(49);
    expect(workItems).toHaveLength(60);

    const dayZero = workItems.filter(({ dayOffset }) => dayOffset === 0);
    expect(dayZero).toHaveLength(5);
    expect(dayZero.map(({ sourceKey, providerChannelIds: ids }) => [
      sourceKey,
      ids.length,
    ])).toEqual([
      ['iptv-epg-nl', 12],
      ['iptv-epg-nl', 12],
      ['iptv-epg-nl', 12],
      ['iptv-epg-be', 12],
      ['iptv-epg-be', 1],
    ]);
    expect(new Set(dayZero.flatMap(({ canonicalChannelIds }) => canonicalChannelIds)).size)
      .toBe(49);
    expect(new Set(workItems.map(({ dayOffset }) => dayOffset)).size).toBe(12);
  });

  it('plans multiple provider sources and multiple channel groups per day without changing orchestration semantics', () => {
    const sources = [
      source('nl', ['nl-1', 'nl-2', 'nl-3', 'nl-4', 'nl-5'], 2),
      source('be', ['be-1', 'be-2', 'be-3'], 2),
    ];
    const workItems = planGuideHorizonRefreshWorkItems({
      anchorMs: Date.parse('2026-09-24T09:00:00Z'),
      requestedProviderChannelIds: hostedRefreshProviderChannelIds(sources),
      sources,
    });

    expect(workItems).toHaveLength(60);
    const dayZero = workItems.filter(({ dayOffset }) => dayOffset === 0);
    expect(dayZero).toEqual([
      expect.objectContaining({
        sourceKey: 'nl',
        channelGroupKey: 'group-1',
        providerChannelIds: ['nl-1', 'nl-2'],
        canonicalChannelIds: ['nl-canonical-1', 'nl-canonical-2'],
      }),
      expect.objectContaining({
        sourceKey: 'nl',
        channelGroupKey: 'group-2',
        providerChannelIds: ['nl-3', 'nl-4'],
        canonicalChannelIds: ['nl-canonical-3', 'nl-canonical-4'],
      }),
      expect.objectContaining({
        sourceKey: 'nl',
        channelGroupKey: 'group-3',
        providerChannelIds: ['nl-5'],
        canonicalChannelIds: ['nl-canonical-5'],
      }),
      expect.objectContaining({
        sourceKey: 'be',
        channelGroupKey: 'group-1',
        providerChannelIds: ['be-1', 'be-2'],
        canonicalChannelIds: ['be-canonical-1', 'be-canonical-2'],
      }),
      expect.objectContaining({
        sourceKey: 'be',
        channelGroupKey: 'group-2',
        providerChannelIds: ['be-3'],
        canonicalChannelIds: ['be-canonical-3'],
      }),
    ]);
  });

  it('fits the approved 49-channel multi-source catalog at group size one', () => {
    const nlIds = Array.from({ length: 36 }, (_, index) => `nl-${index + 1}`);
    const beIds = Array.from({ length: 13 }, (_, index) => `be-${index + 1}`);
    const sources = [
      source('nl', nlIds, 1),
      source('be', beIds, 1),
    ];

    const workItems = planGuideHorizonRefreshWorkItems({
      anchorMs: Date.parse('2026-09-24T09:00:00Z'),
      requestedProviderChannelIds: hostedRefreshProviderChannelIds(sources),
      sources,
    });

    expect(workItems).toHaveLength(49 * 12);
    expect(workItems).toHaveLength(588);
    expect(workItems.length).toBeLessThanOrEqual(EPG_REFRESH_MAX_WORK_ITEMS_PER_RUN);
    expect(workItems.every(({ providerChannelIds }) => providerChannelIds.length === 1))
      .toBe(true);
    expect(workItems.every(({ canonicalChannelIds }) => canonicalChannelIds.length === 1))
      .toBe(true);
    expect(new Set(workItems.map(({ sourceKey }) => sourceKey))).toEqual(
      new Set(['nl', 'be']),
    );
  });

  it('keeps Amsterdam DST television-day boundaries in every source/group child', () => {
    const workItems = planGuideHorizonRefreshWorkItems({
      anchorMs: Date.parse('2026-10-24T12:00:00Z'),
      requestedProviderChannelIds: hostedRefreshProviderChannelIds(),
    });
    const dayZero = workItems.find(({ dayOffset }) => dayOffset === 0);

    expect(dayZero).toMatchObject({
      from: '2026-10-24T04:00:00.000Z',
      to: '2026-10-25T05:00:00.000Z',
    });
    expect(Date.parse(dayZero!.to) - Date.parse(dayZero!.from)).toBe(25 * 60 * 60 * 1000);
  });

  it('limits a requested provider subset before work-item creation', () => {
    const workItems = planGuideHorizonRefreshWorkItems({
      anchorMs: Date.parse('2026-09-24T09:00:00Z'),
      requestedProviderChannelIds: ['RTL4.nl'],
    });

    expect(workItems).toHaveLength(12);
    expect(workItems.every(({ providerChannelIds }) =>
      providerChannelIds.length === 1 && providerChannelIds[0] === 'RTL4.nl')).toBe(true);
    expect(workItems.every(({ canonicalChannelIds }) => canonicalChannelIds.length === 1))
      .toBe(true);
  });

  it('resolves manual windows to their unique provider source and rejects cross-source windows', () => {
    const sources = [
      source('nl', ['nl-1', 'nl-2'], 2),
      source('be', ['be-1', 'be-2'], 2),
    ];

    const beScope = resolveEpgRefreshWindowScope({
      providerChannelIds: ['be-2'],
      sources,
    });
    expect(beScope.source.key).toBe('be');
    expect(beScope.providerChannelIds).toEqual(['be-2']);
    expect(beScope.canonicalChannels.map(({ id }) => id)).toEqual(['be-canonical-2']);

    expect(() => resolveEpgRefreshWindowScope({
      providerChannelIds: ['nl-1', 'be-1'],
      sources,
    })).toThrow('cannot span multiple provider sources');
  });

  it('resolves one claimed work item to only its source-owned canonical scope', () => {
    const sources = [source('nl', ['nl-1', 'nl-2', 'nl-3'], 2)];
    const scope = resolveEpgRefreshWorkItemScope({
      sourceKey: 'nl',
      providerChannelIds: ['nl-3', 'nl-1'],
      sources,
    });

    expect(scope.providerChannelIds).toEqual(['nl-3', 'nl-1']);
    expect(scope.channelMappings.map(({ providerChannelId }) => providerChannelId)).toEqual([
      'nl-3',
      'nl-1',
    ]);
    expect(scope.canonicalChannels.map(({ id }) => id)).toEqual([
      'nl-canonical-1',
      'nl-canonical-3',
    ]);
  });

  it('fails closed on ambiguous source, provider-channel or canonical-channel ownership', () => {
    const nl = source('nl', ['nl-1', 'nl-2'], 2);

    expect(() => hostedRefreshProviderChannelIds([
      nl,
      { ...source('nl', ['other-1'], 1) },
    ])).toThrow('Duplicate EPG refresh source key: nl');

    const duplicateProvider = source('be', ['nl-1'], 1);
    expect(() => hostedRefreshProviderChannelIds([nl, duplicateProvider]))
      .toThrow('Provider channel nl-1 is owned by multiple refresh sources');

    const be = source('be', ['be-1'], 1);
    const overlappingCanonical: EpgRefreshSourceConfig = {
      ...be,
      canonicalChannels: [{
        ...be.canonicalChannels[0]!,
        id: nl.canonicalChannels[0]!.id,
      }],
      channelMappings: [{
        providerChannelId: 'be-1',
        channelId: nl.canonicalChannels[0]!.id,
      }],
    };
    expect(() => hostedRefreshProviderChannelIds([nl, overlappingCanonical]))
      .toThrow('is owned by multiple refresh sources');
  });

  it('fails closed when a source-owned canonical channel has no provider mapping', () => {
    const base = source('nl', ['nl-1', 'nl-2'], 2);
    const incomplete: EpgRefreshSourceConfig = {
      ...base,
      channelMappings: base.channelMappings.slice(0, 1),
    };

    expect(() => hostedRefreshProviderChannelIds([incomplete]))
      .toThrow('Source nl is missing provider mappings for canonical channels: nl-canonical-2');
  });

  it('rejects unknown sources, cross-source channels and oversized groups', () => {
    const sources = [
      source('nl', ['nl-1', 'nl-2'], 1),
      source('be', ['be-1'], 1),
    ];

    expect(() => resolveEpgRefreshWorkItemScope({
      sourceKey: 'missing',
      providerChannelIds: ['nl-1'],
      sources,
    })).toThrow('Unsupported EPG refresh source');

    expect(() => resolveEpgRefreshWorkItemScope({
      sourceKey: 'nl',
      providerChannelIds: ['be-1'],
      sources,
    })).toThrow('does not belong to source nl');

    expect(() => resolveEpgRefreshWorkItemScope({
      sourceKey: 'nl',
      providerChannelIds: ['nl-1', 'nl-2'],
      sources,
    })).toThrow('exceeds source channel-group capacity');
  });
});
