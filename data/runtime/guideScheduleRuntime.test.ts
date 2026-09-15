import { afterEach, describe, expect, it } from 'vitest';

import type { GuideSchedule } from '../domain/epg';
import {
  clearRuntimeGuideSchedule,
  guideScheduleContentEqual,
  installRuntimeGuideSchedule,
  runtimeGuideScheduleFor,
} from './guideScheduleRuntime';

const schedule: GuideSchedule = {
  generatedAt: '2026-09-14T06:00:00Z',
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
  programmes: [
    {
      id: 'programme-1',
      channelId: 'nl-npo-1',
      startAt: '2026-09-14T16:00:00Z',
      endAt: '2026-09-14T17:00:00Z',
      title: 'Nieuws',
    },
  ],
};

afterEach(() => clearRuntimeGuideSchedule());

describe('guideScheduleRuntime', () => {
  it('shares an installed schedule through midnight until the exact 06:00 television-day boundary', () => {
    installRuntimeGuideSchedule(schedule, Date.parse('2026-09-14T18:00:00Z')); // 20:00 CEST

    expect(runtimeGuideScheduleFor(Date.parse('2026-09-14T22:00:00Z'))).toBe(schedule); // 00:00
    expect(runtimeGuideScheduleFor(Date.parse('2026-09-15T03:59:00Z'))).toBe(schedule); // 05:59
    expect(runtimeGuideScheduleFor(Date.parse('2026-09-15T04:00:00Z'))).toBeNull(); // 06:00
  });

  it.each([
    [
      'spring DST',
      '2026-03-28T12:00:00Z',
      '2026-03-29T03:59:00Z', // 05:59 CEST
      '2026-03-29T04:00:00Z', // 06:00 CEST
    ],
    [
      'fall DST',
      '2026-10-24T12:00:00Z',
      '2026-10-25T04:59:00Z', // 05:59 CET
      '2026-10-25T05:00:00Z', // 06:00 CET
    ],
  ] as const)(
    'keeps the installed schedule anchored across the %s television day',
    (_label, anchor, beforeBoundary, boundary) => {
      installRuntimeGuideSchedule(schedule, Date.parse(anchor));

      expect(runtimeGuideScheduleFor(Date.parse(beforeBoundary))).toBe(schedule);
      expect(runtimeGuideScheduleFor(Date.parse(boundary))).toBeNull();
    },
  );

  it('clears installed runtime data explicitly', () => {
    installRuntimeGuideSchedule(schedule, Date.parse('2026-09-14T10:00:00Z'));
    clearRuntimeGuideSchedule();
    expect(runtimeGuideScheduleFor(Date.parse('2026-09-14T10:00:00Z'))).toBeNull();
  });

  it('treats identical deterministic canonical schedules as unchanged', () => {
    expect(
      guideScheduleContentEqual(schedule, {
        ...schedule,
        channels: schedule.channels.map((channel) => ({ ...channel })),
        programmes: schedule.programmes.map((programme) => ({ ...programme })),
      }),
    ).toBe(true);
  });

  it('does not remount for a freshness-only update', () => {
    expect(
      guideScheduleContentEqual(schedule, {
        ...schedule,
        generatedAt: '2026-09-14T07:00:00Z',
      }),
    ).toBe(true);
  });

  it('detects user-visible programme corrections', () => {
    expect(
      guideScheduleContentEqual(schedule, {
        ...schedule,
        programmes: [{ ...schedule.programmes[0]!, title: 'Gecorrigeerd nieuws' }],
      }),
    ).toBe(false);
  });
});
