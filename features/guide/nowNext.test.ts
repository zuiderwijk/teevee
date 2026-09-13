import { describe, expect, it } from 'vitest';

import type { GuideFixture, Programme } from '@/data/domain/epg';

import {
  clampReferenceTime,
  nearestSlotIndex,
  programmesAroundReference,
  timeSlotsForDay,
} from './nowNext';

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

  it('returns exactly three following programmes after the reference programme', () => {
    const result = programmesAroundReference(
      fixture,
      'one',
      Date.parse('2026-09-13T11:30:00+02:00'),
    );
    expect(result.referenceProgramme?.id).toBe('b');
    expect(result.followingProgrammes.map((programme) => programme.id)).toEqual(['c', 'd', 'e']);
  });

  it('keeps a gap honest while still surfacing the next three programmes', () => {
    const result = programmesAroundReference(
      fixture,
      'one',
      Date.parse('2026-09-13T12:15:00+02:00'),
    );
    expect(result.referenceProgramme).toBeNull();
    expect(result.followingProgrammes.map((programme) => programme.id)).toEqual(['c', 'd', 'e']);
  });
});

describe('reference-time helpers', () => {
  it('clamps to the selected calendar-day interval', () => {
    const start = 1_000;
    const end = 2_000;
    expect(clampReferenceTime(500, start, end)).toBe(start);
    expect(clampReferenceTime(1_500, start, end)).toBe(1_500);
    expect(clampReferenceTime(2_500, start, end)).toBe(end - 1);
  });

  it('creates elapsed-time slots without assuming a fixed 24-hour day', () => {
    const start = 0;
    const end = 23 * 60 * 60 * 1000;
    expect(timeSlotsForDay(start, end)).toHaveLength(46);
  });

  it('finds the nearest slot for live positioning', () => {
    const slots = [0, 30, 60, 90].map((minutes) => minutes * 60_000);
    expect(nearestSlotIndex(slots, 44 * 60_000)).toBe(1);
    expect(nearestSlotIndex(slots, 46 * 60_000)).toBe(2);
  });
});
