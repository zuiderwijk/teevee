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
 * Return installed provider-independent canonical data when available for this
 * Amsterdam day; otherwise align the deterministic fixture to today + tomorrow.
 * Programme spacing, durations, ids and edge cases in fixture mode remain unchanged.
 *
 * This legacy/current-runtime fallback intentionally keeps its proven strict-midnight
 * alignment. Selected Phase 4 television-day views use the dedicated helper below.
 */
export function buildRuntimeGuideFixture(nowMs = Date.now()): GuideFixture {
  const installed = runtimeGuideScheduleFor(nowMs);
  if (installed) return installed;
  return alignDeterministicGuideFixture(nowMs, guideDayStart(nowMs));
}

/**
 * Align the same deterministic 49-hour source fixture to a selected television day.
 *
 * The source's 49 real hours cover two complete adjacent television-day windows even
 * across the 25-hour fall-DST day. This gives Totaal a continuous bounded fallback
 * across the next 06:00 boundary while Per zender consumes only the selected-day slice.
 * No synthetic programme metadata, ids, spacing or durations are changed.
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
