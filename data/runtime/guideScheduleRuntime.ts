import type { GuideSchedule } from '../domain/epg';
import { guideDayStart } from '../domain/guideTime';

type InstalledGuideSchedule = {
  schedule: GuideSchedule;
  anchorDayStartMs: number;
};

let installed: InstalledGuideSchedule | null = null;

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
