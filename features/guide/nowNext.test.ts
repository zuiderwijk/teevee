import { describe, expect, it } from 'vitest';

import type { GuideFixture, GuideSchedule, Programme } from '@/data/domain/epg';

import {
  clampReferenceTime,
  explicitRailActionAnimation,
  nearestSlotIndex,
  nowNextPrimetimeMs,
  nowNextTelevisionDayBounds,
  programmesAroundReference,
  railDragCommitsWithoutMomentum,
  railSlotIndexForOffset,
  resolveNowNextSchedulePresentation,
  resolveNowNextTemporalControlStates,
  timeSlotsForDay,
} from './nowNext';

const HOUR_MS = 3_600_000;

const programmes: Programme[] = [
  {
    id: 'a',
    channelId: 'one',
    title: 'A',
    startAt: '2026-09-13T10:00:00+02:00',
    endAt: '2026-09-13T11:00:00+02:00',
  },
  {
    id: 'b',
    channelId: 'one',
    title: 'B',
    startAt: '2026-09-13T11:00:00+02:00',
    endAt: '2026-09-13T12:00:00+02:00',
  },
  {
    id: 'c',
    channelId: 'one',
    title: 'C',
    startAt: '2026-09-13T12:30:00+02:00',
    endAt: '2026-09-13T13:00:00+02:00',
  },
  {
    id: 'd',
    channelId: 'one',
    title: 'D',
    startAt: '2026-09-13T13:00:00+02:00',
    endAt: '2026-09-13T14:00:00+02:00',
  },
  {
    id: 'e',
    channelId: 'one',
    title: 'E',
    startAt: '2026-09-13T14:00:00+02:00',
    endAt: '2026-09-13T15:00:00+02:00',
  },
];

const fixture: GuideFixture = {
  generatedAt: '2026-09-13T08:00:00Z',
  timezone: 'Europe/Amsterdam',
  channels: [
    { id: 'one', name: 'one', displayName: 'One', sortOrder: 1, isActive: true },
  ],
  programmes,
};

describe('Nu & Straks television-day semantics', () => {
  it('uses 06:00 to 06:00 bounds and keeps after-midnight instants on the preceding television day', () => {
    const afterMidnight = Date.parse('2026-09-15T00:30:00+02:00');
    expect(nowNextTelevisionDayBounds(afterMidnight)).toEqual({
      startMs: Date.parse('2026-09-14T06:00:00+02:00'),
      endMs: Date.parse('2026-09-15T06:00:00+02:00'),
    });
  });

  it('rolls the active television day exactly from 05:59:59 to 06:00', () => {
    expect(
      nowNextTelevisionDayBounds(Date.parse('2026-09-15T05:59:59+02:00')).startMs,
    ).toBe(Date.parse('2026-09-14T06:00:00+02:00'));
    expect(
      nowNextTelevisionDayBounds(Date.parse('2026-09-15T06:00:00+02:00')).startMs,
    ).toBe(Date.parse('2026-09-15T06:00:00+02:00'));
  });

  it('resolves Primetime after midnight to the preceding evening at 20:30', () => {
    expect(nowNextPrimetimeMs(Date.parse('2026-09-15T01:00:00+02:00'))).toBe(
      Date.parse('2026-09-14T20:30:00+02:00'),
    );
  });

  it.each([
    ['spring', '2026-03-28T12:00:00Z', 46],
    ['normal', '2026-09-18T12:00:00Z', 48],
    ['fall', '2026-10-24T12:00:00Z', 50],
  ] as const)('creates %s television-day rail with %s half-hour slots', (_label, anchor, count) => {
    const { startMs, endMs } = nowNextTelevisionDayBounds(Date.parse(anchor));
    expect((endMs - startMs) / HOUR_MS).toBe(count / 2);
    expect(timeSlotsForDay(startMs, endMs)).toHaveLength(count);
  });
});

