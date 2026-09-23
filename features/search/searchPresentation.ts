import type { Programme } from '@/data/domain/epg';
import { GUIDE_TIME_ZONE, guideDayStart } from '@/data/domain/guideTime';
import type { GuideSearchProgrammeMatch } from '@/data/domain/search';

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new RangeError('Search programme timestamp is invalid');
  return parsed;
}

export function guideSearchProgrammeIsCurrent(
  programme: Programme,
  nowMs: number,
): boolean {
  const startMs = timestamp(programme.startAt);
  const endMs = timestamp(programme.endAt);
  return startMs <= nowMs && nowMs < endMs;
}

export function formatGuideSearchClock(value: string): string {
  return new Date(timestamp(value)).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: GUIDE_TIME_ZONE,
  });
}

export function formatGuideSearchDate(
  startAt: string,
  nowMs: number,
): string {
  const startMs = timestamp(startAt);
  const startDay = guideDayStart(startMs);
  const today = guideDayStart(nowMs);

  if (startDay === today) return 'Vandaag';
  if (startDay === guideDayStart(nowMs, 1)) return 'Morgen';
  if (startDay === guideDayStart(nowMs, -1)) return 'Gisteren';

  return new Date(startMs).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: GUIDE_TIME_ZONE,
  });
}

export function guideSearchBroadcastContext(
  programme: Programme,
  nowMs: number,
): string {
  if (guideSearchProgrammeIsCurrent(programme, nowMs)) {
    return `Nu · tot ${formatGuideSearchClock(programme.endAt)}`;
  }
  return `${formatGuideSearchDate(programme.startAt, nowMs)} · ${formatGuideSearchClock(programme.startAt)}`;
}

export function guideSearchProgrammeAccessibilityLabel({
  match,
  nowMs,
  isKijktip,
}: {
  match: GuideSearchProgrammeMatch;
  nowMs: number;
  isKijktip: boolean;
}): string {
  const { programme, channel } = match;
  const context = guideSearchProgrammeIsCurrent(programme, nowMs)
    ? `Nu, tot ${formatGuideSearchClock(programme.endAt)}`
    : `${formatGuideSearchDate(programme.startAt, nowMs)}, ${formatGuideSearchClock(programme.startAt)}`;

  return [
    programme.title,
    channel.displayName,
    context,
    isKijktip ? 'Kijktip' : null,
  ]
    .filter(Boolean)
    .join(', ');
}
