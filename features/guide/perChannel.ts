import type { GuideFixture, Programme } from '@/data/domain/epg';

/**
 * Keep schedule geometry time-based so a vertical offset represents the same
 * wall-clock anchor on every channel. The base density matches the accepted
 * open Per-zender schedule; larger system text expands this scale rather than
 * clipping substantive programme content into a fixed-height presentation.
 */
export const PER_CHANNEL_MINUTE_HEIGHT = 0.78;

export function perChannelMinuteHeightForFontScale(fontScale: number): number {
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  return Math.round(PER_CHANNEL_MINUTE_HEIGHT * scale * 100) / 100;
}

export type ProgrammeVerticalFrame = {
  top: number;
  height: number;
};

export function programmesForChannelDay(
  fixture: GuideFixture,
  channelId: string,
  dayStartMs: number,
  dayEndMs: number,
): Programme[] {
  return fixture.programmes
    .filter((programme) => {
      if (programme.channelId !== channelId) return false;
      const startMs = Date.parse(programme.startAt);
      const endMs = Date.parse(programme.endAt);
      return startMs < dayEndMs && endMs > dayStartMs;
    })
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
}

export function scheduleYForTime(
  timeMs: number,
  dayStartMs: number,
  minuteHeight = PER_CHANNEL_MINUTE_HEIGHT,
): number {
  return Math.max(0, ((timeMs - dayStartMs) / 60_000) * minuteHeight);
}

export function scheduleTimeForY(
  y: number,
  dayStartMs: number,
  minuteHeight = PER_CHANNEL_MINUTE_HEIGHT,
): number {
  return dayStartMs + (Math.max(0, y) / minuteHeight) * 60_000;
}

export function programmeVerticalFrame(
  programme: Programme,
  dayStartMs: number,
  dayEndMs: number,
  minuteHeight = PER_CHANNEL_MINUTE_HEIGHT,
): ProgrammeVerticalFrame {
  const visibleStart = Math.max(dayStartMs, Date.parse(programme.startAt));
  const visibleEnd = Math.min(dayEndMs, Date.parse(programme.endAt));
  const top = scheduleYForTime(visibleStart, dayStartMs, minuteHeight);
  const height = Math.max(0, ((visibleEnd - visibleStart) / 60_000) * minuteHeight);
  return { top, height };
}

export function adjacentChannelIndex(currentIndex: number, delta: -1 | 1, channelCount: number) {
  if (channelCount <= 0) return 0;
  return Math.min(channelCount - 1, Math.max(0, currentIndex + delta));
}
