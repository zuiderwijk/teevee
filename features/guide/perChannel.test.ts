import { describe, expect, it } from 'vitest';

import type { GuideFixture, Programme } from '@/data/domain/epg';

import {
  adjacentChannelIndex,
  buildProgrammeRows,
  currentProgrammeIdAt,
  currentProgrammeRowHeight,
  programmeRowForTimestamp,
  programmesForChannelDay,
  scheduleHeightForRows,
  scrollOffsetForTimestamp,
  standardProgrammeRowHeight,
  timestampForScrollOffset,
  viewportReferenceInset,
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
    programme('short', '2026-09-13T08:00:00.000Z', '2026-09-13T08:05:00.000Z'),
    programme('inside', '2026-09-13T18:00:00.000Z', '2026-09-13T19:00:00.000Z'),
    programme('long', '2026-09-13T19:00:00.000Z', '2026-09-13T22:00:00.000Z'),
    {
      ...programme('other', '2026-09-13T18:00:00.000Z', '2026-09-13T19:00:00.000Z'),
      channelId: 'channel-2',
    },
  ],
};

describe('per-channel fixed-row schedule', () => {
  it('keeps programmes that intersect the selected Amsterdam day in chronological order', () => {
    expect(programmesForChannelDay(fixture, 'channel-1', dayStart, dayEnd).map(({ id }) => id)).toEqual([
      'overlap',
      'short',
      'inside',
      'long',
    ]);
  });

  it('gives every non-current programme the same row height regardless of duration', () => {
    const programmes = [
      programme('five-minutes', '2026-09-13T08:00:00.000Z', '2026-09-13T08:05:00.000Z'),
      programme('three-hours', '2026-09-13T09:00:00.000Z', '2026-09-13T12:00:00.000Z'),
    ];
    const rows = buildProgrammeRows(programmes, Date.parse('2026-09-13T13:00:00.000Z'), 1);

    expect(rows.map(({ height }) => height)).toEqual([52, 52]);
    expect(rows.map(({ top }) => top)).toEqual([0, 52]);
    expect(scheduleHeightForRows(rows)).toBe(104);
  });

  it('scales standard/current row types consistently with Dynamic Type', () => {
    expect(standardProgrammeRowHeight(1)).toBe(52);
    expect(standardProgrammeRowHeight(1.1)).toBe(57);
    expect(standardProgrammeRowHeight(1.35)).toBe(70);
    expect(standardProgrammeRowHeight(1.5)).toBe(78);
    expect(standardProgrammeRowHeight(2)).toBe(104);

    expect(currentProgrammeRowHeight(1)).toBe(120);
    expect(currentProgrammeRowHeight(1.1)).toBe(132);
    expect(currentProgrammeRowHeight(1.35)).toBe(162);
    expect(currentProgrammeRowHeight(1.5)).toBe(180);
    expect(currentProgrammeRowHeight(2)).toBe(240);
  });

  it('resolves at most one current row and uses real start/end time for progress', () => {
    const programmes = [
      programme('older-overlap', '2026-09-13T18:00:00.000Z', '2026-09-13T19:00:00.000Z'),
      programme('newer-overlap', '2026-09-13T18:15:00.000Z', '2026-09-13T18:45:00.000Z'),
      programme('after', '2026-09-13T19:00:00.000Z', '2026-09-13T20:00:00.000Z'),
    ];
    const nowMs = Date.parse('2026-09-13T18:30:00.000Z');
    const rows = buildProgrammeRows(programmes, nowMs, 1);

    expect(currentProgrammeIdAt(programmes, nowMs)).toBe('newer-overlap');
    expect(rows.filter(({ current }) => current)).toHaveLength(1);
    expect(rows.find(({ current }) => current)?.height).toBe(120);
    expect(rows.find(({ current }) => current)?.progress).toBeCloseTo(0.5, 5);
  });

  it('does not add proportional blank space for real schedule gaps', () => {
    const programmes = [
      programme('morning', '2026-09-13T08:00:00.000Z', '2026-09-13T09:00:00.000Z'),
      programme('evening', '2026-09-13T20:00:00.000Z', '2026-09-13T21:00:00.000Z'),
    ];
    const rows = buildProgrammeRows(programmes, Date.parse('2026-09-13T12:00:00.000Z'), 1);

    expect(rows[1]?.top).toBe(52);
  });

  it('preserves time context through programme timestamps rather than minutes-per-pixel', () => {
    const programmes = [
      programme('early', '2026-09-13T08:00:00.000Z', '2026-09-13T09:00:00.000Z'),
      programme('prime', '2026-09-13T18:00:00.000Z', '2026-09-13T22:00:00.000Z'),
      programme('late', '2026-09-13T22:00:00.000Z', '2026-09-13T23:00:00.000Z'),
    ];
    const rows = buildProgrammeRows(programmes, Date.parse('2026-09-14T00:00:00.000Z'), 1);
    const anchor = viewportReferenceInset(1);
    const primetime = Date.parse('2026-09-13T20:30:00.000Z');

    expect(programmeRowForTimestamp(rows, primetime)?.programme.id).toBe('prime');
    expect(scrollOffsetForTimestamp(rows, primetime, anchor)).toBe(0);
    expect(timestampForScrollOffset(rows, 52, 0, primetime)).toBe(Date.parse(programmes[1]!.startAt));
  });

  it('clamps adjacent channel navigation at the lineup edges', () => {
    expect(adjacentChannelIndex(0, -1, 3)).toBe(0);
    expect(adjacentChannelIndex(1, -1, 3)).toBe(0);
    expect(adjacentChannelIndex(1, 1, 3)).toBe(2);
    expect(adjacentChannelIndex(2, 1, 3)).toBe(2);
  });
});
