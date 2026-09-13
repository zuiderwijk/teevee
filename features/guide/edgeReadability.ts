import type { Programme } from '@/data/domain/epg';

import { programmeFrame, type ProgrammeFrame } from './geometry';

export type EdgeReadableProgramme = {
  programme: Programme;
  frame: ProgrammeFrame;
  hiddenLeft: number;
  visibleWidth: number;
  endsInViewport: boolean;
};

export type VisibleRowRange = {
  first: number;
  last: number;
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

export function visibleRowRange(
  viewportY: number,
  viewportHeight: number,
  rowHeight: number,
  rowCount: number,
  overscanRows = 1,
): VisibleRowRange | null {
  if (rowCount <= 0 || rowHeight <= 0 || viewportHeight <= 0) return null;

  const safeY = Number.isFinite(viewportY) ? Math.max(0, viewportY) : 0;
  const safeOverscan = Math.max(0, Math.floor(overscanRows));
  const first = Math.max(0, Math.floor(safeY / rowHeight) - safeOverscan);
  const last = Math.min(
    rowCount - 1,
    Math.ceil((safeY + viewportHeight) / rowHeight) + safeOverscan,
  );

  return { first, last };
}
