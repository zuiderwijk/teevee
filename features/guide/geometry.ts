import type { Programme } from '@/data/domain/epg';

export const GUIDE_MINUTE_WIDTH = 3;
export const GUIDE_CHANNEL_WIDTH = 84;
export const GUIDE_ROW_HEIGHT = 76;
export const GUIDE_TIME_AXIS_HEIGHT = 38;
export const GUIDE_PROGRAMME_GAP = 2;

export type ProgrammeFrame = {
  left: number;
  width: number;
};

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
    width: Math.max(1, minutesBetween(start, end) * minuteWidth - GUIDE_PROGRAMME_GAP),
  };
}

export function timelineWidth(windowStartMs: number, windowEndMs: number, minuteWidth = GUIDE_MINUTE_WIDTH): number {
  return Math.max(0, minutesBetween(windowStartMs, windowEndMs) * minuteWidth);
}

export function buildTimeTicks(windowStartMs: number, windowEndMs: number, intervalMinutes = 30): number[] {
  const intervalMs = intervalMinutes * 60_000;
  const firstTick = Math.ceil(windowStartMs / intervalMs) * intervalMs;
  const ticks: number[] = [];

  for (let tick = firstTick; tick <= windowEndMs; tick += intervalMs) {
    ticks.push(tick);
  }

  return ticks;
}
