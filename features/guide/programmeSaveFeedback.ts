import type { Programme } from '@/data/domain/epg';
import {
  GUIDE_TIME_ZONE,
  guideTelevisionDayStart,
} from '@/data/domain/guideTime';
import {
  programmeBelongsToActiveTonightPlan,
  programmeIntersectsWindow,
  tonightWindow,
} from '@/data/domain/tonight';

const weekdayFormatter = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'long',
  timeZone: GUIDE_TIME_ZONE,
});

export function programmeSaveFeedback(
  programme: Programme,
  saved: boolean,
  nowMs = Date.now(),
): string {
  if (!saved) {
    return programmeBelongsToActiveTonightPlan(programme, nowMs)
      ? 'Niet meer in Jouw gids'
      : 'Niet meer bewaard';
  }

  if (programmeBelongsToActiveTonightPlan(programme, nowMs)) {
    return 'Bewaard in Jouw gids';
  }

  const activeDayStartMs = guideTelevisionDayStart(nowMs);
  const programmeDayStartMs = guideTelevisionDayStart(Date.parse(programme.startAt));
  const programmeWindow = tonightWindow(programmeDayStartMs);
  if (
    programmeDayStartMs > activeDayStartMs &&
    programmeIntersectsWindow(
      programme,
      programmeWindow.eveningStartMs,
      programmeWindow.eveningEndMs,
    )
  ) {
    return `Bewaard voor ${weekdayFormatter.format(new Date(programmeDayStartMs))}avond`;
  }

  return 'Programma bewaard';
}
