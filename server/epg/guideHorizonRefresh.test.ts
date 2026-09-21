import { describe, expect, it, vi } from 'vitest';

import type { Channel } from '@/data/domain/epg';

import { guideTelevisionDayStart } from '@/data/domain/guideTime';

import { guideRefreshWindows, refreshGuideHorizon } from './guideHorizonRefresh';
import { InMemoryScheduleRepository } from './inMemoryScheduleRepository';
import type { EpgProvider, ProviderScheduleBatch, ProviderScheduleQuery } from './provider';
import { RepositoryGuideScheduleApi } from './scheduleService';

const channel: Channel = {
  id: 'channel-1',
  name: 'Een',
  displayName: 'Een',
  sortOrder: 0,
  isActive: true,
};

describe('guideRefreshWindows', () => {
  it('covers D-3 through D+8 as Amsterdam 06:00 television-day windows', () => {
    const anchor = Date.parse('2026-09-21T19:00:00Z');
    const windows = guideRefreshWindows(anchor);

    expect(windows).toHaveLength(12);
    expect(windows[0]).toEqual({
      offset: -3,
      from: '2026-09-18T04:00:00.000Z',
      to: '2026-09-19T04:00:00.000Z',
    });
    expect(windows.at(-1)).toEqual({
      offset: 8,
      from: '2026-09-29T04:00:00.000Z',
      to: '2026-09-30T04:00:00.000Z',
    });
  });

  it('keeps the fall-DST television day at its real 25-hour duration', () => {
    const anchor = Date.parse('2026-10-24T12:00:00Z');
    const today = guideRefreshWindows(anchor).find(({ offset }) => offset === 0);
    expect(today).toEqual({
      offset: 0,
      from: '2026-10-24T04:00:00.000Z',
      to: '2026-10-25T05:00:00.000Z',
    });
    expect(Date.parse(today!.to) - Date.parse(today!.from)).toBe(25 * 60 * 60 * 1000);
  });
});

describe('refreshGuideHorizon', () => {
  it('stores complete windows independently, skips partial provider coverage and shares one refresh timestamp', async () => {
    const anchor = Date.parse('2026-09-21T19:00:00Z');
    const firstPartialStart = guideTelevisionDayStart(anchor, 2);
    const repository = new InMemoryScheduleRepository();
    const clock = vi.fn(() => new Date('2026-09-21T19:05:00Z'));

    const provider: EpgProvider = {
      key: 'horizon-fixture',
      getChannels: vi.fn(async () => [{ id: 'raw-one', name: 'Raw One' }]),
      getSchedule: vi.fn(async (query: ProviderScheduleQuery): Promise<ProviderScheduleBatch> => ({
        coverage: query.from.getTime() < firstPartialStart ? 'complete' : 'partial',
        programmes: [
          {
            id: `raw-${query.from.toISOString()}`,
            channelId: 'raw-one',
            startAt: query.from.toISOString(),
            endAt: query.to.toISOString(),
            title: 'Doorlopend',
          },
        ],
      })),
    };

    const results = await refreshGuideHorizon({
      provider,
      repository,
      canonicalChannels: [channel],
      channelMappings: [{ providerChannelId: 'raw-one', channelId: 'channel-1' }],
      providerChannelIds: ['raw-one'],
      anchorMs: anchor,
      clock,
    });

    expect(clock).toHaveBeenCalledTimes(1);
    expect(provider.getSchedule).toHaveBeenCalledTimes(12);
    expect(results.filter(({ result }) => result.write.status === 'stored').map(({ offset }) => offset))
      .toEqual([-3, -2, -1, 0, 1]);
    expect(results.filter(({ result }) => result.write.status === 'skipped').map(({ offset }) => offset))
      .toEqual([2, 3, 4, 5, 6, 7, 8]);

    const api = new RepositoryGuideScheduleApi(repository);
    await expect(
      api.getSchedule({
        from: new Date(guideTelevisionDayStart(anchor, 1)).toISOString(),
        to: new Date(guideTelevisionDayStart(anchor, 2)).toISOString(),
      }),
    ).resolves.toMatchObject({ status: 'ok' });
    await expect(
      api.getSchedule({
        from: new Date(guideTelevisionDayStart(anchor, 2)).toISOString(),
        to: new Date(guideTelevisionDayStart(anchor, 3)).toISOString(),
      }),
    ).resolves.toEqual({ status: 'unavailable' });
  });
});
