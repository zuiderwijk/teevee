import { programmeProgress, type Channel, type GuideFixture, type GuideSchedule, type Programme } from '@/data/domain/epg';

import {
  currentProgrammeRowHeight,
  GUIDE_VISUAL_METRICS,
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

/**
 * Canonical Per-zender chrome collapse remains coupled to scroll position. The
 * anchor is a visual header anchor only; it never converts pixels into time.
 */
export function collapseProgressForScrollOffset(
  scrollY: number,
  anchorY: number,
  reduceMotion: boolean,
) {
  'worklet';
  const collapseY = Math.max(0, Math.max(0, scrollY) - Math.max(0, anchorY));
  if (reduceMotion) {
    return collapseY >= PER_CHANNEL_VISUAL_METRICS.reduceMotionSwitchOffset ? 1 : 0;
  }
  return Math.min(1, collapseY / PER_CHANNEL_VISUAL_METRICS.collapseDistance);
}

/**
 * Compact channel/date context switches at the same canonical midpoint used by
 * Reduce Motion. This keeps the binary context composition coherent while the
 * surrounding chrome continues to interpolate directly with scroll position.
 */
export function compactContextForCollapseProgress(progress: number) {
  'worklet';
  const threshold =
    PER_CHANNEL_VISUAL_METRICS.reduceMotionSwitchOffset /
    PER_CHANNEL_VISUAL_METRICS.collapseDistance;
  return Math.min(1, Math.max(0, progress)) >= threshold;
}

export function perChannelFunctionalGapsForCollapseProgress(progress: number) {
  'worklet';
  const clamped = Math.min(1, Math.max(0, progress));
  return {
    stripToContext: PER_CHANNEL_VISUAL_METRICS.stripToUtilitiesGap * (1 - clamped),
    contextToSchedule: PER_CHANNEL_VISUAL_METRICS.utilityToScheduleGap * (1 - clamped),
  } as const;
}

const GUIDE_CHROME_EXPANDED_HEIGHT =
  GUIDE_VISUAL_METRICS.brandTopInset +
  GUIDE_VISUAL_METRICS.brandMarkBoxHeight +
  GUIDE_VISUAL_METRICS.presentationNavHeight;

/**
 * Keep the native vertical ScrollView viewport fixed while Per-zender chrome
 * visually converges from its rest stack to the condensed stack.
 *
 * The rest -> condensed visual stack contracts by 148 pt:
 * - Guide chrome: 100 -> 0
 * - channel rail: 72 -> 60
 * - rail -> context gap: 24 -> 0
 * - context -> schedule gap: 12 -> 0
 *
 * Native scroll advances only 56 pt over that same collapse. The remaining
 * 92 pt therefore has to be a visual content transform, never a normal-flow
 * layout mutation above the active ScrollView.
 */
export const PER_CHANNEL_STABLE_SCROLL_GEOMETRY = {
  viewportTop:
    PER_CHANNEL_VISUAL_METRICS.channelStripCondensedHeight +
    PER_CHANNEL_VISUAL_METRICS.stickyContextHeight,
  contentTopInset:
    GUIDE_CHROME_EXPANDED_HEIGHT +
    (PER_CHANNEL_VISUAL_METRICS.channelStripHeight -
      PER_CHANNEL_VISUAL_METRICS.channelStripCondensedHeight) +
    PER_CHANNEL_VISUAL_METRICS.stripToUtilitiesGap +
    PER_CHANNEL_VISUAL_METRICS.utilityToScheduleGap,
  wrappedContextDelta:
    PER_CHANNEL_VISUAL_METRICS.stickyContextWrappedHeight -
    PER_CHANNEL_VISUAL_METRICS.stickyContextHeight,
  scrollCompensation:
    GUIDE_CHROME_EXPANDED_HEIGHT +
    (PER_CHANNEL_VISUAL_METRICS.channelStripHeight -
      PER_CHANNEL_VISUAL_METRICS.channelStripCondensedHeight) +
    PER_CHANNEL_VISUAL_METRICS.stripToUtilitiesGap +
    PER_CHANNEL_VISUAL_METRICS.utilityToScheduleGap -
    PER_CHANNEL_VISUAL_METRICS.collapseDistance,
} as const;

export function perChannelStableScrollVisuals(
  progress: number,
  contextWrapped: boolean,
) {
  'worklet';
  const clamped = Math.min(1, Math.max(0, progress));
  const contextHeight = contextWrapped
    ? PER_CHANNEL_VISUAL_METRICS.stickyContextWrappedHeight
    : PER_CHANNEL_VISUAL_METRICS.stickyContextHeight;
  const wrapDelta = contextWrapped
    ? PER_CHANNEL_STABLE_SCROLL_GEOMETRY.wrappedContextDelta
    : 0;
  const gaps = perChannelFunctionalGapsForCollapseProgress(clamped);
  const guideChromeHeight = GUIDE_CHROME_EXPANDED_HEIGHT * (1 - clamped);
  const channelStripHeight =
    PER_CHANNEL_VISUAL_METRICS.channelStripHeight -
    (PER_CHANNEL_VISUAL_METRICS.channelStripHeight -
      PER_CHANNEL_VISUAL_METRICS.channelStripCondensedHeight) *
      clamped;
  const overlayBottom =
    guideChromeHeight +
    channelStripHeight +
    gaps.stripToContext +
    contextHeight +
    gaps.contextToSchedule;
  const contentTranslateY =
    wrapDelta - PER_CHANNEL_STABLE_SCROLL_GEOMETRY.scrollCompensation * clamped;

  return {
    guideChromeHeight,
    channelStripHeight,
    stripToContextGap: gaps.stripToContext,
    contextToScheduleGap: gaps.contextToSchedule,
    overlayBottom,
    contentTranslateY,
  } as const;
}

export function perChannelNativeOffsetForScheduleOffset(
  scheduleOffset: number,
  collapseProgress: number,
) {
  const clamped = Math.min(1, Math.max(0, collapseProgress));
  return Math.max(
    0,
    PER_CHANNEL_STABLE_SCROLL_GEOMETRY.contentTopInset +
      Math.max(0, scheduleOffset) -
      PER_CHANNEL_STABLE_SCROLL_GEOMETRY.scrollCompensation * clamped,
  );
}

export function perChannelScheduleOffsetForNativeOffset(
  nativeOffset: number,
  collapseProgress: number,
) {
  const clamped = Math.min(1, Math.max(0, collapseProgress));
  return Math.max(
    0,
    Math.max(0, nativeOffset) -
      PER_CHANNEL_STABLE_SCROLL_GEOMETRY.contentTopInset +
      PER_CHANNEL_STABLE_SCROLL_GEOMETRY.scrollCompensation * clamped,
  );
}

export function perChannelLayoutAnchorKey(
  selectedDayStartMs: number,
  selectedChannelId: string | null,
  fontScale: number,
  schedule: GuideSchedule | null,
) {
  if (!schedule || !selectedChannelId) return null;
  return `${selectedDayStartMs}:${selectedChannelId}:${fontScale}:${schedule.generatedAt}`;
}

export function channelRailOffsetForSelection(
  selectedIndex: number,
  channelCount: number,
  viewportWidth: number,
) {
  if (channelCount <= 0 || viewportWidth <= 0) return 0;
  const safeIndex = Math.min(channelCount - 1, Math.max(0, selectedIndex));
  const step =
    PER_CHANNEL_VISUAL_METRICS.channelItemSize + PER_CHANNEL_VISUAL_METRICS.channelItemGap;
  const itemCentre =
    PER_CHANNEL_VISUAL_METRICS.channelStripInsetX +
    safeIndex * step +
    PER_CHANNEL_VISUAL_METRICS.channelItemSize / 2;
  const contentWidth =
    PER_CHANNEL_VISUAL_METRICS.channelStripInsetX * 2 +
    channelCount * PER_CHANNEL_VISUAL_METRICS.channelItemSize +
    Math.max(0, channelCount - 1) * PER_CHANNEL_VISUAL_METRICS.channelItemGap;
  const maxOffset = Math.max(0, contentWidth - viewportWidth);
  return Math.min(maxOffset, Math.max(0, itemCentre - viewportWidth / 2));
}

export function channelRailRecenterPlan(
  selectedIndex: number,
  channelCount: number,
  viewportWidth: number,
  reduceMotion: boolean,
) {
  return {
    x: channelRailOffsetForSelection(selectedIndex, channelCount, viewportWidth),
    animated: !reduceMotion,
  } as const;
}

export type PerChannelSchedulePresentation = {
  channels: Channel[];
  schedule: GuideSchedule | null;
  source: 'selected-schedule' | 'established-channels' | 'fixture';
};

/**
 * Keep broadcaster identity and programme ownership separate while a non-current day loads.
 * Once canonical channels are established, a missing selected-day schedule must never swap
 * the rail to the generic deterministic fixture. The fixture remains valid only when no
 * canonical/real channel catalogue has been established in this app session.
 */
export function resolvePerChannelSchedulePresentation(
  selectedSchedule: GuideSchedule | null,
  establishedChannels: Channel[] | null,
  fixtureSchedule: GuideFixture | null,
): PerChannelSchedulePresentation {
  if (selectedSchedule) {
    return {
      channels: selectedSchedule.channels,
      schedule: selectedSchedule,
      source: 'selected-schedule',
    };
  }

  if (establishedChannels && establishedChannels.length > 0) {
    return {
      channels: establishedChannels,
      schedule: null,
      source: 'established-channels',
    };
  }

  return {
    channels: fixtureSchedule?.channels ?? [],
    schedule: fixtureSchedule,
    source: 'fixture',
  };
}

export function selectedChannelIndexForId(
  channels: Channel[],
  selectedChannelId: string | null,
): number {
  if (channels.length === 0 || !selectedChannelId) return 0;
  const index = channels.findIndex(({ id }) => id === selectedChannelId);
  return index >= 0 ? index : 0;
}

export type PerChannelTemporalControlStates = {
  nu: 'active' | 'return' | 'disabled';
  primetime: 'active' | 'inactive' | 'disabled';
};

type PerChannelTemporalControlStateInput = {
  rows: PerChannelProgrammeRow[];
  stableAnchorTimeMs: number;
  selectedDayStartMs: number;
  nowDayStartMs: number;
  nowTimeMs: number;
  primetimeTimeMs: number;
  nuAvailable?: boolean;
  primetimeAvailable?: boolean;
};

function semanticAnchorId(rows: PerChannelProgrammeRow[], timeMs: number) {
  return programmeRowForTimestamp(rows, timeMs)?.programme.id ?? null;
}

/** Resolve Nu/Primetime from semantic programme/context anchors, never pixels/minute tolerances. */
export function resolvePerChannelTemporalControlStates({
  rows,
  stableAnchorTimeMs,
  selectedDayStartMs,
  nowDayStartMs,
  nowTimeMs,
  primetimeTimeMs,
  nuAvailable = true,
  primetimeAvailable = true,
}: PerChannelTemporalControlStateInput): PerChannelTemporalControlStates {
  const stableAnchorId = semanticAnchorId(rows, stableAnchorTimeMs);
  const nowAnchorId =
    selectedDayStartMs === nowDayStartMs ? semanticAnchorId(rows, nowTimeMs) : null;
  const primetimeAnchorId = semanticAnchorId(rows, primetimeTimeMs);

  const nuActive =
    nuAvailable && stableAnchorId !== null && nowAnchorId !== null && stableAnchorId === nowAnchorId;
  const primetimeActive =
    primetimeAvailable &&
    !nuActive &&
    stableAnchorId !== null &&
    primetimeAnchorId !== null &&
    stableAnchorId === primetimeAnchorId;

  return {
    nu: nuAvailable ? (nuActive ? 'active' : 'return') : 'disabled',
    primetime: primetimeAvailable ? (primetimeActive ? 'active' : 'inactive') : 'disabled',
  };
}

export function programmeRowPressBackgroundColor(pressed: boolean, surfaceColor: string) {
  return pressed ? surfaceColor : 'transparent';
}

export function adjacentChannelIndex(currentIndex: number, delta: -1 | 1, channelCount: number) {
  if (channelCount <= 0) return 0;
  return Math.min(channelCount - 1, Math.max(0, currentIndex + delta));
}
