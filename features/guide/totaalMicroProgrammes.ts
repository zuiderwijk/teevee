import type { Programme } from '@/data/domain/epg';

import { TOTAAL_TYPOGRAPHY } from './totaal';

export const TOTAAL_MICRO_PROGRAMME_BASE_THRESHOLD = 48;
export const TOTAAL_MICRO_PROGRAMME_INSET_X = 6;
export const TOTAAL_MICRO_PROGRAMME_ELLIPSIS_BASE_MIN_WIDTH =
  TOTAAL_TYPOGRAPHY.programmeTitle.fontSize + TOTAAL_MICRO_PROGRAMME_INSET_X * 2;

const INTERNAL_WHITESPACE = /\s+/g;

export type TotaalRepeatedTitleRun = {
  id: string;
  channelId: string;
  title: string;
  normalisedTitle: string;
  startMs: number;
  endMs: number;
  programmes: readonly Programme[];
};

export type TotaalMicroProgrammeMetadata = {
  microProgrammeIds: ReadonlySet<string>;
  repeatedRunByProgrammeId: ReadonlyMap<string, string>;
  repeatedTitleRuns: readonly TotaalRepeatedTitleRun[];
};

export type TotaalRepeatedRunVisibleLayout = {
  visibleStartX: number;
  visibleEndX: number;
  visibleWidth: number;
  viewportOffsetX: number;
  contentTranslateX: number;
  showSharedTitle: boolean;
};

function safeScale(fontScale: number) {
  'worklet';
  return Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
}

export function totaalMicroProgrammeThreshold(fontScale: number): number {
  'worklet';
  return TOTAAL_MICRO_PROGRAMME_BASE_THRESHOLD * safeScale(fontScale);
}

/**
 * One programme-title em plus the existing 6-pt micro inset on both sides is the
 * smallest calm visual box for the ellipsis. Below it, the programme remains a full
 * action with its real boundary but carries no visible text glyph.
 */
export function totaalMicroProgrammeEllipsisMinWidth(fontScale: number): number {
  'worklet';
  return TOTAAL_MICRO_PROGRAMME_ELLIPSIS_BASE_MIN_WIDTH * safeScale(fontScale);
}

export function totaalMicroProgrammeShowsEllipsis(
  frameWidth: number,
  fontScale: number,
): boolean {
  'worklet';
  const width = Number.isFinite(frameWidth) ? Math.max(0, frameWidth) : 0;
  return width >= totaalMicroProgrammeEllipsisMinWidth(fontScale);
}

export function totaalIsMicroProgrammeFrameWidth(
  frameWidth: number,
  fontScale: number,
): boolean {
  'worklet';
  const width = Number.isFinite(frameWidth) ? Math.max(0, frameWidth) : 0;
  return width < totaalMicroProgrammeThreshold(fontScale);
}

export function totaalNormaliseRepeatedProgrammeTitle(title: string): string {
  return title.trim().replace(INTERNAL_WHITESPACE, ' ');
}

function programmeFrameWidth(programme: Programme, minuteWidth: number): number {
  const startMs = Date.parse(programme.startAt);
  const endMs = Date.parse(programme.endAt);
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    !Number.isFinite(minuteWidth) ||
    minuteWidth <= 0
  ) {
    return 0;
  }
  return Math.max(0, ((endMs - startMs) / 60_000) * minuteWidth);
}

function chronologicalProgrammes(programmes: readonly Programme[]): Programme[] {
  return [...programmes].sort((left, right) => {
    const startDelta = Date.parse(left.startAt) - Date.parse(right.startAt);
    if (startDelta !== 0) return startDelta;
    const endDelta = Date.parse(left.endAt) - Date.parse(right.endAt);
    if (endDelta !== 0) return endDelta;
    return left.id.localeCompare(right.id);
  });
}

