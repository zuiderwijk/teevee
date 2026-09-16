export type GuideDaySwitchSurface = 'totaal' | 'per-zender';
export type GuideDaySwitchPaintSource = 'fixture' | 'schedule';
export type GuideDayWindowResolutionSource =
  | 'current-runtime'
  | 'session-cache'
  | 'network'
  | 'unavailable'
  | 'network-error';

type ActiveGuideDaySwitchTrace = {
  id: number;
  surface: GuideDaySwitchSurface;
  fromDayStartMs: number;
  toDayStartMs: number;
  tapAtMs: number;
  selectionCommittedAtMs?: number;
  firstFrameAtMs?: number;
};

type GuideDaySwitchEventFields = Record<string, string | number | boolean | null | undefined>;

const LOG_PREFIX = '[TeeveeGuidePerf]';
const JS_FRAME_SAMPLE_WINDOW_MS = 1_200;
const JS_FRAME_SLOW_MS = 34;
const JS_FRAME_VERY_SLOW_MS = 50;

let nextTraceId = 1;
let nextCacheInstanceId = 1;
let mountedSurface: GuideDaySwitchSurface | null = null;
const activeTraceBySurface = new Map<GuideDaySwitchSurface, ActiveGuideDaySwitchTrace>();
const jsSamplerFrameBySurface = new Map<GuideDaySwitchSurface, number>();

export function guidePerfNowMs(): number {
  return typeof globalThis.performance?.now === 'function'
    ? globalThis.performance.now()
    : Date.now();
}

function roundedMs(value: number): number {
  return Math.round(value * 10) / 10;
}

function activeTrace(
  surface: GuideDaySwitchSurface,
  targetDayStartMs?: number,
): ActiveGuideDaySwitchTrace | null {
  const trace = activeTraceBySurface.get(surface) ?? null;
  if (!trace) return null;
  if (targetDayStartMs !== undefined && trace.toDayStartMs !== targetDayStartMs) return null;
  return trace;
}

function emit(
  event: string,
  surface: GuideDaySwitchSurface,
  fields: GuideDaySwitchEventFields = {},
): void {
  const trace = activeTrace(surface);
  const payload = {
    event,
    surface,
    traceId: trace?.id ?? null,
    at: new Date().toISOString(),
    ...fields,
  };
  console.info(`${LOG_PREFIX} ${JSON.stringify(payload)}`);
}

function startJsFrameSample(trace: ActiveGuideDaySwitchTrace): void {
  if (typeof requestAnimationFrame !== 'function') return;

  const previousFrame = jsSamplerFrameBySurface.get(trace.surface);
  if (previousFrame !== undefined && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(previousFrame);
  }

  const sampleStartedAtMs = guidePerfNowMs();
  let previousAtMs = sampleStartedAtMs;
  let maxGapMs = 0;
  let slowFrameCount = 0;
  let verySlowFrameCount = 0;
  let sampledFrames = 0;

  const sample = () => {
    const nowMs = guidePerfNowMs();
    const gapMs = nowMs - previousAtMs;
    previousAtMs = nowMs;
    sampledFrames += 1;
    maxGapMs = Math.max(maxGapMs, gapMs);
    if (gapMs >= JS_FRAME_SLOW_MS) slowFrameCount += 1;
    if (gapMs >= JS_FRAME_VERY_SLOW_MS) verySlowFrameCount += 1;

    if (nowMs - sampleStartedAtMs >= JS_FRAME_SAMPLE_WINDOW_MS) {
      jsSamplerFrameBySurface.delete(trace.surface);
      emit('js-frame-sample', trace.surface, {
        sampledTraceId: trace.id,
        windowMs: roundedMs(nowMs - sampleStartedAtMs),
        sampledFrames,
        maxGapMs: roundedMs(maxGapMs),
        slowFrameCount,
        verySlowFrameCount,
      });
      return;
    }

    const frame = requestAnimationFrame(sample);
    jsSamplerFrameBySurface.set(trace.surface, frame);
  };

  const frame = requestAnimationFrame(sample);
  jsSamplerFrameBySurface.set(trace.surface, frame);
}

export function markGuideDaySwitchSurfaceMounted(surface: GuideDaySwitchSurface): void {
  mountedSurface = surface;
  emit('surface-mounted', surface);
}

export function markGuideDaySwitchSurfaceUnmounted(surface: GuideDaySwitchSurface): void {
  emit('surface-unmounted', surface);
  if (mountedSurface === surface) mountedSurface = null;
}

export function beginMountedGuideDaySwitchTrace(
  fromDayStartMs: number,
  toDayStartMs: number,
): number | null {
  if (!mountedSurface) return null;
  return beginGuideDaySwitchTrace(mountedSurface, fromDayStartMs, toDayStartMs);
}

export function markMountedGuideDaySelectorOpenPress(): void {
  if (mountedSurface) markGuideDaySelectorOpenPress(mountedSurface);
}

export function markMountedGuideDaySelectorModalShown(): void {
  if (mountedSurface) markGuideDaySelectorModalShown(mountedSurface);
}

export function markMountedGuideDaySelectorModalDismissed(): void {
  if (mountedSurface) markGuideDaySelectorModalDismissed(mountedSurface);
}

