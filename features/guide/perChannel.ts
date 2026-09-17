import { programmeProgress, type GuideFixture, type Programme } from '@/data/domain/epg';

import { PER_CHANNEL_VISUAL_METRICS } from './perChannelVisualMetrics';

export type PerChannelProgrammeRow = {
  programme: Programme;
  top: number;
  height: number;
  current: boolean;
  progress: number;
};

function effectiveFontScale(fontScale: number) {
  return Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
}

export function standardProgrammeRowHeight(fontScale = 1) {
  return Math.round(PER_CHANNEL_VISUAL_METRICS.standardRowHeight * effectiveFontScale(fontScale));
}

export function currentProgrammeRowHeight(fontScale = 1) {
  return Math.round(PER_CHANNEL_VISUAL_METRICS.currentRowHeight * effectiveFontScale(fontScale));
}

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
 * Schedules should not contain overlaps, but hosted/provider data can be imperfect.
 * Resolve at most one current programme deterministically so the surface can never
 * render two live rows at once. The most recently started matching programme wins.
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
 * Convert a fixed-row viewport position back into a semantic programme timestamp.
 * This deliberately anchors to programme data, never to minutes-per-pixel.
 */
export function timestampForScrollOffset(
  rows: PerChannelProgrammeRow[],
  scrollY: number,
  referenceInset: number,
  fallbackTimeMs: number,
) {
  if (rows.length === 0) return fallbackTimeMs;
  const y = Math.max(0, scrollY) + Math.max(0, referenceInset);
  const row = rows.find((candidate) => y >= candidate.top && y < candidate.top + candidate.height)
    ?? rows.at(-1)!;
  return Date.parse(row.programme.startAt);
}

export function adjacentChannelIndex(currentIndex: number, delta: -1 | 1, channelCount: number) {
  if (channelCount <= 0) return 0;
  return Math.min(channelCount - 1, Math.max(0, currentIndex + delta));
}
