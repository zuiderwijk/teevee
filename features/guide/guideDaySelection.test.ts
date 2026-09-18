import { describe, expect, it } from 'vitest';

import {
  guideDayIsSelectable,
  guideDayLabel,
  guideDayOptions,
  guideTargetForDaySelection,
  guideTargetForNow,
  guideTargetForPrimetime,
  guideTotaalDayForViewedAnchor,
  perChannelGuideDayLabel,
  reconcileGuideDaySelection,
} from './guideDaySelection';

function amsterdamTime(instantMs: number): string {
  return new Date(instantMs).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

describe('Guide day selection', () => {
  it('exposes exactly D-2 through D+7 and nothing outside that bounded horizon', () => {
    const nowMs = Date.parse('2026-09-15T17:00:00Z');
    const options = guideDayOptions(nowMs);

    expect(options.map(({ offset }) => offset)).toEqual([-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]);
    expect(options).toHaveLength(10);
    expect(guideDayIsSelectable(options[0]!.fromMs, nowMs)).toBe(true);
    expect(guideDayIsSelectable(options.at(-1)!.fromMs, nowMs)).toBe(true);
    expect(guideDayIsSelectable(options[0]!.fromMs - 24 * 60 * 60 * 1000, nowMs)).toBe(false);
    expect(guideDayIsSelectable(options.at(-1)!.toMs, nowMs)).toBe(false);
  });

  it('does not call the preceding television day Vandaag before 06:00', () => {
    const nowMs = Date.parse('2026-09-15T03:59:00Z'); // 05:59 CEST Sep 15; D is Sep 14
    const options = guideDayOptions(nowMs);
    const currentTelevisionDay = options.find(({ offset }) => offset === 0)!;
    const followingTelevisionDay = options.find(({ offset }) => offset === 1)!;

    expect(guideDayLabel(currentTelevisionDay.fromMs, nowMs)).toBe('Ma 14 sep');
    expect(guideDayLabel(followingTelevisionDay.fromMs, nowMs)).toBe('Vandaag · di 15 sep');
  });

  it('uses the canonical Per-zender relative labels only from 06:00 through 23:59', () => {
    const beforeBoundary = Date.parse('2026-09-15T03:59:00Z');
    const beforeOptions = guideDayOptions(beforeBoundary);
    expect(perChannelGuideDayLabel(beforeOptions.find(({ offset }) => offset === 0)!.fromMs, beforeBoundary)).toBe('Ma 14 sep');
    expect(perChannelGuideDayLabel(beforeOptions.find(({ offset }) => offset === 1)!.fromMs, beforeBoundary)).toBe('Di 15 sep');

    const boundary = Date.parse('2026-09-15T04:00:00Z');
    const boundaryOptions = guideDayOptions(boundary);
    expect(perChannelGuideDayLabel(boundaryOptions.find(({ offset }) => offset === 0)!.fromMs, boundary)).toBe('Vandaag');
    expect(perChannelGuideDayLabel(boundaryOptions.find(({ offset }) => offset === 1)!.fromMs, boundary)).toBe('Morgen');

    const lateEvening = Date.parse('2026-09-15T21:59:00Z');
    const lateOptions = guideDayOptions(lateEvening);
    expect(perChannelGuideDayLabel(lateOptions.find(({ offset }) => offset === 0)!.fromMs, lateEvening)).toBe('Vandaag');
    expect(perChannelGuideDayLabel(lateOptions.find(({ offset }) => offset === 1)!.fromMs, lateEvening)).toBe('Morgen');

    const afterMidnight = Date.parse('2026-09-15T22:00:00Z');
    const midnightOptions = guideDayOptions(afterMidnight);
    expect(perChannelGuideDayLabel(midnightOptions.find(({ offset }) => offset === 0)!.fromMs, afterMidnight)).toBe('Di 15 sep');
    expect(perChannelGuideDayLabel(midnightOptions.find(({ offset }) => offset === 1)!.fromMs, afterMidnight)).toBe('Wo 16 sep');
  });

  it('changes relative labels at exactly 06:00 without a midnight television-day rollover', () => {
    const midnight = Date.parse('2026-09-14T22:00:00Z');
    const beforeBoundary = Date.parse('2026-09-15T03:59:00Z');
    const boundary = Date.parse('2026-09-15T04:00:00Z');

    expect(guideDayOptions(midnight).find(({ offset }) => offset === 0)!.fromMs).toBe(
      guideDayOptions(beforeBoundary).find(({ offset }) => offset === 0)!.fromMs,
    );
    expect(guideDayOptions(boundary).find(({ offset }) => offset === 0)!.fromMs).not.toBe(
      guideDayOptions(beforeBoundary).find(({ offset }) => offset === 0)!.fromMs,
    );
  });

  it('preserves the viewed Amsterdam wall-clock time when selecting another day', () => {
    const viewedTimeMs = Date.parse('2026-09-15T18:35:00Z'); // 20:35 CEST
    const targetDay = guideDayOptions(viewedTimeMs).find(({ offset }) => offset === 3)!;
    const target = guideTargetForDaySelection(viewedTimeMs, targetDay.fromMs);

    expect(target.dayStartMs).toBe(targetDay.fromMs);
    expect(amsterdamTime(target.timeMs)).toBe('20:35');
  });

  it('uses the nearest practical wall-clock equivalent for a nonexistent spring-DST time', () => {
    const source = Date.parse('2026-03-22T01:30:00Z'); // 02:30 CET
    const springDay = guideDayOptions(Date.parse('2026-03-29T12:00:00Z')).find(
      ({ offset }) => offset === -1,
    )!;
    const target = guideTargetForDaySelection(source, springDay.fromMs);

    expect(amsterdamTime(target.timeMs)).toBe('03:30');
    expect(target.timeMs).toBeGreaterThanOrEqual(springDay.fromMs);
    expect(target.timeMs).toBeLessThan(springDay.toMs);
  });

  it('preserves an ambiguous fall-DST wall-clock hour inside the selected television day', () => {
    const source = Date.parse('2026-10-18T00:30:00Z'); // 02:30 CEST
    const fallDay = guideDayOptions(Date.parse('2026-10-25T12:00:00Z')).find(
      ({ offset }) => offset === -1,
    )!;
    const target = guideTargetForDaySelection(source, fallDay.fromMs);

    expect(amsterdamTime(target.timeMs)).toBe('02:30');
    expect(target.timeMs).toBeGreaterThanOrEqual(fallDay.fromMs);
    expect(target.timeMs).toBeLessThan(fallDay.toMs);
  });

  it('Nu restores the real instant and its containing television day', () => {
    const nowMs = Date.parse('2026-09-15T03:59:00Z');
    const target = guideTargetForNow(nowMs);

    expect(target.timeMs).toBe(nowMs);
    expect(target.dayStartMs).toBe(Date.parse('2026-09-14T04:00:00Z'));
  });

  it('keeps Totaal date context on its stationary viewed anchor through the real 06:00 rollover', () => {
    const beforeBoundary = Date.parse('2026-09-15T03:59:00Z'); // 05:59 CEST
    const boundary = Date.parse('2026-09-15T04:00:00Z'); // 06:00 CEST
    const oldTelevisionDay = guideTotaalDayForViewedAnchor(beforeBoundary);
    const newCurrentTelevisionDay = guideDayOptions(boundary).find(({ offset }) => offset === 0)!.fromMs;

    // The real clock has rolled to a new D, but a stationary Totaal anchor is still 05:59.
    expect(newCurrentTelevisionDay).not.toBe(oldTelevisionDay);
    expect(guideTotaalDayForViewedAnchor(beforeBoundary)).toBe(oldTelevisionDay);

    // The visible date changes only when the Guide anchor itself crosses the boundary.
    expect(guideTotaalDayForViewedAnchor(boundary)).toBe(newCurrentTelevisionDay);

    // Nu is the explicit exception: it moves the anchor to the real instant/current D.
    const nowTarget = guideTargetForNow(boundary);
    expect(guideTotaalDayForViewedAnchor(nowTarget.timeMs)).toBe(nowTarget.dayStartMs);
    expect(nowTarget.dayStartMs).toBe(newCurrentTelevisionDay);
  });

  it('Primetime keeps the selected day and targets 20:30 on its label date, including pre-06:00 context', () => {
    const preBoundaryNow = Date.parse('2026-09-15T03:59:00Z');
    const selectedDay = guideDayOptions(preBoundaryNow).find(({ offset }) => offset === 0)!;
    const target = guideTargetForPrimetime(selectedDay.fromMs);

    expect(target.dayStartMs).toBe(selectedDay.fromMs);
    expect(target.timeMs).toBe(Date.parse('2026-09-14T18:30:00Z'));
    expect(amsterdamTime(target.timeMs)).toBe('20:30');
  });

  it('follows the current day at 06:00 but retains a manually selected non-current day', () => {
    const beforeBoundary = Date.parse('2026-09-15T03:59:00Z');
    const previousCurrent = guideDayOptions(beforeBoundary).find(({ offset }) => offset === 0)!.fromMs;
    const manualFuture = guideDayOptions(beforeBoundary).find(({ offset }) => offset === 3)!.fromMs;
    const afterBoundary = Date.parse('2026-09-15T04:00:00Z');

    expect(reconcileGuideDaySelection(previousCurrent, previousCurrent, afterBoundary)).toBe(
      guideDayOptions(afterBoundary).find(({ offset }) => offset === 0)!.fromMs,
    );
    expect(reconcileGuideDaySelection(manualFuture, previousCurrent, afterBoundary)).toBe(manualFuture);
  });
});
