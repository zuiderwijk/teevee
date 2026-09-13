import type { Programme } from '@/data/domain/epg';

import { programmeFrame, type ProgrammeFrame } from './geometry';

export type EdgeReadableProgramme = {
  programme: Programme;
  frame: ProgrammeFrame;
  hiddenLeft: number;
  visibleWidth: number;
  endsInViewport: boolean;
};

export function edgeReadableProgramme(
  programmes: Programme[],
  viewportX: number,
  viewportWidth: number,
  windowStartMs: number,
  minuteWidth: number,
): EdgeReadableProgramme | null {
  const safeViewportX = Number.isFinite(viewportX) ? Math.max(0, viewportX) : 0;
  const safeViewportWidth = Number.isFinite(viewportWidth) ? Math.max(0, viewportWidth) : 0;

  for (const programme of programmes) {
    const frame = programmeFrame(programme, windowStartMs, minuteWidth);
    const frameEnd = frame.left + frame.width;

    if (safeViewportX <= frame.left) continue;
    if (safeViewportX >= frameEnd) continue;

    const hiddenLeft = safeViewportX - frame.left;
    const remainingWidth = frameEnd - safeViewportX;

    return {
      programme,
      frame,
      hiddenLeft,
      visibleWidth: Math.min(remainingWidth, safeViewportWidth),
      endsInViewport: remainingWidth <= safeViewportWidth,
    };
  }

  return null;
}

export function edgeBoundaryXs(
  programmes: Programme[],
  windowStartMs: number,
  minuteWidth: number,
): number[] {
  const boundaries = new Set<number>();

  for (const programme of programmes) {
    const frame = programmeFrame(programme, windowStartMs, minuteWidth);
    boundaries.add(frame.left);
    boundaries.add(frame.left + frame.width);
  }

  return [...boundaries].sort((left, right) => left - right);
}

export function edgeBoundaryBucket(boundaries: number[], viewportX: number): number {
  'worklet';

  const x = Number.isFinite(viewportX) ? Math.max(0, viewportX) : 0;
  let low = 0;
  let high = boundaries.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const boundary = boundaries[middle] ?? Number.POSITIVE_INFINITY;
    if (boundary < x) low = middle + 1;
    else high = middle;
  }

  return low - 1;
}
