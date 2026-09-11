import type { GuideFixture } from '../domain/epg';
import { guideFixture } from './guideFixture';

const FIXTURE_START_MS = Math.min(
  ...guideFixture.programmes.map((programme) => Date.parse(programme.startAt)),
);
const HOUR_MS = 60 * 60 * 1000;

/**
 * Rebase the deterministic fixture onto the user's current clock for manual
 * device testing. Programme spacing, durations, ids and edge cases stay
 * deterministic; only timestamps shift.
 */
export function buildRuntimeGuideFixture(nowMs = Date.now()): GuideFixture {
  // Put "now" 19 hours into the fixture so there is useful history and more
  // than a full day of schedule ahead for today/tomorrow testing.
  const desiredNowOffsetMs = 19 * HOUR_MS;
  const shiftMs = nowMs - (FIXTURE_START_MS + desiredNowOffsetMs);

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

export function programmesForRuntimeChannel(fixture: GuideFixture, channelId: string) {
  return fixture.programmes.filter((programme) => programme.channelId === channelId);
}
