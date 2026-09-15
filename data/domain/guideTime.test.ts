import { describe, expect, it } from 'vitest';

import {
  GUIDE_TELEVISION_DAY_OFFSETS,
  guideDayStart,
  guideTelevisionDayHorizon,
  guideTelevisionDayStart,
} from './guideTime';

const HOUR_MS = 3_600_000;

describe('Amsterdam guide calendar', () => {
  it.each([
    ['2026-09-13T04:45:00Z', 0, '2026-09-12T22:00:00Z'],
    ['2026-09-13T04:45:00Z', 1, '2026-09-13T22:00:00Z'],
    ['2026-01-15T12:00:00Z', 0, '2026-01-14T23:00:00Z'],
    ['2026-03-29T12:00:00Z', 0, '2026-03-28T23:00:00Z'],
    ['2026-03-29T12:00:00Z', 1, '2026-03-29T22:00:00Z'],
    ['2026-10-25T12:00:00Z', 0, '2026-10-24T22:00:00Z'],
    ['2026-10-25T12:00:00Z', 1, '2026-10-25T23:00:00Z'],
    ['2026-09-13T22:30:00Z', 0, '2026-09-13T22:00:00Z'],
    ['2026-12-31T12:00:00Z', 1, '2026-12-31T23:00:00Z'],
  ] as const)('resolves %s with day offset %s to %s', (input, offset, expected) => {
    expect(guideDayStart(Date.parse(input), offset)).toBe(Date.parse(expected));
  });

  it.each([
    ['2026-03-29T12:00:00Z', 23],
    ['2026-10-25T12:00:00Z', 25],
  ] as const)('uses calendar boundaries on %s, not a fixed 24-hour day', (input, hours) => {
    const now = Date.parse(input);
    expect(guideDayStart(now, 1) - guideDayStart(now)).toBe(hours * HOUR_MS);
  });

  it('uses the same day boundary for different instants within that day', () => {
    expect(guideDayStart(Date.parse('2026-10-25T00:30:00Z'))).toBe(
      guideDayStart(Date.parse('2026-10-25T20:30:00Z')),
    );
  });

  it('rejects invalid timestamps and fractional day offsets', () => {
    expect(() => guideDayStart(Number.NaN)).toThrow(RangeError);
    expect(() => guideDayStart(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => guideDayStart(0, 0.5)).toThrow(RangeError);
  });
});

describe('Teevee television day', () => {
  it.each([
    ['2026-09-15T03:59:59Z', 0, '2026-09-14T04:00:00Z'], // 05:59:59 CEST
    ['2026-09-15T04:00:00Z', 0, '2026-09-15T04:00:00Z'], // 06:00 CEST
    ['2026-09-14T22:30:00Z', 0, '2026-09-14T04:00:00Z'], // 00:30 CEST next calendar date
    ['2026-09-15T21:30:00Z', 0, '2026-09-15T04:00:00Z'], // 23:30 CEST
    ['2026-01-15T04:30:00Z', 0, '2026-01-14T05:00:00Z'], // 05:30 CET
    ['2026-01-15T05:00:00Z', 0, '2026-01-15T05:00:00Z'], // 06:00 CET
    ['2026-12-31T20:00:00Z', 1, '2027-01-01T05:00:00Z'],
  ] as const)('resolves %s with television-day offset %s to %s', (input, offset, expected) => {
    expect(guideTelevisionDayStart(Date.parse(input), offset)).toBe(Date.parse(expected));
  });

  it('keeps after-midnight Nu context on the preceding television day until 06:00', () => {
    const beforeBoundary = Date.parse('2026-09-15T03:30:00Z'); // 05:30 Amsterdam
    expect(guideTelevisionDayStart(beforeBoundary)).toBe(Date.parse('2026-09-14T04:00:00Z'));
  });

  it('produces a 23-hour television day across the spring DST transition', () => {
    const anchor = Date.parse('2026-03-29T12:00:00Z');
    expect(guideTelevisionDayStart(anchor) - guideTelevisionDayStart(anchor, -1)).toBe(
      23 * HOUR_MS,
    );
    expect(guideTelevisionDayStart(anchor, -1)).toBe(Date.parse('2026-03-28T05:00:00Z'));
    expect(guideTelevisionDayStart(anchor)).toBe(Date.parse('2026-03-29T04:00:00Z'));
  });

  it('produces a 25-hour television day across the fall DST transition', () => {
    const anchor = Date.parse('2026-10-25T12:00:00Z');
    expect(guideTelevisionDayStart(anchor) - guideTelevisionDayStart(anchor, -1)).toBe(
      25 * HOUR_MS,
    );
    expect(guideTelevisionDayStart(anchor, -1)).toBe(Date.parse('2026-10-24T04:00:00Z'));
    expect(guideTelevisionDayStart(anchor)).toBe(Date.parse('2026-10-25T05:00:00Z'));
  });

  it('returns exactly the D-2 through D+7 minimum product horizon', () => {
    const anchor = Date.parse('2026-09-15T17:00:00Z'); // 19:00 Amsterdam
    const horizon = guideTelevisionDayHorizon(anchor);

    expect(GUIDE_TELEVISION_DAY_OFFSETS).toEqual([-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]);
    expect(horizon).toHaveLength(10);
    expect(horizon.map((window) => window.offset)).toEqual(GUIDE_TELEVISION_DAY_OFFSETS);
    expect(horizon[0]).toEqual({
      offset: -2,
      fromMs: Date.parse('2026-09-13T04:00:00Z'),
      toMs: Date.parse('2026-09-14T04:00:00Z'),
    });
    expect(horizon.at(-1)).toEqual({
      offset: 7,
      fromMs: Date.parse('2026-09-22T04:00:00Z'),
      toMs: Date.parse('2026-09-23T04:00:00Z'),
    });

    for (let index = 1; index < horizon.length; index += 1) {
      expect(horizon[index - 1]!.toMs).toBe(horizon[index]!.fromMs);
    }
  });

  it('anchors the whole horizon to the preceding television day before 06:00', () => {
    const anchor = Date.parse('2026-09-15T03:30:00Z'); // 05:30 Amsterdam, still D = Sep 14
    const currentDay = guideTelevisionDayHorizon(anchor).find((window) => window.offset === 0);

    expect(currentDay).toEqual({
      offset: 0,
      fromMs: Date.parse('2026-09-14T04:00:00Z'),
      toMs: Date.parse('2026-09-15T04:00:00Z'),
    });
  });

  it('rejects invalid timestamps and fractional television-day offsets', () => {
    expect(() => guideTelevisionDayStart(Number.NaN)).toThrow(RangeError);
    expect(() => guideTelevisionDayStart(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => guideTelevisionDayStart(0, 0.5)).toThrow(RangeError);
    expect(() => guideTelevisionDayHorizon(Number.NaN)).toThrow(RangeError);
  });
});
