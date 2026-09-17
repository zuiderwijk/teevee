import type { GuideFixture, Programme } from '@/data/domain/epg';

import { PER_CHANNEL_VISUAL_METRICS } from './guideVisualMetrics';

/**
 * Keep schedule geometry time-based so a vertical offset represents the same
 * wall-clock anchor on every channel. Dynamic Type expands the time scale in
 * direct proportion to the system font scale; programme duration geometry is
 * never replaced by equal-height rows.
 */
export const PER_CHANNEL_MINUTE_HEIGHT = PER_CHANNEL_VISUAL_METRICS.minuteHeightBase;

export function perChannelMinuteHeightForFontScale(fontScale: number): number {
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  return PER_CHANNEL_MINUTE_HEIGHT * scale;
}

export type ProgrammeVerticalFrame = {
  top: number;
  height: number;
};

export type ProgrammeDensity = 'hidden' | 'compact' | 'normal';

export type CurrentProgrammePresentation = {
  density: ProgrammeDensity;
  showProgress: boolean;
  showDescription: boolean;
};

export function normalizedProgrammeHeight(frameHeight: number, fontScale: number): number {
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  return Math.max(0, frameHeight) / scale;
}

export function programmeDensityForNormalizedHeight(normalizedHeight: number): ProgrammeDensity {
  if (normalizedHeight < PER_CHANNEL_VISUAL_METRICS.normalTitleMinNormalizedHeight) return 'hidden';
  if (normalizedHeight < PER_CHANNEL_VISUAL_METRICS.normalFullTitleMinNormalizedHeight) return 'compact';
  return 'normal';
}

export function currentProgrammePresentationForNormalizedHeight(
  normalizedHeight: number,
): CurrentProgrammePresentation {
  return {
    density: programmeDensityForNormalizedHeight(normalizedHeight),
    showProgress:
      normalizedHeight >= PER_CHANNEL_VISUAL_METRICS.currentProgressMinNormalizedHeight,
    showDescription:
      normalizedHeight >= PER_CHANNEL_VISUAL_METRICS.currentDescriptionMinNormalizedHeight,
  };
}

export function perChannelCollapseProgress(scrollY: number, reduceMotion: boolean): number {
  const y = Math.max(0, scrollY);
  if (reduceMotion) {
    return y >= PER_CHANNEL_VISUAL_METRICS.reduceMotionSwitchOffset ? 1 : 0;
  }
  return Math.min(1, y / PER_CHANNEL_VISUAL_METRICS.collapseDistance);
}

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
