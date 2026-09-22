import { describe, expect, it, vi } from 'vitest';

import type { GuideSchedule } from '../../data/domain/epg';
import type { ProgrammeEditorialSignalRepository } from './editorialRepository';
import { refreshTvgidsEditorialSignals } from './refresh';
import type { TvgidsTipsSource } from './tvgidsTipsFeed';

const schedule: GuideSchedule = {
  generatedAt: '2026-09-22T17:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels: [
    {
      id: 'nl-rtl-4',
      name: 'RTL 4',
      displayName: 'RTL 4',
      sortOrder: 4,
      isActive: true,
    },
  ],
  programmes: [
    {
      id: 'programme-1',
      channelId: 'nl-rtl-4',
      startAt: '2026-09-22T18:30:00.000Z',
      endAt: '2026-09-22T19:30:00.000Z',
      title: 'Race Across the World',
    },
  ],
};

function source(
  items: Awaited<ReturnType<TvgidsTipsSource['fetchSnapshot']>>['items'],
): TvgidsTipsSource {
  return {
    async fetchSnapshot() {
      return { items, invalidItemCount: 0 };
    },
  };
}

function tip(sourceItemId: string, overrides: Record<string, string> = {}) {
  return {
    sourceItemId,
    title: 'Race Across the World',
    channelName: 'RTL 4',
    startAt: '2026-09-22T18:30:00.000Z',
    endAt: '2026-09-22T19:30:00.000Z',
    ...overrides,
  };
}

describe('TVgids editorial refresh', () => {
  it('persists deterministic matches and deduplicates source items + programme signals', async () => {
    const replaceSourceSnapshot = vi.fn().mockResolvedValue({
      status: 'stored',
      removedSignalCount: 0,
      storedSignalCount: 1,
    });
    const editorialRepository: ProgrammeEditorialSignalRepository = {
      replaceSourceSnapshot,
      async getSignalsForProgrammeIds() {
        return [];
      },
    };
    const scheduleRepository = {
      replaceWindow: vi.fn(),
      getSchedule: vi.fn().mockResolvedValue(schedule),
    };

    const result = await refreshTvgidsEditorialSignals({
      source: source([
        tip('duplicate'),
        tip('duplicate'),
        tip('second-source-item'),
        tip('unsupported', { channelName: 'BBC One' }),
      ]),
      scheduleRepository,
      editorialRepository,
      clock: () => new Date('2026-09-22T17:30:00.000Z'),
    });

    expect(result.storedSignalCount).toBe(1);
    expect(result.diagnostics).toMatchObject({
      feedItemsReceived: 4,
      tierBMatches: 2,
      unsupportedChannels: 1,
      duplicates: 2,
    });
    const write = replaceSourceSnapshot.mock.calls[0]![0];
    expect(write.signals).toHaveLength(1);
    expect(write.signals[0]).toMatchObject({
      programmeId: 'programme-1',
      type: 'kijktip',
      source: 'tvgids',
    });
  });

  it('records unavailable canonical coverage without inventing a match', async () => {
    const replaceSourceSnapshot = vi.fn().mockResolvedValue({
      status: 'stored',
      removedSignalCount: 0,
      storedSignalCount: 0,
    });

    const result = await refreshTvgidsEditorialSignals({
      source: source([tip('outside')]),
      scheduleRepository: {
        replaceWindow: vi.fn(),
        getSchedule: vi.fn().mockResolvedValue(null),
      },
      editorialRepository: {
        replaceSourceSnapshot,
        async getSignalsForProgrammeIds() {
          return [];
        },
      },
    });

    expect(result.diagnostics.outsideScheduleCoverage).toBe(1);
    expect(replaceSourceSnapshot.mock.calls[0]![0].signals).toEqual([]);
  });

  it('does not mutate persistence when the source refresh fails', async () => {
    const replaceSourceSnapshot = vi.fn();

    await expect(
      refreshTvgidsEditorialSignals({
        source: {
          async fetchSnapshot() {
            throw new Error('feed parse error');
          },
        },
        scheduleRepository: {
          replaceWindow: vi.fn(),
          getSchedule: vi.fn(),
        },
        editorialRepository: {
          replaceSourceSnapshot,
          async getSignalsForProgrammeIds() {
            return [];
          },
        },
      }),
    ).rejects.toThrow('feed parse error');

    expect(replaceSourceSnapshot).not.toHaveBeenCalled();
  });
});
