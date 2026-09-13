import type { GuideFixture } from '../domain/epg';
import { guideFixture } from './guideFixture';

const FIXTURE_START_MS = Math.min(
  ...guideFixture.programmes.map((programme) => Date.parse(programme.startAt)),
);

/**
 * Rebase the deterministic fixture onto the user's current local day for
 * manual device testing. Programme spacing, durations, ids and edge cases
 * stay deterministic; only timestamps shift.
 *
 * Teevee is Netherlands-first. Device tests therefore align the 49-hour
 * fixture to local midnight, yielding two complete guide days plus one hour.
 */
export function buildRuntimeGuideFixture(nowMs = Date.now()): GuideFixture {
  const localMidnight = new Date(nowMs);
  localMidnight.setHours(0, 0, 0, 0);
  const shiftMs = localMidnight.getTime() - FIXTURE_START_MS;

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
