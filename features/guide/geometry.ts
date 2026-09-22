import type { Programme } from '@/data/domain/epg';

export const GUIDE_MINUTE_WIDTH = 3;
export const GUIDE_CHANNEL_WIDTH = 84;
export const GUIDE_ROW_HEIGHT = 76;
export const GUIDE_TIME_AXIS_HEIGHT = 44;
export const GUIDE_PROGRAMME_GAP = 0;
export const GUIDE_PROGRAMME_TIME_MIN_VISIBLE_WIDTH = 52;

export type ProgrammeFrame = {
  left: number;
  width: number;
};

export type ProgrammeVisibleContent = {
  contentTranslateX: number;
  visibleWidth: number;
  canShowStartTime: boolean;
};

export type ProgrammeContentMode = 'compact' | 'standard' | 'comfortable';

export function minutesBetween(fromMs: number, toMs: number): number {
  return (toMs - fromMs) / 60_000;
}

export function timeToX(timeMs: number, windowStartMs: number, minuteWidth = GUIDE_MINUTE_WIDTH): number {
  return minutesBetween(windowStartMs, timeMs) * minuteWidth;
}

export function programmeFrame(
  programme: Programme,
  windowStartMs: number,
  minuteWidth = GUIDE_MINUTE_WIDTH,
): ProgrammeFrame {
  const start = Date.parse(programme.startAt);
  const end = Date.parse(programme.endAt);

  return {
    left: timeToX(start, windowStartMs, minuteWidth),
    width: Math.max(0, minutesBetween(start, end) * minuteWidth),
  };
}

export function programmeVisibleContent(
  frame: ProgrammeFrame,
  viewportX: number,
  minimumTimeWidth = GUIDE_PROGRAMME_TIME_MIN_VISIBLE_WIDTH,
): ProgrammeVisibleContent {
  const safeViewportX = Number.isFinite(viewportX) ? Math.max(0, viewportX) : 0;
  const frameEnd = frame.left + frame.width;

  if (safeViewportX <= frame.left || safeViewportX >= frameEnd) {
    return {
      contentTranslateX: 0,
      visibleWidth: frame.width,
      canShowStartTime: frame.width >= minimumTimeWidth,
    };
  }

  const hiddenLeft = safeViewportX - frame.left;
  const visibleWidth = frame.width - hiddenLeft;

  return {
    contentTranslateX: hiddenLeft,
    visibleWidth,
    canShowStartTime: visibleWidth >= minimumTimeWidth,
  };
}

export function programmeContentMode(width: number): ProgrammeContentMode {
  if (width < 64) return 'compact';
  if (width < 126) return 'standard';
  return 'comfortable';
}

export function timelineWidth(windowStartMs: number, windowEndMs: number, minuteWidth = GUIDE_MINUTE_WIDTH): number {
  return Math.max(0, minutesBetween(windowStartMs, windowEndMs) * minuteWidth);
}

export function buildTimeTicks(windowStartMs: number, windowEndMs: number, intervalMinutes = 15): number[] {
  const intervalMs = intervalMinutes * 60_000;
  const firstTick = Math.ceil(windowStartMs / intervalMs) * intervalMs;
  const ticks: number[] = [];

  for (let tick = firstTick; tick <= windowEndMs; tick += intervalMs) {
    ticks.push(tick);
  }

  return ticks;
}
