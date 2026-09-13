import { describe, expect, it } from 'vitest';

import { guideFixture } from './guideFixture';
import { buildRuntimeGuideFixture, runtimeGuideFixtureNeedsRefresh } from './runtimeGuideFixture';

const HOUR_MS = 3_600_000;

describe('runtime Guide fixture', () => {
  it.each([
    ['2030-05-10T18:12:00Z', '2030-05-09T22:00:00Z'],
    ['2026-01-15T12:00:00Z', '2026-01-14T23:00:00Z'],
    ['2026-03-29T12:00:00Z', '2026-03-28T23:00:00Z'],
    ['2026-10-25T12:00:00Z', '2026-10-24T22:00:00Z'],
  ] as const)('aligns %s with Amsterdam midnight %s', (input, midnight) => {
    const nowMs = Date.parse(input);
    const runtime = buildRuntimeGuideFixture(nowMs);
    const starts = runtime.programmes.map((programme) => Date.parse(programme.startAt));
    const ends = runtime.programmes.map((programme) => Date.parse(programme.endAt));

    expect(runtime.generatedAt).toBe(new Date(nowMs).toISOString());
    expect(runtime.channels).toEqual(guideFixture.channels);
    expect(runtime.channels).toHaveLength(48);
    expect(runtime.programmes).toHaveLength(guideFixture.programmes.length);
    expect(Math.min(...starts)).toBe(Date.parse(midnight));
    expect(Math.max(...ends)).toBe(Date.parse(midnight) + 49 * HOUR_MS);
  });

  it('keeps programme data past 16:00 on both complete guide days', () => {
    const runtime = buildRuntimeGuideFixture(Date.parse('2026-09-13T04:45:00Z'));
    const eveningTimes = [
      Date.parse('2026-09-13T20:00:00+02:00'),
      Date.parse('2026-09-14T20:00:00+02:00'),
    ];

    for (const channel of runtime.channels) {
      for (const time of eveningTimes) {
        expect(runtime.programmes.some((programme) =>
          programme.channelId === channel.id &&
          Date.parse(programme.startAt) <= time &&
          Date.parse(programme.endAt) > time,
        )).toBe(true);
      }
    }
  });

  it('preserves every programme id, duration and metadata without mutating the source', () => {
    const originalSnapshot = JSON.stringify(guideFixture);
    const runtime = buildRuntimeGuideFixture(Date.parse('2030-05-10T18:12:00Z'));
    const shift = Date.parse('2030-05-09T22:00:00Z') - Date.parse('2026-09-11T00:00:00+02:00');

    guideFixture.programmes.forEach((original, index) => {
      expect(runtime.programmes[index]).toEqual({
        ...original,
        startAt: new Date(Date.parse(original.startAt) + shift).toISOString(),
        endAt: new Date(Date.parse(original.endAt) + shift).toISOString(),
      });
    });
    expect(JSON.stringify(guideFixture)).toBe(originalSnapshot);
  });

  it('is deterministic for a supplied instant', () => {
    const nowMs = Date.parse('2030-05-10T18:12:00Z');
    expect(buildRuntimeGuideFixture(nowMs)).toEqual(buildRuntimeGuideFixture(nowMs));
  });

  it('keeps the fixture while the Amsterdam calendar day is unchanged', () => {
    const runtime = buildRuntimeGuideFixture(Date.parse('2026-09-13T08:00:00+02:00'));
    expect(runtimeGuideFixtureNeedsRefresh(runtime, Date.parse('2026-09-13T23:59:59+02:00'))).toBe(false);
  });

  it.each([
    ['normal midnight', '2026-09-13T23:30:00+02:00', '2026-09-14T00:00:00+02:00'],
    ['spring DST day', '2026-03-28T23:30:00+01:00', '2026-03-29T00:00:00+01:00'],
    ['autumn DST day', '2026-10-24T23:30:00+02:00', '2026-10-25T00:00:00+02:00'],
  ] as const)('requests a rebuild at the next Amsterdam day: %s', (_label, builtAt, nextDay) => {
    const runtime = buildRuntimeGuideFixture(Date.parse(builtAt));
    expect(runtimeGuideFixtureNeedsRefresh(runtime, Date.parse(nextDay))).toBe(true);
  });

  it('requests a rebuild when a device clock moves to another calendar day', () => {
    const runtime = buildRuntimeGuideFixture(Date.parse('2026-09-13T12:00:00+02:00'));
    expect(runtimeGuideFixtureNeedsRefresh(runtime, Date.parse('2026-09-12T23:59:00+02:00'))).toBe(true);
  });
});
