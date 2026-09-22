import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';
import type { Channel, GuideSchedule, Programme } from '@/data/domain/epg';
import { guideTelevisionDayStart } from '@/data/domain/guideTime';

import type { GuideScheduleApi } from './guideScheduleContract';
import { programmeEditorialSignalIdentity } from './editorialSignalContract';

export type GuideScheduleBundle = {
  schedule: GuideSchedule;
  editorialSignals: ProgrammeEditorialSignal[];
};

function sameChannel(left: Channel, right: Channel): boolean {
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

function sameProgramme(left: Programme, right: Programme): boolean {
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

export function mergeGuideSchedules(schedules: readonly GuideSchedule[]): GuideSchedule {
  if (schedules.length === 0) throw new Error('At least one schedule is required');

  const channelsById = new Map<string, Channel>();
  const programmesById = new Map<string, Programme>();
  let generatedAtMs = Number.POSITIVE_INFINITY;

  for (const schedule of schedules) {
    if (schedule.timezone !== 'Europe/Amsterdam') {
      throw new Error('Guide schedules must use Europe/Amsterdam');
    }
    const currentGeneratedAtMs = Date.parse(schedule.generatedAt);
    if (!Number.isFinite(currentGeneratedAtMs)) {
      throw new Error('Guide schedule generatedAt must be valid');
    }
    generatedAtMs = Math.min(generatedAtMs, currentGeneratedAtMs);

    for (const channel of schedule.channels) {
      const existing = channelsById.get(channel.id);
      if (existing && !sameChannel(existing, channel)) {
        throw new Error(`Conflicting canonical channel metadata for ${channel.id}`);
      }
      channelsById.set(channel.id, existing ?? channel);
    }

    for (const programme of schedule.programmes) {
      const existing = programmesById.get(programme.id);
      if (existing && !sameProgramme(existing, programme)) {
        throw new Error(`Conflicting canonical programme data for ${programme.id}`);
      }
      programmesById.set(programme.id, existing ?? programme);
    }
  }

  const channels = [...channelsById.values()].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id),
  );
  const channelOrder = new Map(channels.map((channel, index) => [channel.id, index]));
  const programmes = [...programmesById.values()].sort((left, right) => {
    const channelDifference =
      (channelOrder.get(left.channelId) ?? Number.MAX_SAFE_INTEGER) -
      (channelOrder.get(right.channelId) ?? Number.MAX_SAFE_INTEGER);
    if (channelDifference !== 0) return channelDifference;
    const startDifference = Date.parse(left.startAt) - Date.parse(right.startAt);
    return startDifference || left.id.localeCompare(right.id);
  });

  return {
    generatedAt: new Date(generatedAtMs).toISOString(),
    timezone: 'Europe/Amsterdam',
    channels,
    programmes,
  };
}


function stableEditorialSignalKey(signal: ProgrammeEditorialSignal): string {
  return [
    signal.programmeId,
    signal.type,
    signal.source,
    signal.sourceItemId,
    signal.sourceUrl ?? '',
    signal.publishedAt ?? '',
    signal.matchedBy,
  ].join('\u0000');
}

export function mergeGuideScheduleBundles(
  bundles: readonly GuideScheduleBundle[],
): GuideScheduleBundle {
  if (bundles.length === 0) throw new Error('At least one schedule bundle is required');

  const schedule = mergeGuideSchedules(bundles.map((bundle) => bundle.schedule));
  const programmeIds = new Set(schedule.programmes.map(({ id }) => id));
  const signalsByIdentity = new Map<string, ProgrammeEditorialSignal>();

  for (const bundle of bundles) {
    for (const signal of bundle.editorialSignals) {
      if (!programmeIds.has(signal.programmeId)) continue;
      const identity = programmeEditorialSignalIdentity(signal);
      const existing = signalsByIdentity.get(identity);
      if (!existing || stableEditorialSignalKey(signal) < stableEditorialSignalKey(existing)) {
        signalsByIdentity.set(identity, signal);
      }
    }
  }

  const editorialSignals = [...signalsByIdentity.values()].sort(
    (left, right) =>
      left.programmeId.localeCompare(right.programmeId) ||
      left.type.localeCompare(right.type) ||
      left.source.localeCompare(right.source) ||
      left.sourceItemId.localeCompare(right.sourceItemId),
  );

  return { schedule, editorialSignals };
}

export async function loadTelevisionDayGuideScheduleBundle(
  api: GuideScheduleApi,
  televisionDayAnchorMs: number,
): Promise<GuideScheduleBundle | null> {
  const fromMs = guideTelevisionDayStart(televisionDayAnchorMs);
  const toMs = guideTelevisionDayStart(fromMs, 1);
  const response = await api.getSchedule({
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
  });

  return response.status === 'ok'
    ? {
        schedule: response.schedule,
        editorialSignals: response.editorialSignals ?? [],
      }
    : null;
}

export async function loadTwoTelevisionDayGuideScheduleBundle(
  api: GuideScheduleApi,
  anchorMs = Date.now(),
): Promise<GuideScheduleBundle | null> {
  const dayStarts = [0, 1].map((offset) => guideTelevisionDayStart(anchorMs, offset));
  const bundles = await Promise.all(
    dayStarts.map((dayStartMs) => loadTelevisionDayGuideScheduleBundle(api, dayStartMs)),
  );
  if (bundles.some((bundle) => bundle === null)) return null;
  return mergeGuideScheduleBundles(bundles as GuideScheduleBundle[]);
}

/**
 * Load exactly one Teevee television day through one bounded public read. The caller
 * supplies a television-day anchor, which is normalized through the shared 06:00
 * Europe/Amsterdam primitive so DST windows remain 23/24/25 real hours as required.
 */
export async function loadTelevisionDayGuideSchedule(
  api: GuideScheduleApi,
  televisionDayAnchorMs: number,
): Promise<GuideSchedule | null> {
  const bundle = await loadTelevisionDayGuideScheduleBundle(
    api,
    televisionDayAnchorMs,
  );
  return bundle?.schedule ?? null;
}

/**
 * Load the current and following Teevee television days as two independently bounded
 * hosted reads. A television day is 06:00 Europe/Amsterdam -> 06:00 the next local day,
 * so each request remains 23, 24 or 25 real hours across DST rather than assuming 24h.
 *
 * `null` means at least one required hosted window is unavailable/incomplete. The caller
 * must retain the already usable runtime schedule or deterministic fixture instead of
 * partially replacing it with a narrower result. This deliberately avoids duplicating
 * repository-style partial-window replacement/cache semantics in the mobile client.
 */
export async function loadTwoTelevisionDayGuideSchedule(
  api: GuideScheduleApi,
  anchorMs = Date.now(),
): Promise<GuideSchedule | null> {
  const bundle = await loadTwoTelevisionDayGuideScheduleBundle(api, anchorMs);
  return bundle?.schedule ?? null;
}
