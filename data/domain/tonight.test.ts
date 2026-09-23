import { describe, expect, it } from 'vitest';

import type { Programme } from './epg';
import {
  programmeBelongsToActiveTonightPlan,
  programmeHasEndedAt,
  programmeIntersectsWindow,
  programmeIsCurrentAt,
  programmeStartsInWindow,
  tonightClassificationCandidateProgrammeIds,
  tonightEveningDateLabel,
  tonightWindow,
} from './tonight';

function programme(
  id: string,
  startAt: string,
  endAt: string,
): Programme {
  return {
    id,
    channelId: 'nl-npo-1',
    startAt,
    endAt,
    title: id,
  };
}

describe('Tonight television-evening domain', () => {
  it('derives the frozen 18:00 / 19:00 / next-06:00 windows from ADR 0008', () => {
    const window = tonightWindow(Date.parse('2026-09-23T10:00:00+02:00'));
    expect(new Date(window.televisionDayStartMs).toISOString()).toBe(
      '2026-09-23T04:00:00.000Z',
    );
    expect(new Date(window.eveningStartMs).toISOString()).toBe(
      '2026-09-23T16:00:00.000Z',
    );
    expect(new Date(window.categoryStartMs).toISOString()).toBe(
      '2026-09-23T17:00:00.000Z',
    );
    expect(new Date(window.eveningEndMs).toISOString()).toBe(
      '2026-09-24T04:00:00.000Z',
    );
  });

  it('keeps 00:00-05:59 on the preceding evening and rolls exactly at 06:00', () => {
    expect(
      tonightEveningDateLabel(Date.parse('2026-09-24T05:59:59+02:00')),
    ).toContain('23 sep');
    expect(
      tonightEveningDateLabel(Date.parse('2026-09-24T06:00:00+02:00')),
    ).toContain('24 sep');
  });

  it.each([
    [
      'spring DST',
      '2026-03-28T12:00:00+01:00',
      23 * 60 * 60 * 1000,
    ],
    [
      'fall DST',
      '2026-10-24T12:00:00+02:00',
      25 * 60 * 60 * 1000,
    ],
  ] as const)('derives a DST-compatible television day: %s', (_label, anchor, duration) => {
    const window = tonightWindow(Date.parse(anchor));
    expect(window.eveningEndMs - window.televisionDayStartMs).toBe(duration);
  });

  it('uses exact [start,end) boundaries and saved-interval intersection semantics', () => {
    const from = Date.parse('2026-09-23T18:00:00+02:00');
    const to = Date.parse('2026-09-24T06:00:00+02:00');

    expect(
      programmeStartsInWindow(
        programme('at-start', '2026-09-23T18:00:00+02:00', '2026-09-23T18:30:00+02:00'),
        from,
        to,
      ),
    ).toBe(true);
    expect(
      programmeStartsInWindow(
        programme('at-end', '2026-09-24T06:00:00+02:00', '2026-09-24T06:30:00+02:00'),
        from,
        to,
      ),
    ).toBe(false);
    expect(
      programmeIntersectsWindow(
        programme('overlap', '2026-09-23T17:45:00+02:00', '2026-09-23T18:15:00+02:00'),
        from,
        to,
      ),
    ).toBe(true);
    expect(
      programmeIntersectsWindow(
        programme('ended-at-start', '2026-09-23T17:30:00+02:00', '2026-09-23T18:00:00+02:00'),
        from,
        to,
      ),
    ).toBe(false);
  });

  it('transitions upcoming -> current -> ended without changing broadcast timestamps', () => {
    const item = programme(
      'transition',
      '2026-09-23T20:00:00+02:00',
      '2026-09-23T21:00:00+02:00',
    );
    expect(programmeIsCurrentAt(item, Date.parse('2026-09-23T19:59:59+02:00'))).toBe(false);
    expect(programmeIsCurrentAt(item, Date.parse('2026-09-23T20:00:00+02:00'))).toBe(true);
    expect(programmeHasEndedAt(item, Date.parse('2026-09-23T20:59:59+02:00'))).toBe(false);
    expect(programmeHasEndedAt(item, Date.parse('2026-09-23T21:00:00+02:00'))).toBe(true);
  });

  it('keeps a saved broadcast that starts before 18:00 when it overlaps the evening', () => {
    expect(
      programmeBelongsToActiveTonightPlan(
        programme(
          'saved-overlap',
          '2026-09-23T17:45:00+02:00',
          '2026-09-23T18:10:00+02:00',
        ),
        Date.parse('2026-09-23T12:00:00+02:00'),
      ),
    ).toBe(true);
  });

  it('bounds classification candidates to current/future starts in [19:00,06:00)', () => {
    const nowMs = Date.parse('2026-09-23T20:30:00+02:00');
    const ids = tonightClassificationCandidateProgrammeIds(
      [
        programme('before-window', '2026-09-23T18:59:00+02:00', '2026-09-23T20:45:00+02:00'),
        programme('ended', '2026-09-23T19:00:00+02:00', '2026-09-23T20:00:00+02:00'),
        programme('current', '2026-09-23T20:00:00+02:00', '2026-09-23T21:00:00+02:00'),
        programme('future', '2026-09-24T01:00:00+02:00', '2026-09-24T02:00:00+02:00'),
        programme('next-day', '2026-09-24T06:00:00+02:00', '2026-09-24T07:00:00+02:00'),
      ],
      nowMs,
    );
    expect(ids).toEqual(['current', 'future']);
  });
});
