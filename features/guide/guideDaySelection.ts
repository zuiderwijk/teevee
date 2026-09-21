import {
  guideTelevisionDayHorizon,
  guideTelevisionDayMatchingWallClock,
  guideTelevisionDayStart,
  guideTelevisionDayTime,
  GUIDE_TIME_ZONE,
  type GuideTelevisionDayWindow,
} from '@/data/domain/guideTime';

export type GuideDayNavigationTarget = {
  dayStartMs: number;
  timeMs: number;
};

function capitalise(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}

function formatNominalDay(dayStartMs: number): string {
  return capitalise(
    new Date(dayStartMs).toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: GUIDE_TIME_ZONE,
    }),
  );
}

export function guideDayOptions(nowMs: number): GuideTelevisionDayWindow[] {
  return guideTelevisionDayHorizon(nowMs);
}

export function guideDayIsSelectable(dayStartMs: number, nowMs: number): boolean {
  return guideDayOptions(nowMs).some((window) => window.fromMs === dayStartMs);
}

/**
 * Shared Totaal/Per-zender compact television-day wording. Relative labels are
 * available only from 06:00 through 23:59 Amsterdam time; before 06:00 every
 * option is explicit so the preceding television day is never called Vandaag.
 */
export function guideDayLabel(dayStartMs: number, nowMs: number): string {
  return perChannelGuideDayLabel(dayStartMs, nowMs);
}

function amsterdamHour(nowMs: number): number {
  const hourPart = new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: GUIDE_TIME_ZONE,
  })
    .formatToParts(new Date(nowMs))
    .find(({ type }) => type === 'hour')?.value;
  const hour = Number(hourPart);
  return Number.isFinite(hour) ? hour : 0;
}

export function perChannelGuideDayLabel(dayStartMs: number, nowMs: number): string {
  const formatted = formatNominalDay(dayStartMs);
  if (amsterdamHour(nowMs) < 6) return formatted;

  const currentTelevisionDayStartMs = guideTelevisionDayStart(nowMs);
  if (dayStartMs === currentTelevisionDayStartMs) return 'Vandaag';
  if (dayStartMs === guideTelevisionDayStart(nowMs, 1)) return 'Morgen';
  return formatted;
}

export function guideTargetForDaySelection(
  viewedTimeMs: number,
  targetDayStartMs: number,
): GuideDayNavigationTarget {
  return {
    dayStartMs: targetDayStartMs,
    timeMs: guideTelevisionDayMatchingWallClock(viewedTimeMs, targetDayStartMs),
  };
}

export function guideTargetForNow(nowMs: number): GuideDayNavigationTarget {
  return {
    dayStartMs: guideTelevisionDayStart(nowMs),
    timeMs: nowMs,
  };
}

/**
 * Totaal's visible date context is a projection of its stable viewed-time anchor.
 * Real-clock rollover is intentionally not an input: the label changes only when the
 * Guide anchor itself crosses 06:00, or when an explicit action such as `Nu` moves it.
 */
export function guideTotaalDayForViewedAnchor(viewedTimeMs: number): number {
  return guideTelevisionDayStart(viewedTimeMs);
}

export function guideTargetForPrimetime(selectedDayStartMs: number): GuideDayNavigationTarget {
  return {
    dayStartMs: guideTelevisionDayStart(selectedDayStartMs),
    timeMs: guideTelevisionDayTime(selectedDayStartMs, 20, 30),
  };
}

/**
 * Reconcile a mounted Guide when the real current television day rolls at 06:00.
 * A view that was still on the previous current day follows the rollover; an explicit
 * historical/future selection is retained while it remains inside the new horizon.
 * Totaal deliberately does not use this current-day-following path: its visible day is
 * derived from the stable viewed-time anchor via `guideTotaalDayForViewedAnchor`.
 */
export function reconcileGuideDaySelection(
  selectedDayStartMs: number,
  previousCurrentDayStartMs: number,
  nowMs: number,
): number {
  const nextCurrentDayStartMs = guideTelevisionDayStart(nowMs);
  if (selectedDayStartMs === previousCurrentDayStartMs) return nextCurrentDayStartMs;

  const options = guideDayOptions(nowMs);
  if (options.some((window) => window.fromMs === selectedDayStartMs)) return selectedDayStartMs;

  if (selectedDayStartMs < options[0]!.fromMs) return options[0]!.fromMs;
  return options.at(-1)!.fromMs;
}