export function beginGuideDaySwitchTrace(
  surface: GuideDaySwitchSurface,
  fromDayStartMs: number,
  toDayStartMs: number,
): number {
  const trace: ActiveGuideDaySwitchTrace = {
    id: nextTraceId,
    surface,
    fromDayStartMs,
    toDayStartMs,
    tapAtMs: guidePerfNowMs(),
  };
  nextTraceId += 1;
  activeTraceBySurface.set(surface, trace);
  emit('day-option-press', surface, {
    fromDayStartMs,
    toDayStartMs,
  });
  startJsFrameSample(trace);
  return trace.id;
}

export function markGuideDaySelectorOpenPress(surface: GuideDaySwitchSurface): void {
  emit('selector-open-press', surface);
}

export function markGuideDaySelectorModalShown(surface: GuideDaySwitchSurface): void {
  emit('selector-modal-shown', surface);
}

export function markGuideDaySelectorModalDismissed(surface: GuideDaySwitchSurface): void {
  const trace = activeTrace(surface);
  emit('selector-modal-dismissed', surface, {
    tapToModalDismissMs: trace ? roundedMs(guidePerfNowMs() - trace.tapAtMs) : null,
  });
}

export function markGuideDaySelectionCommitted(
  surface: GuideDaySwitchSurface,
  selectedDayStartMs: number,
): void {
  const trace = activeTrace(surface, selectedDayStartMs);
  if (!trace || trace.selectionCommittedAtMs !== undefined) return;
  const committedAtMs = guidePerfNowMs();
  trace.selectionCommittedAtMs = committedAtMs;
  emit('selection-committed', surface, {
    selectedDayStartMs,
    tapToCommitMs: roundedMs(committedAtMs - trace.tapAtMs),
  });
}

export function markGuideDayFirstFrame(
  surface: GuideDaySwitchSurface,
  selectedDayStartMs: number,
  source: GuideDaySwitchPaintSource,
  channelCount?: number,
  programmeCount?: number,
): void {
  const trace = activeTrace(surface, selectedDayStartMs);
  if (!trace || trace.firstFrameAtMs !== undefined) return;
  const frameAtMs = guidePerfNowMs();
  trace.firstFrameAtMs = frameAtMs;
  emit('first-frame-proxy', surface, {
    selectedDayStartMs,
    source,
    channelCount,
    programmeCount,
    tapToFirstFrameMs: roundedMs(frameAtMs - trace.tapAtMs),
    commitToFirstFrameMs:
      trace.selectionCommittedAtMs === undefined
        ? null
        : roundedMs(frameAtMs - trace.selectionCommittedAtMs),
  });
}

export function createGuideDayCacheInstanceId(surface: GuideDaySwitchSurface): string {
  const id = `${surface}-${nextCacheInstanceId}`;
  nextCacheInstanceId += 1;
  return id;
}

export function markGuideDayCacheMounted(
  surface: GuideDaySwitchSurface,
  cacheInstanceId: string,
): void {
  emit('selected-window-cache-mounted', surface, { cacheInstanceId });
}

export function markGuideDayCacheUnmounted(
  surface: GuideDaySwitchSurface,
  cacheInstanceId: string,
): void {
  emit('selected-window-cache-unmounted', surface, { cacheInstanceId });
}

export function markGuideDayWindowResolution(
  surface: GuideDaySwitchSurface,
  selectedDayStartMs: number,
  cacheInstanceId: string,
  source: GuideDayWindowResolutionSource,
  force: boolean,
  channelCount?: number,
  programmeCount?: number,
): void {
  const trace = activeTrace(surface, selectedDayStartMs);
  emit('selected-window-resolution', surface, {
    resolvedTraceId: trace?.id ?? null,
    selectedDayStartMs,
    cacheInstanceId,
    source,
    force,
    channelCount,
    programmeCount,
  });
}

export function markGuideDayWindowNetworkStarted(
  surface: GuideDaySwitchSurface,
  selectedDayStartMs: number,
  cacheInstanceId: string,
  requestedDayCount: 1 | 2,
  force: boolean,
): number {
  const startedAtMs = guidePerfNowMs();
  const trace = activeTrace(surface, selectedDayStartMs);
  emit('selected-window-network-start', surface, {
    networkTraceId: trace?.id ?? null,
    selectedDayStartMs,
    cacheInstanceId,
    requestedDayCount,
    force,
  });
  return startedAtMs;
}

export function markGuideDayWindowNetworkFinished(
  surface: GuideDaySwitchSurface,
  selectedDayStartMs: number,
  cacheInstanceId: string,
  startedAtMs: number,
  source: Extract<GuideDayWindowResolutionSource, 'network' | 'unavailable' | 'network-error'>,
  channelCount?: number,
  programmeCount?: number,
): void {
  const trace = activeTrace(surface, selectedDayStartMs);
  emit('selected-window-network-finish', surface, {
    networkTraceId: trace?.id ?? null,
    selectedDayStartMs,
    cacheInstanceId,
    source,
    durationMs: roundedMs(guidePerfNowMs() - startedAtMs),
    channelCount,
    programmeCount,
  });
}

/**
 * Fixture alignment lives below the Guide feature layer. Match its selected-day anchor to
 * the active interaction trace here so the data layer can report cost without importing UI.
 */
export function markGuideFixtureAlignment(
  selectedDayStartMs: number,
  durationMs: number,
  channelCount: number,
  programmeCount: number,
): void {
  for (const [surface, trace] of activeTraceBySurface) {
    if (trace.toDayStartMs !== selectedDayStartMs) continue;
    emit('fixture-alignment', surface, {
      fixtureTraceId: trace.id,
      selectedDayStartMs,
      durationMs: roundedMs(durationMs),
      channelCount,
      programmeCount,
    });
    return;
  }
}
