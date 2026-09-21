import { describe, expect, it } from 'vitest';

import type { Programme } from '@/data/domain/epg';

import {
  GUIDE_PROGRAMME_WINDOW_OVERSCAN_VIEWPORTS,
  guideInitialProgrammeViewport,
  guideProgrammeTimeWindow,
  guideProgrammeWindowBucket,
  guideProgrammaticNavigationPolicy,
  guideProgrammaticScrollPrealignmentX,
  windowGuideProgrammesByChannel,
} from './guideProgrammeWindow';

const WINDOW_START_MS = Date.parse('2026-09-16T04:00:00.000Z');
const WINDOW_END_MS = WINDOW_START_MS + 48 * 60 * 60_000;
const MINUTE_WIDTH = 3;
const VIEWPORT_WIDTH = 300;
const TIMELINE_WIDTH = ((WINDOW_END_MS - WINDOW_START_MS) / 60_000) * MINUTE_WIDTH;

describe('Totaal programme windowing', () => {
  it('uses coarse viewport buckets instead of per-frame positions', () => {
    expect(guideProgrammeWindowBucket(0, VIEWPORT_WIDTH)).toBe(0);
    expect(guideProgrammeWindowBucket(299.9, VIEWPORT_WIDTH)).toBe(0);
    expect(guideProgrammeWindowBucket(300, VIEWPORT_WIDTH)).toBe(1);
    expect(guideProgrammeWindowBucket(899, VIEWPORT_WIDTH)).toBe(2);
    expect(guideProgrammeWindowBucket(-40, VIEWPORT_WIDTH)).toBe(0);
  });

  it('starts the first visible Totaal frame with the target viewport and target bucket authoritative', () => {
    expect(guideInitialProgrammeViewport(1980, VIEWPORT_WIDTH)).toEqual({
      viewportX: 1980,
      bucket: 6,
    });
    expect(guideInitialProgrammeViewport(-50, VIEWPORT_WIDTH)).toEqual({
      viewportX: 0,
      bucket: 0,
    });
  });

  it('keeps short programmatic travel animated while it stays inside source-window overscan', () => {
    const policy = guideProgrammaticNavigationPolicy(
      600,
      600 + VIEWPORT_WIDTH * GUIDE_PROGRAMME_WINDOW_OVERSCAN_VIEWPORTS,
      VIEWPORT_WIDTH,
      true,
    );

    expect(policy.animated).toBe(true);
    expect(policy.prealignmentX).toBeNull();
  });

  it('prealigns and jumps directly when programmatic travel exceeds source-window overscan', () => {
    const targetViewportX =
      600 + VIEWPORT_WIDTH * GUIDE_PROGRAMME_WINDOW_OVERSCAN_VIEWPORTS + 1;
    const policy = guideProgrammaticNavigationPolicy(
      600,
      targetViewportX,
      VIEWPORT_WIDTH,
      true,
    );

    expect(policy).toEqual({
      animated: false,
      targetViewportX,
      targetBucket: guideProgrammeWindowBucket(targetViewportX, VIEWPORT_WIDTH),
      prealignmentX: targetViewportX,
    });
  });

  it('keeps explicitly non-animated positioning direct even for a nearby target', () => {
    expect(
      guideProgrammaticNavigationPolicy(600, 650, VIEWPORT_WIDTH, false),
    ).toEqual({
      animated: false,
      targetViewportX: 650,
      targetBucket: 2,
      prealignmentX: 650,
    });
  });

  it('keeps animated programmatic ownership on the native viewport until real scroll offsets cross buckets', () => {
    const sourceViewportX = VIEWPORT_WIDTH * 5 + 40;
    const targetViewportX = 0;
    let ownedBucket = guideProgrammeWindowBucket(sourceViewportX, VIEWPORT_WIDTH);

    const animatedPrealignment = guideProgrammaticScrollPrealignmentX(targetViewportX, true);
    expect(animatedPrealignment).toBeNull();
    expect(ownedBucket).toBe(5);

    const actualNativeOffsets = [VIEWPORT_WIDTH * 5 - 1, VIEWPORT_WIDTH * 4 - 1, VIEWPORT_WIDTH * 3 - 1];
    const observedBuckets: number[] = [];
    for (const viewportX of actualNativeOffsets) {
      ownedBucket = guideProgrammeWindowBucket(viewportX, VIEWPORT_WIDTH);
      observedBuckets.push(ownedBucket);
    }

    expect(observedBuckets).toEqual([4, 3, 2]);
    expect(ownedBucket).not.toBe(guideProgrammeWindowBucket(targetViewportX, VIEWPORT_WIDTH));

    const nonAnimatedPrealignment = guideProgrammaticScrollPrealignmentX(targetViewportX, false);
    expect(nonAnimatedPrealignment).toBe(targetViewportX);
    expect(guideProgrammeWindowBucket(nonAnimatedPrealignment!, VIEWPORT_WIDTH)).toBe(0);
  });

  it('keeps every possible viewport inside its bucket covered with conservative overscan', () => {
    const bucket = 4;
    const window = guideProgrammeTimeWindow({
      bucket,
      viewportWidth: VIEWPORT_WIDTH,
      timelineWidth: TIMELINE_WIDTH,
      windowStartMs: WINDOW_START_MS,
      windowEndMs: WINDOW_END_MS,
      minuteWidth: MINUTE_WIDTH,
    });
    const msPerPixel = 60_000 / MINUTE_WIDTH;
    const bucketStartX = bucket * VIEWPORT_WIDTH;
    const expectedFromX = bucketStartX - VIEWPORT_WIDTH * GUIDE_PROGRAMME_WINDOW_OVERSCAN_VIEWPORTS;
    const expectedToX =
      bucketStartX + VIEWPORT_WIDTH * 2 + VIEWPORT_WIDTH * GUIDE_PROGRAMME_WINDOW_OVERSCAN_VIEWPORTS;

    expect(window.fromMs).toBe(WINDOW_START_MS + expectedFromX * msPerPixel);
    expect(window.toMs).toBe(WINDOW_START_MS + expectedToX * msPerPixel);

    const latestViewportStartMs = WINDOW_START_MS + (bucketStartX + VIEWPORT_WIDTH) * msPerPixel;
    const latestViewportEndMs = latestViewportStartMs + VIEWPORT_WIDTH * msPerPixel;
    expect(window.fromMs).toBeLessThanOrEqual(latestViewportStartMs);
    expect(window.toMs).toBeGreaterThanOrEqual(latestViewportEndMs);
  });

  it('clamps overscan to the actual timeline at both edges', () => {
    const first = guideProgrammeTimeWindow({
      bucket: 0,
      viewportWidth: VIEWPORT_WIDTH,
      timelineWidth: TIMELINE_WIDTH,
      windowStartMs: WINDOW_START_MS,
      windowEndMs: WINDOW_END_MS,
      minuteWidth: MINUTE_WIDTH,
    });
    const lastBucket = guideProgrammeWindowBucket(TIMELINE_WIDTH - VIEWPORT_WIDTH, VIEWPORT_WIDTH);
    const last = guideProgrammeTimeWindow({
      bucket: lastBucket,
      viewportWidth: VIEWPORT_WIDTH,
      timelineWidth: TIMELINE_WIDTH,
      windowStartMs: WINDOW_START_MS,
      windowEndMs: WINDOW_END_MS,
      minuteWidth: MINUTE_WIDTH,
    });

    expect(first.fromMs).toBe(WINDOW_START_MS);
    expect(last.toMs).toBe(WINDOW_END_MS);
  });

  it('falls back to the full timeline until a usable viewport width exists', () => {
    expect(
      guideProgrammeTimeWindow({
        bucket: 0,
        viewportWidth: 0,
        timelineWidth: TIMELINE_WIDTH,
        windowStartMs: WINDOW_START_MS,
        windowEndMs: WINDOW_END_MS,
        minuteWidth: MINUTE_WIDTH,
      }),
    ).toEqual({ bucket: 0, fromMs: WINDOW_START_MS, toMs: WINDOW_END_MS });
  });

  it('mounts only programmes overlapping the render window while preserving source order', () => {
    const programme = (
      id: string,
      startOffsetMinutes: number,
      endOffsetMinutes: number,
    ): Programme => ({
      id,
      channelId: 'one',
      startAt: new Date(WINDOW_START_MS + startOffsetMinutes * 60_000).toISOString(),
      endAt: new Date(WINDOW_START_MS + endOffsetMinutes * 60_000).toISOString(),
      title: id,
    });
    const programmes = [
      programme('ends-at-start', 0, 60),
      programme('crosses-start', 30, 90),
      programme('inside-a', 75, 105),
      programme('inside-b', 105, 120),
      programme('starts-at-end', 120, 150),
    ];
    const indexed = new Map<string, Programme[]>([['one', programmes]]);
    const windowed = windowGuideProgrammesByChannel(
      indexed,
      WINDOW_START_MS + 60 * 60_000,
      WINDOW_START_MS + 120 * 60_000,
    );

    expect(windowed.get('one')?.map((item) => item.id)).toEqual([
      'crosses-start',
      'inside-a',
      'inside-b',
    ]);
  });
});
