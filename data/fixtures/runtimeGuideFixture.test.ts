import { afterEach, describe, expect, it } from 'vitest';

import type { GuideSchedule } from '../domain/epg';
import { guideTelevisionDayStart } from '../domain/guideTime';
import {
  clearRuntimeGuideSchedule,
  installRuntimeGuideSchedule,
} from '../runtime/guideScheduleRuntime';
import { guideFixture } from './guideFixture';
import {
  buildRuntimeGuideFixture,
  buildTelevisionDayGuideFixture,
  runtimeGuideFixtureNeedsRefresh,
} from './runtimeGuideFixture';

const HOUR_MS = 3_600_000;

afterEach(() => clearRuntimeGuideSchedule());

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

  it.each([
    ['normal', '2026-09-13T10:00:00Z'],
    ['spring DST', '2026-03-28T12:00:00Z'],
    ['fall DST', '2026-10-24T12:00:00Z'],
  ] as const)('aligns selected %s fallback to the exact television-day boundary for 49 real hours', (_label, input) => {
    const anchorMs = Date.parse(input);
    const televisionDayStartMs = guideTelevisionDayStart(anchorMs);
    const runtime = buildTelevisionDayGuideFixture(anchorMs);
    const starts = runtime.programmes.map((programme) => Date.parse(programme.startAt));
    const ends = runtime.programmes.map((programme) => Date.parse(programme.endAt));

    expect(Math.min(...starts)).toBe(televisionDayStartMs);
    expect(Math.max(...ends)).toBe(televisionDayStartMs + 49 * HOUR_MS);
    expect(runtime.channels).toEqual(guideFixture.channels);
    expect(runtime.programmes.map((programme) => programme.id)).toEqual(
      guideFixture.programmes.map((programme) => programme.id),
    );
  });

  it('treats an explicitly supplied 06:00 television-day start as the selected fixture anchor', () => {
    const dayStartMs = Date.parse('2026-09-13T04:00:00Z');
    const runtime = buildRuntimeGuideFixture(dayStartMs);
    const firstProgrammeStart = Math.min(
      ...runtime.programmes.map((programme) => Date.parse(programme.startAt)),
    );

    expect(firstProgrammeStart).toBe(dayStartMs);
  });

  it('prefers installed canonical data for the matching television day across midnight', () => {
    const anchorMs = Date.parse('2026-09-14T10:00:00Z');
    const canonical: GuideSchedule = {
      generatedAt: '2026-09-14T06:00:00Z',
      timezone: 'Europe/Amsterdam',
      channels: [
        {
          id: 'nl-npo-1',
          name: 'NPO 1',
          displayName: 'NPO 1',
          sortOrder: 0,
          isActive: true,
        },
      ],
      programmes: [],
    };
    installRuntimeGuideSchedule(canonical, anchorMs);

    expect(buildRuntimeGuideFixture(anchorMs)).toBe(canonical);
    expect(buildRuntimeGuideFixture(Date.parse('2026-09-14T22:00:00Z'))).toBe(canonical); // 00:00 CEST
    expect(buildRuntimeGuideFixture(Date.parse('2026-09-15T03:59:00Z'))).toBe(canonical); // 05:59 CEST
    expect(buildRuntimeGuideFixture(Date.parse('2026-09-15T04:00:00Z')).channels).toHaveLength(48);
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
