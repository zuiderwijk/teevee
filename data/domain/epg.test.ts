import { describe, expect, it } from 'vitest';

import { guideFixture } from '../fixtures/guideFixture';
import { programmeDurationMinutes, programmeProgress } from './epg';

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

describe('programme geometry helpers', () => {
  const programme = {
    id: 'test',
    channelId: 'channel-1',
    startAt: '2026-09-11T18:00:00.000Z',
    endAt: '2026-09-11T19:00:00.000Z',
    title: 'Test',
  };

  it('calculates duration in minutes', () => {
    expect(programmeDurationMinutes(programme)).toBe(60);
  });

  it('clamps progress before, during and after broadcast', () => {
    expect(programmeProgress(programme, new Date('2026-09-11T17:00:00.000Z'))).toBe(0);
    expect(programmeProgress(programme, new Date('2026-09-11T18:30:00.000Z'))).toBe(0.5);
    expect(programmeProgress(programme, new Date('2026-09-11T20:00:00.000Z'))).toBe(1);
  });
});
