import { describe, expect, it, vi } from 'vitest';

import { CANONICAL_CHANNEL_CATALOG } from '@/data/domain/channelCatalog';

import {
  buildPhysical49Schedule,
  buildPhysical49SearchResponse,
} from './physical49GuideClients';

describe('physical 49-channel client transport', () => {
  it('returns the exact canonical 49-channel contract for a requested window', () => {
    const response = buildPhysical49Schedule({
      from: '2026-09-25T04:00:00.000Z',
      to: '2026-09-26T04:00:00.000Z',
    });

    expect(response.schedule.channels.map(({ id }) => id)).toEqual(
      CANONICAL_CHANNEL_CATALOG.map(({ id }) => id),
    );
    expect(response.schedule.channels).toHaveLength(49);
    expect(new Set(response.schedule.programmes.map(({ channelId }) => channelId))).toEqual(
      new Set(CANONICAL_CHANNEL_CATALOG.map(({ id }) => id)),
    );
    expect(response.schedule.programmes.every(({ startAt, endAt }) =>
      Date.parse(startAt) < Date.parse(endAt),
    )).toBe(true);
  });

  it('honours the same channelIds schedule contract without changing canonical order', () => {
    const response = buildPhysical49Schedule({
      from: '2026-09-25T04:00:00.000Z',
      to: '2026-09-26T04:00:00.000Z',
      channelIds: ['be-vtm', 'nl-star-channel', 'nl-npo-1'],
    });

    expect(response.schedule.channels.map(({ id }) => id)).toEqual([
      'nl-npo-1',
      'nl-star-channel',
      'be-vtm',
    ]);
    expect(
      new Set(response.schedule.programmes.map(({ channelId }) => channelId)),
    ).toEqual(new Set(['nl-npo-1', 'nl-star-channel', 'be-vtm']));
  });

  it.each([
    ['FOX', 'nl-star-channel'],
    ['BBC First', 'nl-bbc-nl'],
    ['Play4', 'be-play'],
    ['Play5', 'be-play-fictie'],
    ['Play6', 'be-play-actie'],
    ['Play7', 'be-play-reality'],
    ['Ziggo Sport 1', 'nl-ziggo-sport'],
    ['VRT1', 'be-vrt-1'],
  ])('routes alias %s through the real Search request contract to %s', (query, id) => {
    const response = buildPhysical49SearchResponse({ query });
    expect(response.channelMatches.map((channel) => channel.id)).toContain(id);
  });

  it('returns newly added channels through the full-catalog Search transport', () => {
    for (const [query, id] of [
      ['Ziggo Sport 6', 'nl-ziggo-sport-6'],
      ['National Geographic', 'nl-national-geographic'],
      ['Play Crime', 'be-play-crime'],
      ['VTM Gold', 'be-vtm-gold'],
    ] as const) {
      expect(
        buildPhysical49SearchResponse({ query }).channelMatches.map(
          (channel) => channel.id,
        ),
      ).toContain(id);
    }
  });
});

describe('physical mode selector contract', () => {
  it('is explicitly opt-in and cannot activate outside a development runtime', async () => {
    vi.resetModules();
    const devModule = await import('./guideApiRuntime');
    expect(devModule.physical49ModeEnabled('1', true)).toBe(true);
    expect(devModule.physical49ModeEnabled('0', true)).toBe(false);
    expect(devModule.physical49ModeEnabled('1', false)).toBe(false);
  });
});
