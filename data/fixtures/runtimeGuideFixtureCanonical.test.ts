import { afterEach, describe, expect, it } from 'vitest';

import type { GuideSchedule } from '../domain/epg';
import {
  clearRuntimeGuideSchedule,
  installRuntimeGuideSchedule,
} from '../runtime/guideScheduleRuntime';
import {
  buildRuntimeGuideFixture,
  runtimeGuideFixtureNeedsRefresh,
} from './runtimeGuideFixture';

const canonical: GuideSchedule = {
  generatedAt: '2026-09-13T21:30:00.000Z',
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
  programmes: [],
};

afterEach(() => clearRuntimeGuideSchedule());

describe('canonical runtime Guide schedule', () => {
  it('does not treat older canonical freshness as an obsolete UI day', () => {
    const anchorMs = Date.parse('2026-09-14T10:00:00Z');
    installRuntimeGuideSchedule(canonical, anchorMs);
    const runtime = buildRuntimeGuideFixture(anchorMs);

    expect(runtime).toBe(canonical);
    expect(runtimeGuideFixtureNeedsRefresh(runtime, Date.parse('2026-09-14T20:00:00Z'))).toBe(false);
  });

  it('still requests a rebuild after the installed Amsterdam day ends', () => {
    const anchorMs = Date.parse('2026-09-14T10:00:00Z');
    installRuntimeGuideSchedule(canonical, anchorMs);
    const runtime = buildRuntimeGuideFixture(anchorMs);

    expect(runtimeGuideFixtureNeedsRefresh(runtime, Date.parse('2026-09-14T23:00:00Z'))).toBe(true);
  });
});
