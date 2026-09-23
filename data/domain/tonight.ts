import type { Programme } from './epg';
import {
  GUIDE_TIME_ZONE,
  guideTelevisionDayStart,
  guideTelevisionDayTime,
} from './guideTime';

export type TonightWindow = {
  televisionDayStartMs: number;
  eveningStartMs: number;
  categoryStartMs: number;
  eveningEndMs: number;
};

const eveningDateFormatter = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: GUIDE_TIME_ZONE,
});

function parsedInstant(value: string, field: string): number {
  const instant = Date.parse(value);
  if (!Number.isFinite(instant)) {
    throw new RangeError(`Programme ${field} must be a valid timestamp`);
  }
  return instant;
}

export function tonightWindow(anchorMs: number): TonightWindow {
  const televisionDayStartMs = guideTelevisionDayStart(anchorMs);
  return {
    televisionDayStartMs,
    eveningStartMs: guideTelevisionDayTime(televisionDayStartMs, 18),
    categoryStartMs: guideTelevisionDayTime(televisionDayStartMs, 19),
    eveningEndMs: guideTelevisionDayStart(televisionDayStartMs, 1),
  };
}

export function programmeStartsInWindow(
  programme: Pick<Programme, 'startAt'>,
  fromMs: number,
  toMs: number,
): boolean {
  const startMs = parsedInstant(programme.startAt, 'startAt');
  return startMs >= fromMs && startMs < toMs;
}

export function programmeIntersectsWindow(
  programme: Pick<Programme, 'startAt' | 'endAt'>,
  fromMs: number,
  toMs: number,
): boolean {
  const startMs = parsedInstant(programme.startAt, 'startAt');
  const endMs = parsedInstant(programme.endAt, 'endAt');
  return startMs < toMs && endMs > fromMs;
}

export function programmeIsCurrentAt(
  programme: Pick<Programme, 'startAt' | 'endAt'>,
  nowMs: number,
): boolean {
  const startMs = parsedInstant(programme.startAt, 'startAt');
  const endMs = parsedInstant(programme.endAt, 'endAt');
  return startMs <= nowMs && nowMs < endMs;
}

export function programmeHasEndedAt(
  programme: Pick<Programme, 'endAt'>,
  nowMs: number,
): boolean {
  return parsedInstant(programme.endAt, 'endAt') <= nowMs;
}

export function programmeBelongsToActiveTonightPlan(
  programme: Pick<Programme, 'startAt' | 'endAt'>,
  nowMs: number,
): boolean {
  const window = tonightWindow(nowMs);
  return programmeIntersectsWindow(
    programme,
    window.eveningStartMs,
    window.eveningEndMs,
  );
}

export function tonightEveningDateLabel(anchorMs: number): string {
  const label = eveningDateFormatter.format(
    new Date(guideTelevisionDayStart(anchorMs)),
  );
  return label.length > 0 ? label[0]!.toLocaleUpperCase('nl-NL') + label.slice(1) : label;
}

export function tonightClassificationCandidateProgrammeIds(
  programmes: readonly Programme[],
  nowMs: number,
): string[] {
  const window = tonightWindow(nowMs);
  return programmes
    .filter(
      (programme) =>
        programmeStartsInWindow(
          programme,
          window.categoryStartMs,
          window.eveningEndMs,
        ) && !programmeHasEndedAt(programme, nowMs),
    )
    .map((programme) => programme.id);
}
