import { afterEach, describe, expect, it } from 'vitest';

import type { GuideSchedule } from '../domain/epg';
import {
  clearRuntimeGuideSchedule,
  installRuntimeGuideSchedule,
  runtimeGuideScheduleFor,
} from './guideScheduleRuntime';

const schedule: GuideSchedule = {
  generatedAt: '2026-09-14T06:00:00Z',
  timezone: 'Europe/Amsterdam',
  channels: [],
  programmes: [],
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
});
