import type { GuideFixture } from '../domain/epg';
import { guideDayStart } from '../domain/guideTime';
import { runtimeGuideScheduleFor } from '../runtime/guideScheduleRuntime';
import { guideFixture } from './guideFixture';

const FIXTURE_START_MS = Math.min(
  ...guideFixture.programmes.map((programme) => Date.parse(programme.startAt)),
);

/**
 * Return installed provider-independent canonical data when available for this
 * Amsterdam day; otherwise align the deterministic fixture to today + tomorrow.
 * Programme spacing, durations, ids and edge cases in fixture mode remain unchanged.
 */
export function buildRuntimeGuideFixture(nowMs = Date.now()): GuideFixture {
  const installed = runtimeGuideScheduleFor(nowMs);
  if (installed) return installed;

  const shiftMs = guideDayStart(nowMs) - FIXTURE_START_MS;

  return {
    ...guideFixture,
    generatedAt: new Date(nowMs).toISOString(),
    programmes: guideFixture.programmes.map((programme) => ({
      ...programme,
      startAt: new Date(Date.parse(programme.startAt) + shiftMs).toISOString(),
      endAt: new Date(Date.parse(programme.endAt) + shiftMs).toISOString(),
    })),
  };
}

/**
 * Runtime Guide days are relative labels: today + tomorrow. Rebuild as soon as
 * the Amsterdam calendar day changes so the finite horizon cannot remain anchored
 * to yesterday after midnight or a long background interval.
 */
export function runtimeGuideFixtureNeedsRefresh(fixture: GuideFixture, nowMs: number): boolean {
  const generatedAtMs = Date.parse(fixture.generatedAt);
  if (!Number.isFinite(generatedAtMs)) return true;
  return guideDayStart(generatedAtMs) !== guideDayStart(nowMs);
}

export function programmesForRuntimeChannel(fixture: GuideFixture, channelId: string) {
  return fixture.programmes.filter((programme) => programme.channelId === channelId);
}
