import type { Channel, GuideSchedule, Programme } from '../domain/epg';
import { guideDayStart } from '../domain/guideTime';

type InstalledGuideSchedule = {
  schedule: GuideSchedule;
  anchorDayStartMs: number;
};

let installed: InstalledGuideSchedule | null = null;

function channelsEqual(left: Channel, right: Channel): boolean {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.displayName === right.displayName &&
    left.sortOrder === right.sortOrder &&
    left.isActive === right.isActive &&
    left.shortName === right.shortName &&
    left.logoUrl === right.logoUrl
  );
}

function programmesEqual(left: Programme, right: Programme): boolean {
  return (
    left.id === right.id &&
    left.channelId === right.channelId &&
    left.startAt === right.startAt &&
    left.endAt === right.endAt &&
    left.title === right.title &&
    left.subtitle === right.subtitle &&
    left.description === right.description &&
    left.genre === right.genre &&
    left.isLive === right.isLive &&
    left.isRepeat === right.isRepeat
  );
}

/**
 * Canonical schedules are already deterministically ordered by the Teevee service/loader.
 * Comparing their full user-visible content lets app-resume refreshes avoid remounting the
 * Guide when the backend returned the same schedule again.
 */
export function guideSchedulesEqual(left: GuideSchedule, right: GuideSchedule): boolean {
  if (
    left.generatedAt !== right.generatedAt ||
    left.timezone !== right.timezone ||
    left.channels.length !== right.channels.length ||
    left.programmes.length !== right.programmes.length
  ) {
    return false;
  }

  return (
    left.channels.every((channel, index) => channelsEqual(channel, right.channels[index]!)) &&
    left.programmes.every((programme, index) =>
      programmesEqual(programme, right.programmes[index]!),
    )
  );
}

/**
 * Install provider-independent canonical data for the Amsterdam day containing anchorMs.
 * This small in-memory bridge deliberately owns no network/provider/backend knowledge.
 */
export function installRuntimeGuideSchedule(schedule: GuideSchedule, anchorMs: number): void {
  installed = {
    schedule,
    anchorDayStartMs: guideDayStart(anchorMs),
  };
}

export function runtimeGuideScheduleFor(anchorMs: number): GuideSchedule | null {
  if (!installed) return null;
  return installed.anchorDayStartMs === guideDayStart(anchorMs) ? installed.schedule : null;
}

export function clearRuntimeGuideSchedule(): void {
  installed = null;
}
