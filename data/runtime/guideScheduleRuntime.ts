import type { ProgrammeEditorialSignal } from '../domain/editorial';
import type { Channel, GuideSchedule, Programme } from '../domain/epg';
import { guideTelevisionDayStart } from '../domain/guideTime';

type InstalledGuideSchedule = {
  schedule: GuideSchedule;
  editorialSignals: ProgrammeEditorialSignal[];
  anchorTelevisionDayStartMs: number;
};

let installed: InstalledGuideSchedule | null = null;
const editorialSignalListeners = new Set<() => void>();

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
 * Compare the complete user-visible canonical schedule content. `generatedAt` is server
 * freshness metadata, not presentation state, so a freshness-only update must not remount
 * the Guide and discard the user's scroll/channel context.
 */
export function guideScheduleContentEqual(left: GuideSchedule, right: GuideSchedule): boolean {
  if (
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
 * Install provider-independent canonical data for the Teevee television day containing
 * `anchorMs`. This small in-memory bridge deliberately owns no network/provider/backend
 * knowledge; it only scopes the installed schedule to the 06:00 Europe/Amsterdam runtime
 * boundary used by the Guide.
 */
function editorialSignalsEqual(
  left: readonly ProgrammeEditorialSignal[],
  right: readonly ProgrammeEditorialSignal[],
): boolean {
  return (
    left.length === right.length &&
    left.every((signal, index) => {
      const candidate = right[index];
      return (
        candidate !== undefined &&
        signal.programmeId === candidate.programmeId &&
        signal.type === candidate.type &&
        signal.source === candidate.source &&
        signal.sourceItemId === candidate.sourceItemId &&
        signal.sourceUrl === candidate.sourceUrl &&
        signal.publishedAt === candidate.publishedAt &&
        signal.matchedBy === candidate.matchedBy
      );
    })
  );
}

function notifyEditorialSignalListeners(): void {
  editorialSignalListeners.forEach((listener) => listener());
}

export function installRuntimeGuideSchedule(
  schedule: GuideSchedule,
  anchorMs: number,
  editorialSignals: ProgrammeEditorialSignal[] = [],
): void {
  const editorialChanged =
    !installed || !editorialSignalsEqual(installed.editorialSignals, editorialSignals);
  installed = {
    schedule,
    editorialSignals,
    anchorTelevisionDayStartMs: guideTelevisionDayStart(anchorMs),
  };
  if (editorialChanged) notifyEditorialSignalListeners();
}

export function installRuntimeProgrammeEditorialSignals(
  editorialSignals: ProgrammeEditorialSignal[],
  anchorMs: number,
): void {
  if (
    !installed ||
    installed.anchorTelevisionDayStartMs !== guideTelevisionDayStart(anchorMs) ||
    editorialSignalsEqual(installed.editorialSignals, editorialSignals)
  ) {
    return;
  }
  installed = { ...installed, editorialSignals };
  notifyEditorialSignalListeners();
}

export function subscribeRuntimeProgrammeEditorialSignals(
  listener: () => void,
): () => void {
  editorialSignalListeners.add(listener);
  return () => editorialSignalListeners.delete(listener);
}

export function runtimeGuideScheduleFor(anchorMs: number): GuideSchedule | null {
  if (!installed) return null;
  return installed.anchorTelevisionDayStartMs === guideTelevisionDayStart(anchorMs)
    ? installed.schedule
    : null;
}

export function runtimeProgrammeEditorialSignalsFor(
  anchorMs: number,
): ProgrammeEditorialSignal[] {
  if (!installed) return [];
  return installed.anchorTelevisionDayStartMs === guideTelevisionDayStart(anchorMs)
    ? installed.editorialSignals
    : [];
}

export function clearRuntimeGuideSchedule(): void {
  const hadEditorialSignals = (installed?.editorialSignals.length ?? 0) > 0;
  installed = null;
  if (hadEditorialSignals) notifyEditorialSignalListeners();
}
