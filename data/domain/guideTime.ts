export const GUIDE_TIME_ZONE = 'Europe/Amsterdam';
export const GUIDE_TELEVISION_DAY_START_HOUR = 6;
export const GUIDE_TELEVISION_DAY_OFFSETS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7] as const;

export type GuideTelevisionDayOffset = (typeof GUIDE_TELEVISION_DAY_OFFSETS)[number];

export type GuideTelevisionDayWindow = {
  offset: GuideTelevisionDayOffset;
  fromMs: number;
  toMs: number;
};

type AmsterdamWallClockParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
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

function amsterdamWallClockParts(instantMs: number): AmsterdamWallClockParts {
  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;
  let hour: number | undefined;
  let minute: number | undefined;
  let second: number | undefined;

  for (const part of formatter.formatToParts(instantMs)) {
    switch (part.type) {
      case 'year':
        year = Number(part.value);
        break;
      case 'month':
        month = Number(part.value);
        break;
      case 'day':
        day = Number(part.value);
        break;
      case 'hour':
        hour = Number(part.value);
        break;
      case 'minute':
        minute = Number(part.value);
        break;
      case 'second':
        second = Number(part.value);
        break;
      default:
        break;
    }
  }

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined
  ) {
    throw new RangeError('Missing Amsterdam wall-clock date field');
  }

  return { year, month, day, hour, minute, second };
}

/** Encode Amsterdam wall-clock fields as UTC for offset arithmetic only. */
function wallClockMsFromParts(parts: AmsterdamWallClockParts): number {
  const wallClock = new Date(0);
  wallClock.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  wallClock.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  return wallClock.getTime();
}

function wallClockMs(instantMs: number): number {
  return wallClockMsFromParts(amsterdamWallClockParts(instantMs));
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
 * This remains the strict-midnight primitive used by legacy fixture alignment.
 * Product Guide grouping must use `guideTelevisionDayStart` instead.
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
 * Resolve one Amsterdam wall-clock time inside a specific television day.
 * Hours before 06:00 intentionally resolve on the following calendar date,
 * while 06:00-23:59 resolve on the television-day label date.
 */
export function guideTelevisionDayTime(
  televisionDayStartMs: number,
  hour: number,
  minute = 0,
  second = 0,
): number {
  assertValidInstant(televisionDayStartMs);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new RangeError('Hour must be 0-23');
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new RangeError('Minute must be 0-59');
  }
  if (!Number.isInteger(second) || second < 0 || second > 59) {
    throw new RangeError('Second must be 0-59');
  }

  const normalizedStart = guideTelevisionDayStart(televisionDayStartMs);
  const target = new Date(wallClockMs(normalizedStart));
  if (hour < GUIDE_TELEVISION_DAY_START_HOUR) target.setUTCDate(target.getUTCDate() + 1);
  target.setUTCHours(hour, minute, second, 0);

  return resolveAmsterdamWallClock(target.getTime(), 'television-day wall-clock time');
}

/**
 * Preserve the Amsterdam wall-clock time while moving to another television day.
 * A spring-DST nonexistent time is advanced by the DST gap, which is the nearest
 * practical equivalent rather than silently switching to a different day.
 */
export function guideTelevisionDayMatchingWallClock(
  sourceInstantMs: number,
  televisionDayStartMs: number,
): number {
  assertValidInstant(sourceInstantMs);
  const { hour, minute, second } = amsterdamWallClockParts(sourceInstantMs);

  try {
    return guideTelevisionDayTime(televisionDayStartMs, hour, minute, second);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    const target = new Date(wallClockMs(guideTelevisionDayStart(televisionDayStartMs)));
    if (hour < GUIDE_TELEVISION_DAY_START_HOUR) target.setUTCDate(target.getUTCDate() + 1);
    target.setUTCHours(hour, minute + 60, second, 0);
    return resolveAmsterdamWallClock(target.getTime(), 'DST-adjusted television-day wall-clock time');
  }
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
