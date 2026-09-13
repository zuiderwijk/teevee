import { describe, expect, it } from 'vitest';

import { guideFixture } from '../fixtures/guideFixture';
import { isProgrammeCurrent, programmeDurationMinutes, programmeProgress } from './epg';

describe('Guide fixture', () => {
  it('contains realistic multi-channel data covering at least 48 hours', () => {
    expect(guideFixture.channels.length).toBeGreaterThanOrEqual(12);
    expect(guideFixture.programmes.length).toBeGreaterThan(100);

    const starts = guideFixture.programmes.map((programme) => Date.parse(programme.startAt));
    const ends = guideFixture.programmes.map((programme) => Date.parse(programme.endAt));
    const coverageHours = (Math.max(...ends) - Math.min(...starts)) / 3_600_000;

    expect(coverageHours).toBeGreaterThanOrEqual(48);
  });

  it('contains missing metadata and schedule gaps as deliberate edge cases', () => {
    expect(guideFixture.programmes.some((programme) => programme.description === undefined)).toBe(true);

    const docu = guideFixture.programmes.filter((programme) => programme.channelId === 'channel-14');
    const hasGap = docu.some((programme, index) => {
      const next = docu[index + 1];
      return next !== undefined && Date.parse(next.startAt) > Date.parse(programme.endAt);
    });

    expect(hasGap).toBe(true);
  });
});

describe('programme timing helpers', () => {
  const programme = {
    id: 'test',
    channelId: 'channel-1',
    startAt: '2026-09-11T18:00:00.000Z',
    endAt: '2026-09-11T19:00:00.000Z',
    title: 'Test',
  };
  const start = Date.parse(programme.startAt);
  const end = Date.parse(programme.endAt);

  it('calculates duration in minutes', () => {
    expect(programmeDurationMinutes(programme)).toBe(60);
  });

  it('uses start-inclusive and end-exclusive current-programme semantics', () => {
    expect(isProgrammeCurrent(programme, start - 1)).toBe(false);
    expect(isProgrammeCurrent(programme, start)).toBe(true);
    expect(isProgrammeCurrent(programme, end - 1)).toBe(true);
    expect(isProgrammeCurrent(programme, end)).toBe(false);
  });

  it('clamps progress exactly at programme boundaries', () => {
    expect(programmeProgress(programme, start - 1)).toBe(0);
    expect(programmeProgress(programme, start)).toBe(0);
    expect(programmeProgress(programme, start + 30 * 60_000)).toBe(0.5);
    expect(programmeProgress(programme, end)).toBe(1);
    expect(programmeProgress(programme, end + 1)).toBe(1);
  });

  it('keeps Date input compatibility for callers outside the Guide', () => {
    expect(programmeProgress(programme, new Date(start + 15 * 60_000))).toBe(0.25);
  });
});
