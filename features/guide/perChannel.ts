import { programmeProgress, type GuideFixture, type Programme } from '@/data/domain/epg';

import {
  currentProgrammeRowHeight,
  PER_CHANNEL_VISUAL_METRICS,
  standardProgrammeRowHeight,
} from './guideVisualMetrics';

export { currentProgrammeRowHeight, standardProgrammeRowHeight } from './guideVisualMetrics';

export type PerChannelProgrammeRow = {
  programme: Programme;
  top: number;
  height: number;
  current: boolean;
  progress: number;
};

export function programmesForChannelDay(
  fixture: GuideFixture,
  channelId: string,
  dayStartMs: number,
  dayEndMs: number,
): Programme[] {
  return fixture.programmes
    .filter((programme) => {
      if (programme.channelId !== channelId) return false;
      const startMs = Date.parse(programme.startAt);
      const endMs = Date.parse(programme.endAt);
      return startMs < dayEndMs && endMs > dayStartMs;
    })
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
}

/**
 * Canonical schedules should not overlap, but external data can transiently do
 * so. Resolve one current row deterministically: the matching programme with the
 * latest start wins. This prevents duplicate live/current treatments.
 */
export function currentProgrammeIdAt(programmes: Programme[], nowMs: number): string | null {
  let current: Programme | null = null;

  for (const programme of programmes) {
    const startMs = Date.parse(programme.startAt);
    const endMs = Date.parse(programme.endAt);
    if (!(startMs <= nowMs && nowMs < endMs)) continue;
    if (!current || startMs >= Date.parse(current.startAt)) current = programme;
  }

  return current?.id ?? null;
}

export function buildProgrammeRows(
  programmes: Programme[],
  nowMs: number,
  fontScale = 1,
): PerChannelProgrammeRow[] {
  const currentId = currentProgrammeIdAt(programmes, nowMs);
  const standardHeight = standardProgrammeRowHeight(fontScale);
  const currentHeight = currentProgrammeRowHeight(fontScale);
  let top = 0;

  return programmes.map((programme) => {
    const current = programme.id === currentId;
    const height = current ? currentHeight : standardHeight;
    const row: PerChannelProgrammeRow = {
      programme,
      top,
      height,
      current,
      progress: current ? programmeProgress(programme, nowMs) : 0,
    };
    top += height;
    return row;
  });
}

export function scheduleHeightForRows(rows: PerChannelProgrammeRow[]) {
  const last = rows.at(-1);
  return last ? last.top + last.height : 0;
}

function distanceFromProgramme(timeMs: number, programme: Programme) {
  const startMs = Date.parse(programme.startAt);
  const endMs = Date.parse(programme.endAt);

  if (timeMs < startMs) return startMs - timeMs;
  if (timeMs >= endMs) return timeMs - endMs;
  return 0;
}

/** Resolve the programme containing a timestamp, or the nearest real programme across a gap. */
export function programmeRowForTimestamp(
  rows: PerChannelProgrammeRow[],
  timeMs: number,
): PerChannelProgrammeRow | null {
  let best: PerChannelProgrammeRow | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const row of rows) {
    const distance = distanceFromProgramme(timeMs, row.programme);
    if (distance < bestDistance) {
      best = row;
      bestDistance = distance;
      continue;
    }

    if (distance === bestDistance && best) {
      const candidateStart = Date.parse(row.programme.startAt);
      const bestStart = Date.parse(best.programme.startAt);
      if (candidateStart <= timeMs && candidateStart > bestStart) best = row;
    }
  }

  return best;
}

/**
 * The stable viewport reference is expressed in programme rows, not minutes.
 * Two standard rows leaves enough context above the semantic anchor without
 * reintroducing spatial wall-clock geometry.
 */
export function viewportReferenceInset(fontScale = 1) {
  return standardProgrammeRowHeight(fontScale) * PER_CHANNEL_VISUAL_METRICS.viewportReferenceRows;
}

export function scrollOffsetForTimestamp(
  rows: PerChannelProgrammeRow[],
  timeMs: number,
  referenceInset: number,
) {
  const row = programmeRowForTimestamp(rows, timeMs);
  return row ? Math.max(0, row.top - Math.max(0, referenceInset)) : 0;
}

/**
 * Convert a fixed-row viewport position back to a semantic programme timestamp.
 * No pixel-to-minute conversion is allowed in Per zender.
 */
export function timestampForScrollOffset(
  rows: PerChannelProgrammeRow[],
  scrollY: number,
  referenceInset: number,
  fallbackTimeMs: number,
) {
  if (rows.length === 0) return fallbackTimeMs;

  const y = Math.max(0, scrollY) + Math.max(0, referenceInset);
  const row =
    rows.find((candidate) => y >= candidate.top && y < candidate.top + candidate.height) ??
    rows.at(-1)!;
  return Date.parse(row.programme.startAt);
}

export function adjacentChannelIndex(currentIndex: number, delta: -1 | 1, channelCount: number) {
  if (channelCount <= 0) return 0;
  return Math.min(channelCount - 1, Math.max(0, currentIndex + delta));
}
