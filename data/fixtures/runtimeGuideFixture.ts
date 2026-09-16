import type { GuideFixture } from '../domain/epg';
import { guideDayStart, guideTelevisionDayStart } from '../domain/guideTime';
import { runtimeGuideScheduleFor } from '../runtime/guideScheduleRuntime';
import { guideFixture } from './guideFixture';

const FIXTURE_START_MS = Math.min(
  ...guideFixture.programmes.map((programme) => Date.parse(programme.startAt)),
);

function alignDeterministicGuideFixture(anchorMs: number, alignedStartMs: number): GuideFixture {
  const shiftMs = alignedStartMs - FIXTURE_START_MS;
  return {
    ...guideFixture,
    generatedAt: new Date(anchorMs).toISOString(),
    programmes: guideFixture.programmes.map((programme) => ({
      ...programme,
      startAt: new Date(Date.parse(programme.startAt) + shiftMs).toISOString(),
      endAt: new Date(Date.parse(programme.endAt) + shiftMs).toISOString(),
    })),
  };
}

/**
 * Return installed provider-independent canonical data when available; otherwise align
 * the deterministic fixture to the caller's requested Guide anchor.
 *
 * Normal runtime callers pass a real instant and retain the proven strict-midnight
 * fixture alignment. Phase 4 selected-day views pass the exact 06:00 television-day
 * boundary; an explicit boundary is therefore preserved as the fixture start. This keeps
 * one deterministic fixture source while giving selected views complete early-morning
 * coverage without changing ids, programme spacing, durations or metadata.
 */
export function buildRuntimeGuideFixture(nowMs = Date.now()): GuideFixture {
  const installed = runtimeGuideScheduleFor(nowMs);
  if (installed) return installed;

  const televisionDayStartMs = guideTelevisionDayStart(nowMs);
  const alignedStartMs = nowMs === televisionDayStartMs
    ? televisionDayStartMs
    : guideDayStart(nowMs);
  return alignDeterministicGuideFixture(nowMs, alignedStartMs);
}

/**
 * Align the same deterministic 49-hour source fixture to a selected television day.
 *
 * The source's 49 real hours cover two complete adjacent television-day windows even
 * across the 25-hour fall-DST day. This is also useful to make the selected-day fallback
 * contract explicit in focused tests without constructing synthetic programme data again.
 */
export function buildTelevisionDayGuideFixture(televisionDayAnchorMs: number): GuideFixture {
  const televisionDayStartMs = guideTelevisionDayStart(televisionDayAnchorMs);
  return alignDeterministicGuideFixture(televisionDayStartMs, televisionDayStartMs);
}

/**
 * Fixture-mode `generatedAt` doubles as its day anchor. Canonical schedules keep
 * `generatedAt` as server freshness instead, so their installed runtime day is the
 * authoritative anchor and must not be inferred from freshness.
 */
export function runtimeGuideFixtureNeedsRefresh(fixture: GuideFixture, nowMs: number): boolean {
  if (runtimeGuideScheduleFor(nowMs) === fixture) return false;

  const generatedAtMs = Date.parse(fixture.generatedAt);
  if (!Number.isFinite(generatedAtMs)) return true;
  return guideDayStart(generatedAtMs) !== guideDayStart(nowMs);
}

export function programmesForRuntimeChannel(fixture: GuideFixture, channelId: string) {
  return fixture.programmes.filter((programme) => programme.channelId === channelId);
}
