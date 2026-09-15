import { describe, expect, it, vi } from 'vitest';

import type { GuideSchedule } from '@/data/domain/epg';

import { loadTwoTelevisionDayGuideSchedule, mergeGuideSchedules } from './guideScheduleLoader';

const HOUR_MS = 3_600_000;

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

describe('loadTwoTelevisionDayGuideSchedule', () => {
  it('requests current D and D+1 as separate 06:00 Amsterdam windows', async () => {
    const getSchedule = vi
      .fn()
      .mockResolvedValueOnce({ status: 'ok', schedule: schedule('2026-09-15T06:00:00Z', []) })
      .mockResolvedValueOnce({ status: 'ok', schedule: schedule('2026-09-15T07:00:00Z', []) });

    await expect(
      loadTwoTelevisionDayGuideSchedule({ getSchedule }, Date.parse('2026-09-15T17:00:00Z')),
    ).resolves.toMatchObject({ timezone: 'Europe/Amsterdam' });

    expect(getSchedule).toHaveBeenCalledTimes(2);
    expect(getSchedule).toHaveBeenNthCalledWith(1, {
      from: '2026-09-15T04:00:00.000Z',
      to: '2026-09-16T04:00:00.000Z',
    });
    expect(getSchedule).toHaveBeenNthCalledWith(2, {
      from: '2026-09-16T04:00:00.000Z',
      to: '2026-09-17T04:00:00.000Z',
    });
  });

  it.each([
    [
      'exact midnight',
      '2026-09-14T22:00:00Z', // 00:00 CEST Sep 15
      '2026-09-14T04:00:00.000Z',
      '2026-09-15T04:00:00.000Z',
    ],
    [
      '05:59',
      '2026-09-15T03:59:00Z', // 05:59 CEST
      '2026-09-14T04:00:00.000Z',
      '2026-09-15T04:00:00.000Z',
    ],
    [
      'exact 06:00',
      '2026-09-15T04:00:00Z', // 06:00 CEST
      '2026-09-15T04:00:00.000Z',
      '2026-09-16T04:00:00.000Z',
    ],
  ] as const)('anchors the first hosted window correctly at %s', async (_label, input, from, to) => {
    const getSchedule = vi.fn().mockResolvedValue({
      status: 'ok',
      schedule: schedule('2026-09-15T06:00:00Z', []),
    });

    await loadTwoTelevisionDayGuideSchedule({ getSchedule }, Date.parse(input));

    expect(getSchedule).toHaveBeenNthCalledWith(1, { from, to });
  });

  it.each([
    [
      'spring',
      '2026-03-28T12:00:00Z',
      '2026-03-28T05:00:00.000Z',
      '2026-03-29T04:00:00.000Z',
      23,
    ],
    [
      'fall',
      '2026-10-24T12:00:00Z',
      '2026-10-24T04:00:00.000Z',
      '2026-10-25T05:00:00.000Z',
      25,
    ],
  ] as const)(
    'keeps the first bounded hosted read DST-correct across the %s transition',
    async (_season, input, from, to, hours) => {
      const getSchedule = vi.fn().mockResolvedValue({
        status: 'ok',
        schedule: schedule('2026-09-15T06:00:00Z', []),
      });

      await loadTwoTelevisionDayGuideSchedule({ getSchedule }, Date.parse(input));

      expect(getSchedule).toHaveBeenNthCalledWith(1, { from, to });
      expect(Date.parse(to) - Date.parse(from)).toBe(hours * HOUR_MS);
      for (const [{ from: requestFrom, to: requestTo }] of getSchedule.mock.calls) {
        expect(Date.parse(requestTo) - Date.parse(requestFrom)).toBeLessThanOrEqual(25 * HOUR_MS);
      }
    },
  );

  it('returns null when either required television-day window is unavailable', async () => {
    const getSchedule = vi
      .fn()
      .mockResolvedValueOnce({ status: 'ok', schedule: schedule('2026-09-14T06:00:00Z', []) })
      .mockResolvedValueOnce({ status: 'unavailable' });

    await expect(
      loadTwoTelevisionDayGuideSchedule({ getSchedule }, Date.parse('2026-09-14T10:00:00Z')),
    ).resolves.toBeNull();
  });
});
