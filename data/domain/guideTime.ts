export const GUIDE_TIME_ZONE = 'Europe/Amsterdam';
export const GUIDE_TELEVISION_DAY_START_HOUR = 6;
export const GUIDE_TELEVISION_DAY_OFFSETS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7] as const;

export type GuideTelevisionDayOffset = (typeof GUIDE_TELEVISION_DAY_OFFSETS)[number];

export type GuideTelevisionDayWindow = {
  offset: GuideTelevisionDayOffset;
  fromMs: number;
  toMs: number;
};

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: GUIDE_TIME_ZONE,
  calendar: 'gregory',
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function assertValidInstant(instantMs: number): void {
  if (!Number.isFinite(instantMs) || !Number.isFinite(new Date(instantMs).getTime())) {
    throw new RangeError('A valid timestamp is required');
  }
}

function assertIntegerDayOffset(dayOffset: number): void {
  if (!Number.isInteger(dayOffset)) throw new RangeError('Day offset must be an integer');
}

/** Encode Amsterdam wall-clock fields as UTC for offset arithmetic only. */
function wallClockMs(instantMs: number): number {
  const parts = formatter.formatToParts(instantMs);
  const field = (name: string): number => {
    const value = parts.find((part) => part.type === name)?.value;
    if (value === undefined) throw new RangeError(`Missing date field: ${name}`);
    return Number(value);
  };
  const wallClock = new Date(0);
  wallClock.setUTCFullYear(field('year'), field('month') - 1, field('day'));
  wallClock.setUTCHours(field('hour'), field('minute'), field('second'), 0);
  return wallClock.getTime();
}

/** Resolve Amsterdam wall-clock fields back to their real UTC instant. */
function resolveAmsterdamWallClock(targetWallClockMs: number, boundaryName: string): number {
  if (!Number.isFinite(targetWallClockMs)) throw new RangeError('Day offset is out of range');

  let candidate = targetWallClockMs;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const correction = targetWallClockMs - wallClockMs(candidate);
    if (correction === 0) return candidate;
    candidate += correction;
  }
  throw new RangeError(`Could not resolve Amsterdam ${boundaryName}`);
}

/**
 * Start of an Amsterdam calendar day, independent of the device timezone.
 *
 * This remains the strict-midnight primitive used by the temporary Phase-3
 * calendar-day transport/runtime path. Product Guide grouping must use
 * `guideTelevisionDayStart` instead.
 *
 * Calendar offsets must not be implemented as multiples of 24 hours: the
 * daylight-saving transition days are 23 and 25 hours long.
 */
export function guideDayStart(instantMs: number, dayOffset = 0): number {
  assertValidInstant(instantMs);
  assertIntegerDayOffset(dayOffset);

  const target = new Date(wallClockMs(instantMs));
  target.setUTCHours(0, 0, 0, 0);
  target.setUTCDate(target.getUTCDate() + dayOffset);

  return resolveAmsterdamWallClock(target.getTime(), 'midnight');
}

/**
 * Start of the Teevee television day containing `instantMs`.
 *
 * A television day is 06:00 Europe/Amsterdam -> 06:00 the following local
 * calendar day. Therefore instants from 00:00 through 05:59 belong to the
 * preceding television day. Canonical programme timestamps remain unchanged;
 * this function derives only the Guide grouping boundary.
 *
 * `dayOffset` is a calendar-day offset from the television day containing the
 * supplied instant. It is intentionally not fixed-duration arithmetic so the
 * spring/fall DST television days resolve to 23/25 real hours where required.
 */
export function guideTelevisionDayStart(instantMs: number, dayOffset = 0): number {
  assertValidInstant(instantMs);
  assertIntegerDayOffset(dayOffset);

  const target = new Date(wallClockMs(instantMs));
  if (target.getUTCHours() < GUIDE_TELEVISION_DAY_START_HOUR) {
    target.setUTCDate(target.getUTCDate() - 1);
  }
  target.setUTCHours(GUIDE_TELEVISION_DAY_START_HOUR, 0, 0, 0);
  target.setUTCDate(target.getUTCDate() + dayOffset);

  return resolveAmsterdamWallClock(target.getTime(), 'television-day boundary');
}

/**
 * Return the exact minimum product horizon D-2..D+7 as ten contiguous
 * television-day windows around the television day containing `anchorMs`.
 */
export function guideTelevisionDayHorizon(anchorMs: number): GuideTelevisionDayWindow[] {
  assertValidInstant(anchorMs);

  return GUIDE_TELEVISION_DAY_OFFSETS.map((offset) => ({
    offset,
    fromMs: guideTelevisionDayStart(anchorMs, offset),
    toMs: guideTelevisionDayStart(anchorMs, offset + 1),
  }));
}
