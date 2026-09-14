import { describe, expect, it, vi } from 'vitest';

import type { GuideSchedule } from '@/data/domain/epg';

import { loadTwoDayGuideSchedule, mergeGuideSchedules } from './guideScheduleLoader';

function schedule(
  generatedAt: string,
  programmes: GuideSchedule['programmes'],
): GuideSchedule {
  return {
    generatedAt,
    timezone: 'Europe/Amsterdam',
    channels: [
      {
        id: 'nl-npo-1',
        name: 'NPO 1',
        displayName: 'NPO 1',
        sortOrder: 0,
        isActive: true,
      },
    ],
    programmes,
  };
}

const crossingMidnight = {
  id: 'crossing',
  channelId: 'nl-npo-1',
  startAt: '2026-09-14T21:30:00.000Z',
  endAt: '2026-09-14T22:30:00.000Z',
  title: 'Over middernacht',
};

describe('mergeGuideSchedules', () => {
  it('deduplicates boundary programmes and keeps conservative freshness', () => {
    const merged = mergeGuideSchedules([
      schedule('2026-09-14T08:00:00Z', [
        {
          id: 'first',
          channelId: 'nl-npo-1',
          startAt: '2026-09-14T20:00:00Z',
          endAt: '2026-09-14T21:00:00Z',
          title: 'Eerste',
        },
        crossingMidnight,
      ]),
      schedule('2026-09-14T09:00:00Z', [
        crossingMidnight,
        {
          id: 'second',
          channelId: 'nl-npo-1',
          startAt: '2026-09-14T22:30:00Z',
          endAt: '2026-09-14T23:30:00Z',
          title: 'Tweede',
        },
      ]),
    ]);

    expect(merged.generatedAt).toBe('2026-09-14T08:00:00.000Z');
    expect(merged.programmes.map(({ id }) => id)).toEqual(['first', 'crossing', 'second']);
  });

  it('rejects conflicting duplicate canonical data instead of guessing', () => {
    expect(() =>
      mergeGuideSchedules([
        schedule('2026-09-14T08:00:00Z', [crossingMidnight]),
        schedule('2026-09-14T09:00:00Z', [
          { ...crossingMidnight, title: 'Andere titel' },
        ]),
      ]),
    ).toThrow('Conflicting canonical programme data');
  });
});

describe('loadTwoDayGuideSchedule', () => {
  it('requests today and tomorrow on Amsterdam calendar boundaries', async () => {
    const getSchedule = vi
      .fn()
      .mockResolvedValueOnce({ status: 'ok', schedule: schedule('2026-09-14T06:00:00Z', []) })
      .mockResolvedValueOnce({ status: 'ok', schedule: schedule('2026-09-14T07:00:00Z', []) });

    await expect(
      loadTwoDayGuideSchedule({ getSchedule }, Date.parse('2026-09-14T10:00:00Z')),
    ).resolves.toMatchObject({ timezone: 'Europe/Amsterdam' });

    expect(getSchedule).toHaveBeenNthCalledWith(1, {
      from: '2026-09-13T22:00:00.000Z',
      to: '2026-09-14T22:00:00.000Z',
    });
    expect(getSchedule).toHaveBeenNthCalledWith(2, {
      from: '2026-09-14T22:00:00.000Z',
      to: '2026-09-15T22:00:00.000Z',
    });
  });

  it('requests the full 25-hour Amsterdam winter-time day without fixed-24h arithmetic', async () => {
    const getSchedule = vi.fn().mockResolvedValue({
      status: 'ok',
      schedule: schedule('2026-10-25T06:00:00Z', []),
    });

    await loadTwoDayGuideSchedule({ getSchedule }, Date.parse('2026-10-25T12:00:00Z'));

    expect(getSchedule).toHaveBeenNthCalledWith(1, {
      from: '2026-10-24T22:00:00.000Z',
      to: '2026-10-25T23:00:00.000Z',
    });
  });

  it('returns null when either canonical day is unavailable', async () => {
    const getSchedule = vi
      .fn()
      .mockResolvedValueOnce({ status: 'ok', schedule: schedule('2026-09-14T06:00:00Z', []) })
      .mockResolvedValueOnce({ status: 'unavailable' });

    await expect(
      loadTwoDayGuideSchedule({ getSchedule }, Date.parse('2026-09-14T10:00:00Z')),
    ).resolves.toBeNull();
  });
});
