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
  it('shares an installed schedule only inside its Amsterdam anchor day', () => {
    installRuntimeGuideSchedule(schedule, Date.parse('2026-09-14T10:00:00Z'));

    expect(runtimeGuideScheduleFor(Date.parse('2026-09-14T20:00:00Z'))).toBe(schedule);
    expect(runtimeGuideScheduleFor(Date.parse('2026-09-14T23:00:00Z'))).toBeNull();
  });

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
