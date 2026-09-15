import { describe, expect, it, vi } from 'vitest';

import { guideTelevisionDayHorizon } from '@/data/domain/guideTime';

import type { GuideScheduleApi } from './guideScheduleContract';
import { loadTelevisionDayGuideSchedule } from './guideScheduleLoader';

const HOUR_MS = 3_600_000;

function apiWithResult(result: Awaited<ReturnType<GuideScheduleApi['getSchedule']>>) {
  return { getSchedule: vi.fn().mockResolvedValue(result) } satisfies GuideScheduleApi;
}

const emptySchedule = {
  generatedAt: '2026-09-15T08:00:00.000Z',
  timezone: 'Europe/Amsterdam' as const,
  channels: [],
  programmes: [],
};

describe('loadTelevisionDayGuideSchedule', () => {
  it.each([
    ['D-2', 0],
    ['D+7', 9],
  ] as const)('requests %s as exactly one bounded television-day window', async (_label, index) => {
    const nowMs = Date.parse('2026-09-15T17:00:00Z');
    const window = guideTelevisionDayHorizon(nowMs)[index]!;
    const api = apiWithResult({ status: 'ok', schedule: emptySchedule });

    await expect(loadTelevisionDayGuideSchedule(api, window.fromMs)).resolves.toBe(emptySchedule);

    expect(api.getSchedule).toHaveBeenCalledTimes(1);
    expect(api.getSchedule).toHaveBeenCalledWith({
      from: new Date(window.fromMs).toISOString(),
      to: new Date(window.toMs).toISOString(),
    });
  });

  it.each([
    ['spring', '2026-03-28T05:00:00Z', 23],
    ['fall', '2026-10-24T04:00:00Z', 25],
  ] as const)('keeps the %s DST request individually bounded', async (_label, dayStart, hours) => {
    const api = apiWithResult({ status: 'ok', schedule: emptySchedule });

    await loadTelevisionDayGuideSchedule(api, Date.parse(dayStart));

    const request = api.getSchedule.mock.calls[0]![0];
    expect(Date.parse(request.to) - Date.parse(request.from)).toBe(hours * HOUR_MS);
    expect(Date.parse(request.to) - Date.parse(request.from)).toBeLessThanOrEqual(25 * HOUR_MS);
  });

  it('returns null for an unavailable selected day without synthesizing a wider request', async () => {
    const api = apiWithResult({ status: 'unavailable' });
    const dayStart = Date.parse('2026-09-15T04:00:00Z');

    await expect(loadTelevisionDayGuideSchedule(api, dayStart)).resolves.toBeNull();
    expect(api.getSchedule).toHaveBeenCalledTimes(1);
  });
});
