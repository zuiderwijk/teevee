import { describe, expect, it } from 'vitest';

import { guideDayStart } from './guideTime';

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
