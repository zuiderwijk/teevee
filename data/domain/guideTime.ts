export const GUIDE_TIME_ZONE = 'Europe/Amsterdam';

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

/**
 * Start of an Amsterdam calendar day, independent of the device timezone.
 * Calendar offsets must not be implemented as multiples of 24 hours: the
 * daylight-saving transition days are 23 and 25 hours long.
 */
export function guideDayStart(instantMs: number, dayOffset = 0): number {
  if (!Number.isFinite(instantMs) || !Number.isFinite(new Date(instantMs).getTime())) {
    throw new RangeError('A valid timestamp is required');
  }
  if (!Number.isInteger(dayOffset)) throw new RangeError('Day offset must be an integer');

  const target = new Date(wallClockMs(instantMs));
  target.setUTCHours(0, 0, 0, 0);
  target.setUTCDate(target.getUTCDate() + dayOffset);
  const targetMs = target.getTime();
  if (!Number.isFinite(targetMs)) throw new RangeError('Day offset is out of range');

  let candidate = targetMs;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const correction = targetMs - wallClockMs(candidate);
    if (correction === 0) return candidate;
    candidate += correction;
  }
  throw new RangeError('Could not resolve Amsterdam midnight');
}
