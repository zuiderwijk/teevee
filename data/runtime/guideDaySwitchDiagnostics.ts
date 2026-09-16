export type GuideDaySwitchSurface = 'totaal' | 'per-zender';
export type GuideDaySwitchPaintSource = 'fixture' | 'schedule';

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
const LOG_FLUSH_DELAY_MS = 2_500;
let nextTraceId = 1;
let mountedSurface: GuideDaySwitchSurface | null = null;
let logFlushTimer: ReturnType<typeof setTimeout> | null = null;
const pendingLogLines: string[] = [];
const activeTraceBySurface = new Map<GuideDaySwitchSurface, ActiveGuideDaySwitchTrace>();

export function guidePerfNowMs(): number {
  return typeof globalThis.performance?.now === 'function' ? globalThis.performance.now() : Date.now();
}

function roundedMs(value: number): number {
  return Math.round(value * 10) / 10;
}

function activeTrace(surface: GuideDaySwitchSurface, targetDayStartMs?: number) {
  const trace = activeTraceBySurface.get(surface) ?? null;
  if (!trace) return null;
  if (targetDayStartMs !== undefined && trace.toDayStartMs !== targetDayStartMs) return null;
  return trace;
}

function deferLogFlush(): void {
  if (logFlushTimer !== null) clearTimeout(logFlushTimer);
  logFlushTimer = setTimeout(() => {
    logFlushTimer = null;
    flushGuideDaySwitchDiagnostics();
  }, LOG_FLUSH_DELAY_MS);
}

export function flushGuideDaySwitchDiagnostics(): void {
  if (logFlushTimer !== null) {
    clearTimeout(logFlushTimer);
    logFlushTimer = null;
  }
  const lines = pendingLogLines.splice(0);
  lines.forEach((line) => console.info(line));
}

function emit(event: string, surface: GuideDaySwitchSurface, fields: GuideDaySwitchEventFields = {}) {
  const trace = activeTrace(surface);
  pendingLogLines.push(`${LOG_PREFIX} ${JSON.stringify({
    event,
    surface,
    traceId: trace?.id ?? null,
    at: new Date().toISOString(),
    ...fields,
  })}`);
  deferLogFlush();
}

export function markGuideDaySwitchSurfaceMounted(surface: GuideDaySwitchSurface): void {
  mountedSurface = surface;
}

export function markGuideDaySwitchSurfaceUnmounted(surface: GuideDaySwitchSurface): void {
  activeTraceBySurface.delete(surface);
  if (mountedSurface === surface) mountedSurface = null;
}

export function beginMountedGuideDaySwitchTrace(fromDayStartMs: number, toDayStartMs: number): number | null {
  if (!mountedSurface) return null;
  const trace: ActiveGuideDaySwitchTrace = {
    id: nextTraceId++,
    surface: mountedSurface,
    fromDayStartMs,
    toDayStartMs,
    tapAtMs: guidePerfNowMs(),
  };
  activeTraceBySurface.set(mountedSurface, trace);
  emit('day-option-press', mountedSurface, { fromDayStartMs, toDayStartMs });
  return trace.id;
}

export function markGuideDaySelectionCommitted(surface: GuideDaySwitchSurface, selectedDayStartMs: number): void {
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
    commitToFirstFrameMs: trace.selectionCommittedAtMs === undefined
      ? null
      : roundedMs(frameAtMs - trace.selectionCommittedAtMs),
  });
}