export function deriveTotaalMicroProgrammeMetadata(
  programmesByChannel: ReadonlyMap<string, readonly Programme[]>,
  minuteWidth: number,
  fontScale: number,
): TotaalMicroProgrammeMetadata {
  const microProgrammeIds = new Set<string>();
  const repeatedRunByProgrammeId = new Map<string, string>();
  const repeatedTitleRuns: TotaalRepeatedTitleRun[] = [];

  for (const [channelId, sourceProgrammes] of programmesByChannel) {
    const programmes = chronologicalProgrammes(sourceProgrammes);

    for (const programme of programmes) {
      if (
        totaalIsMicroProgrammeFrameWidth(
          programmeFrameWidth(programme, minuteWidth),
          fontScale,
        )
      ) {
        microProgrammeIds.add(programme.id);
      }
    }

    let candidate: Programme[] = [];
    let candidateTitle = '';

    const finishCandidate = () => {
      if (candidate.length < 2) {
        candidate = [];
        candidateTitle = '';
        return;
      }

      const first = candidate[0]!;
      const last = candidate[candidate.length - 1]!;
      const startMs = Date.parse(first.startAt);
      const endMs = Date.parse(last.endAt);
      const id = `totaal-run:${channelId}:${first.id}:${last.id}`;
      const run: TotaalRepeatedTitleRun = {
        id,
        channelId,
        title: first.title,
        normalisedTitle: candidateTitle,
        startMs,
        endMs,
        programmes: candidate,
      };
      repeatedTitleRuns.push(run);
      for (const programme of candidate) {
        repeatedRunByProgrammeId.set(programme.id, id);
      }
      candidate = [];
      candidateTitle = '';
    };

    for (const programme of programmes) {
      const isMicro = microProgrammeIds.has(programme.id);
      const normalisedTitle = totaalNormaliseRepeatedProgrammeTitle(programme.title);

      if (!isMicro) {
        finishCandidate();
        continue;
      }

      if (candidate.length === 0) {
        candidate = [programme];
        candidateTitle = normalisedTitle;
        continue;
      }

      const previous = candidate[candidate.length - 1]!;
      const previousEndMs = Date.parse(previous.endAt);
      const nextStartMs = Date.parse(programme.startAt);
      const directlyAdjacent =
        Number.isFinite(previousEndMs) &&
        Number.isFinite(nextStartMs) &&
        previousEndMs === nextStartMs;

      if (directlyAdjacent && normalisedTitle === candidateTitle) {
        candidate.push(programme);
        continue;
      }

      finishCandidate();
      candidate = [programme];
      candidateTitle = normalisedTitle;
    }

    finishCandidate();
  }

  return {
    microProgrammeIds,
    repeatedRunByProgrammeId,
    repeatedTitleRuns,
  };
}

export function totaalRepeatedTitleRunsForTimeWindow(
  runs: readonly TotaalRepeatedTitleRun[],
  fromMs: number,
  toMs: number,
): TotaalRepeatedTitleRun[] {
  return runs.filter(
    (run) =>
      Number.isFinite(run.startMs) &&
      Number.isFinite(run.endMs) &&
      run.endMs > fromMs &&
      run.startMs < toMs,
  );
}

export type TotaalRepeatedTitleRunPresentation = {
  run: TotaalRepeatedTitleRun;
  programmes: readonly Programme[];
};

/**
 * Run identity/membership is full-schedule and immutable across programme-window buckets.
 * Presentation members are derived only from the already-bounded programme window so a
 * long repeated run cannot remount offscreen ellipsis nodes outside the canonical window.
 */
export function totaalRepeatedTitleRunPresentationsForWindow(
  runs: readonly TotaalRepeatedTitleRun[],
  repeatedRunByProgrammeId: ReadonlyMap<string, string>,
  windowedProgrammesByChannel: ReadonlyMap<string, readonly Programme[]>,
  fromMs: number,
  toMs: number,
): TotaalRepeatedTitleRunPresentation[] {
  return totaalRepeatedTitleRunsForTimeWindow(runs, fromMs, toMs).map((run) => ({
    run,
    programmes: (windowedProgrammesByChannel.get(run.channelId) ?? []).filter(
      (programme) => repeatedRunByProgrammeId.get(programme.id) === run.id,
    ),
  }));
}

export function totaalRepeatedRunVisibleLayout(
  runStartX: number,
  runEndX: number,
  viewportX: number,
  viewportWidth: number,
  fontScale: number,
): TotaalRepeatedRunVisibleLayout {
  'worklet';
  const safeRunStart = Number.isFinite(runStartX) ? runStartX : 0;
  const safeRunEnd = Number.isFinite(runEndX)
    ? Math.max(safeRunStart, runEndX)
    : safeRunStart;
  const safeViewportX = Number.isFinite(viewportX) ? Math.max(0, viewportX) : 0;
  const safeViewportWidth = Number.isFinite(viewportWidth)
    ? Math.max(0, viewportWidth)
    : 0;
  const viewportEndX = safeViewportX + safeViewportWidth;
  const visibleStartX = Math.max(safeRunStart, safeViewportX);
  const visibleEndX = Math.min(safeRunEnd, viewportEndX);
  const visibleWidth = Math.max(0, visibleEndX - visibleStartX);

  return {
    visibleStartX,
    visibleEndX,
    visibleWidth,
    viewportOffsetX: visibleStartX - safeViewportX,
    contentTranslateX: safeRunStart - visibleStartX,
    showSharedTitle:
      visibleWidth >= totaalMicroProgrammeThreshold(fontScale),
  };
}
