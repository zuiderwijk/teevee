import type { Programme } from '@/data/domain/epg';

export const GUIDE_PROGRAMME_WINDOW_OVERSCAN_VIEWPORTS = 1.5;

type GuideProgrammeWindowInput = {
  bucket: number;
  viewportWidth: number;
  timelineWidth: number;
  windowStartMs: number;
  windowEndMs: number;
  minuteWidth: number;
};

export type GuideProgrammeTimeWindow = {
  bucket: number;
  fromMs: number;
  toMs: number;
};

export function guideProgrammeWindowBucket(viewportX: number, viewportWidth: number): number {
  if (!Number.isFinite(viewportX) || !Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor(Math.max(0, viewportX) / viewportWidth));
}

export type GuideInitialProgrammeViewport = {
  viewportX: number;
  bucket: number;
};

export function guideInitialProgrammeViewport(
  targetViewportX: number,
  viewportWidth: number,
): GuideInitialProgrammeViewport {
  const viewportX = Number.isFinite(targetViewportX) ? Math.max(0, targetViewportX) : 0;
  return {
    viewportX,
    bucket: guideProgrammeWindowBucket(viewportX, viewportWidth),
  };
}

export type GuideProgrammaticNavigationPolicy = {
  animated: boolean;
  targetViewportX: number;
  targetBucket: number;
  prealignmentX: number | null;
};

/**
 * Native animation remains useful only while the complete trip stays inside the render
 * overscan already owned by the source bucket. Longer trips prealign the target bucket
 * and jump directly so programme windowing never has to chase a multi-bucket animation.
 */
export function guideProgrammaticNavigationPolicy(
  sourceViewportX: number,
  targetViewportX: number,
  viewportWidth: number,
  requestedAnimated: boolean,
): GuideProgrammaticNavigationPolicy {
  const sourceX = Number.isFinite(sourceViewportX) ? Math.max(0, sourceViewportX) : 0;
  const targetX = Number.isFinite(targetViewportX) ? Math.max(0, targetViewportX) : 0;
  const usableViewport = Number.isFinite(viewportWidth) && viewportWidth > 0;
  const maxAnimatedDistance = usableViewport
    ? viewportWidth * GUIDE_PROGRAMME_WINDOW_OVERSCAN_VIEWPORTS
    : 0;
  const animated =
    requestedAnimated &&
    usableViewport &&
    Math.abs(targetX - sourceX) <= maxAnimatedDistance;

  return {
    animated,
    targetViewportX: targetX,
    targetBucket: guideProgrammeWindowBucket(targetX, viewportWidth),
    prealignmentX: guideProgrammaticScrollPrealignmentX(targetX, animated),
  };
}

/**
 * Non-animated programmatic jumps need the target programme window mounted before the native
 * viewport moves there. Animated jumps must not prealign ownership: native onScroll remains the
 * source of truth while the viewport travels through intermediate buckets.
 */
export function guideProgrammaticScrollPrealignmentX(
  targetViewportX: number,
  animated: boolean,
): number | null {
  if (animated) return null;
  return Number.isFinite(targetViewportX) ? Math.max(0, targetViewportX) : 0;
}

export function guideProgrammeTimeWindow({
  bucket,
  viewportWidth,
  timelineWidth,
  windowStartMs,
  windowEndMs,
  minuteWidth,
}: GuideProgrammeWindowInput): GuideProgrammeTimeWindow {
  const safeBucket = Number.isFinite(bucket) ? Math.max(0, Math.floor(bucket)) : 0;
  if (
    !Number.isFinite(viewportWidth) ||
    viewportWidth <= 0 ||
    !Number.isFinite(timelineWidth) ||
    timelineWidth <= 0 ||
    !Number.isFinite(minuteWidth) ||
    minuteWidth <= 0
  ) {
    return { bucket: safeBucket, fromMs: windowStartMs, toMs: windowEndMs };
  }

  const bucketStartX = safeBucket * viewportWidth;
  const overscanPx = viewportWidth * GUIDE_PROGRAMME_WINDOW_OVERSCAN_VIEWPORTS;
  const fromX = Math.max(0, Math.min(timelineWidth, bucketStartX - overscanPx));
  // A bucket spans one viewport. Cover its furthest possible visible edge plus overscan so
  // native inertia can cross a bucket boundary before the next coarse React window commits.
  const toX = Math.max(
    fromX,
    Math.min(timelineWidth, bucketStartX + viewportWidth * 2 + overscanPx),
  );
  const msPerPixel = 60_000 / minuteWidth;

  return {
    bucket: safeBucket,
    fromMs: Math.max(windowStartMs, Math.min(windowEndMs, windowStartMs + fromX * msPerPixel)),
    toMs: Math.max(windowStartMs, Math.min(windowEndMs, windowStartMs + toX * msPerPixel)),
  };
}

export function windowGuideProgrammesByChannel(
  programmesByChannel: ReadonlyMap<string, readonly Programme[]>,
  fromMs: number,
  toMs: number,
): Map<string, Programme[]> {
  const windowed = new Map<string, Programme[]>();

  for (const [channelId, programmes] of programmesByChannel) {
    windowed.set(
      channelId,
      programmes.filter((programme) => {
        const startMs = Date.parse(programme.startAt);
        const endMs = Date.parse(programme.endAt);
        return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > fromMs && startMs < toMs;
      }),
    );
  }

  return windowed;
}
