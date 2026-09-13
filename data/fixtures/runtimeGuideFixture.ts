import type { GuideFixture } from '../domain/epg';
import { guideDayStart } from '../domain/guideTime';
import { guideFixture } from './guideFixture';

const FIXTURE_START_MS = Math.min(
  ...guideFixture.programmes.map((programme) => Date.parse(programme.startAt)),
);

/**
 * Align the deterministic fixture to midnight in Europe/Amsterdam.
 * Programme spacing, durations, ids and edge cases remain unchanged.
 * The 49 elapsed hours cover two complete Amsterdam calendar days, including
 * a daylight-saving transition. This is a finite test horizon, not live EPG.
 */
export function buildRuntimeGuideFixture(nowMs = Date.now()): GuideFixture {
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
 * Runtime fixture days are relative labels: today + tomorrow. Rebuild as soon
 * as the Amsterdam calendar day changes so those labels and the finite horizon
 * cannot remain anchored to yesterday after midnight or a long background.
 */
export function runtimeGuideFixtureNeedsRefresh(fixture: GuideFixture, nowMs: number): boolean {
  const generatedAtMs = Date.parse(fixture.generatedAt);
  if (!Number.isFinite(generatedAtMs)) return true;
  return guideDayStart(generatedAtMs) !== guideDayStart(nowMs);
}

export function programmesForRuntimeChannel(fixture: GuideFixture, channelId: string) {
  return fixture.programmes.filter((programme) => programme.channelId === channelId);
}
