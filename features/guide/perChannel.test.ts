import { describe, expect, it } from 'vitest';

import type { GuideFixture, Programme } from '@/data/domain/epg';

import {
  adjacentChannelIndex,
  currentProgrammePresentationForNormalizedHeight,
  normalizedProgrammeHeight,
  perChannelCollapseProgress,
  perChannelMinuteHeightForFontScale,
  programmeDensityForNormalizedHeight,
  programmeVerticalFrame,
  programmesForChannelDay,
  scheduleTimeForY,
  scheduleYForTime,
} from './perChannel';

const dayStart = Date.parse('2026-09-13T00:00:00+02:00');
const dayEnd = Date.parse('2026-09-14T00:00:00+02:00');

function programme(id: string, startAt: string, endAt: string): Programme {
  return { id, channelId: 'channel-1', title: id, startAt, endAt };
}

const fixture: GuideFixture = {
  generatedAt: '2026-09-13T10:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels: [
    { id: 'channel-1', name: 'Een', displayName: 'Een', sortOrder: 0, isActive: true },
    { id: 'channel-2', name: 'Twee', displayName: 'Twee', sortOrder: 1, isActive: true },
  ],
  programmes: [
    programme('before', '2026-09-12T21:00:00.000Z', '2026-09-12T22:00:00.000Z'),
    programme('overlap', '2026-09-12T21:30:00.000Z', '2026-09-12T22:30:00.000Z'),
    programme('inside', '2026-09-13T18:00:00.000Z', '2026-09-13T19:00:00.000Z'),
    programme('boundary', '2026-09-13T21:00:00.000Z', '2026-09-13T22:00:00.000Z'),
    {
      ...programme('other', '2026-09-13T18:00:00.000Z', '2026-09-13T19:00:00.000Z'),
      channelId: 'channel-2',
    },
  ],
};

describe('per-channel schedule geometry', () => {
  it('keeps programmes that intersect the selected Amsterdam day', () => {
    expect(programmesForChannelDay(fixture, 'channel-1', dayStart, dayEnd).map(({ id }) => id)).toEqual([
      'overlap',
      'inside',
      'boundary',
    ]);
  });

  it('clips programme geometry to the selected day', () => {
    const overlap = fixture.programmes.find(({ id }) => id === 'overlap')!;
    expect(programmeVerticalFrame(overlap, dayStart, dayEnd, 2)).toEqual({ top: 0, height: 60 });
  });

  it('round-trips a vertical offset through its time anchor', () => {
    const time = dayStart + 13.5 * 60 * 60_000;
    const y = scheduleYForTime(time, dayStart, 2.2);
    expect(scheduleTimeForY(y, dayStart, 2.2)).toBe(time);
  });

  it('uses the canonical 1.30 pt/min base scale and expands it with Dynamic Type', () => {
    expect(perChannelMinuteHeightForFontScale(1)).toBe(1.3);
    expect(perChannelMinuteHeightForFontScale(1.1)).toBeCloseTo(1.43, 6);
    expect(perChannelMinuteHeightForFontScale(1.35)).toBeCloseTo(1.755, 6);
    expect(perChannelMinuteHeightForFontScale(1.5)).toBeCloseTo(1.95, 6);
    expect(perChannelMinuteHeightForFontScale(Number.NaN)).toBe(1.3);
  });

  it('normalizes frame height against the same effective font scale', () => {
    expect(normalizedProgrammeHeight(105.3, 1.35)).toBeCloseTo(78, 6);
    expect(normalizedProgrammeHeight(78, 0.8)).toBe(78);
  });

  it('applies the canonical 20/32 title density thresholds', () => {
    expect(programmeDensityForNormalizedHeight(19.99)).toBe('hidden');
    expect(programmeDensityForNormalizedHeight(20)).toBe('compact');
    expect(programmeDensityForNormalizedHeight(31.99)).toBe('compact');
    expect(programmeDensityForNormalizedHeight(32)).toBe('normal');
  });

  it('applies the canonical 56/92 current-programme thresholds', () => {
    expect(currentProgrammePresentationForNormalizedHeight(55.99)).toEqual({
      density: 'normal',
      showProgress: false,
      showDescription: false,
    });
    expect(currentProgrammePresentationForNormalizedHeight(56)).toEqual({
      density: 'normal',
      showProgress: true,
      showDescription: false,
    });
    expect(currentProgrammePresentationForNormalizedHeight(92)).toEqual({
      density: 'normal',
      showProgress: true,
      showDescription: true,
    });
  });

  it('uses scroll-coupled collapse and the 28pt Reduce Motion switch', () => {
    expect(perChannelCollapseProgress(0, false)).toBe(0);
    expect(perChannelCollapseProgress(28, false)).toBe(0.5);
    expect(perChannelCollapseProgress(56, false)).toBe(1);
    expect(perChannelCollapseProgress(120, false)).toBe(1);
    expect(perChannelCollapseProgress(27.99, true)).toBe(0);
    expect(perChannelCollapseProgress(28, true)).toBe(1);
  });

  it('clamps adjacent channel navigation at the lineup edges', () => {
    expect(adjacentChannelIndex(0, -1, 3)).toBe(0);
    expect(adjacentChannelIndex(1, -1, 3)).toBe(0);
    expect(adjacentChannelIndex(1, 1, 3)).toBe(2);
    expect(adjacentChannelIndex(2, 1, 3)).toBe(2);
  });
});