describe('programmesAroundReference', () => {
  it('uses start-inclusive/end-exclusive reference semantics', () => {
    expect(
      programmesAroundReference(fixture, 'one', Date.parse('2026-09-13T11:00:00+02:00'))
        .referenceProgramme?.id,
    ).toBe('b');
    expect(
      programmesAroundReference(fixture, 'one', Date.parse('2026-09-13T12:00:00+02:00'))
        .referenceProgramme,
    ).toBeNull();
  });

  it('returns the reference programme plus exactly three following programmes when known', () => {
    const result = programmesAroundReference(
      fixture,
      'one',
      Date.parse('2026-09-13T11:30:00+02:00'),
    );
    expect(result.referenceProgramme?.id).toBe('b');
    expect(result.followingProgrammes.map((programme) => programme.id)).toEqual([
      'c',
      'd',
      'e',
    ]);
  });

  it('keeps a gap honest while still surfacing the next three known programmes', () => {
    const result = programmesAroundReference(
      fixture,
      'one',
      Date.parse('2026-09-13T12:15:00+02:00'),
    );
    expect(result.referenceProgramme).toBeNull();
    expect(result.followingProgrammes.map((programme) => programme.id)).toEqual([
      'c',
      'd',
      'e',
    ]);
  });
});

describe('reference-time and rail helpers', () => {
  it('clamps only at the active television-day boundaries', () => {
    const start = 1_000;
    const end = 2_000;
    expect(clampReferenceTime(500, start, end)).toBe(start);
    expect(clampReferenceTime(1_500, start, end)).toBe(1_500);
    expect(clampReferenceTime(2_500, start, end)).toBe(end - 1);
  });

  it('keeps the actual live instant while resolving only the nearest visual slot', () => {
    const slots = [0, 30, 60, 90].map((minutes) => minutes * 60_000);
    const liveInstant = 44 * 60_000;
    expect(clampReferenceTime(liveInstant, slots[0]!, 120 * 60_000)).toBe(liveInstant);
    expect(nearestSlotIndex(slots, liveInstant)).toBe(1);
  });

  it('commits the nearest native settled slot without requiring a second scroll command', () => {
    expect(railSlotIndexForOffset(151, 48, 76)).toBe(2);
    expect(railSlotIndexForOffset(-100, 48, 76)).toBe(0);
    expect(railSlotIndexForOffset(99999, 48, 76)).toBe(47);
  });

  it('commits end-drag only when native momentum is effectively absent', () => {
    expect(railDragCommitsWithoutMomentum(undefined)).toBe(true);
    expect(railDragCommitsWithoutMomentum(0)).toBe(true);
    expect(railDragCommitsWithoutMomentum(0.005)).toBe(true);
    expect(railDragCommitsWithoutMomentum(0.2)).toBe(false);
  });

  it('disables explicit recenter animation under Reduce Motion', () => {
    expect(explicitRailActionAnimation(false)).toBe(true);
    expect(explicitRailActionAnimation(true)).toBe(false);
  });
});

describe('Nu and Primetime semantic states', () => {
  const primetimeMs = Date.parse('2026-09-18T20:30:00+02:00');

  it('gives Nu precedence whenever the presentation is live', () => {
    expect(
      resolveNowNextTemporalControlStates({
        live: true,
        referenceMs: primetimeMs,
        primetimeMs,
      }),
    ).toEqual({ nu: 'active', primetime: 'action' });
  });

  it('marks Primetime active only in browse mode at the canonical target', () => {
    expect(
      resolveNowNextTemporalControlStates({
        live: false,
        referenceMs: primetimeMs,
        primetimeMs,
      }),
    ).toEqual({ nu: 'action', primetime: 'active' });
    expect(
      resolveNowNextTemporalControlStates({
        live: false,
        referenceMs: primetimeMs + 30 * 60_000,
        primetimeMs,
      }),
    ).toEqual({ nu: 'action', primetime: 'action' });
  });
});

describe('schedule presentation continuity', () => {
  const runtime: GuideSchedule = fixture;

  it('prefers canonical runtime schedule when available', () => {
    expect(resolveNowNextSchedulePresentation(runtime, fixture.channels, fixture)).toEqual({
      channels: fixture.channels,
      schedule: runtime,
      source: 'runtime',
    });
  });

  it('preserves an established channel catalogue while current-day data is temporarily unavailable', () => {
    expect(
      resolveNowNextSchedulePresentation(null, fixture.channels, fixture),
    ).toEqual({
      channels: fixture.channels,
      schedule: null,
      source: 'established-channels',
    });
  });

  it('uses the deterministic fixture only before a canonical catalogue is established', () => {
    expect(resolveNowNextSchedulePresentation(null, null, fixture)).toEqual({
      channels: fixture.channels,
      schedule: fixture,
      source: 'fixture',
    });
  });
});
