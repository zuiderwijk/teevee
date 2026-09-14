import type { Channel, GuideSchedule, Programme } from '@/data/domain/epg';
import { guideDayStart } from '@/data/domain/guideTime';

import type { GuideScheduleApi } from './guideScheduleContract';

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

/**
 * Load the two Amsterdam calendar days used by the current Guide UI.
 * `null` means the hosted canonical source is unavailable/incomplete and the caller
 * should retain its deterministic fixture fallback.
 */
export async function loadTwoDayGuideSchedule(
  api: GuideScheduleApi,
  anchorMs = Date.now(),
): Promise<GuideSchedule | null> {
  const dayStarts = [0, 1, 2].map((offset) => guideDayStart(anchorMs, offset));
  const requests = [0, 1].map((index) =>
    api.getSchedule({
      from: new Date(dayStarts[index]!).toISOString(),
      to: new Date(dayStarts[index + 1]!).toISOString(),
    }),
  );
  const responses = await Promise.all(requests);
  if (responses.some((response) => response.status === 'unavailable')) return null;

  const schedules = responses.map((response) => {
    if (response.status !== 'ok') throw new Error('Unexpected schedule response');
    return response.schedule;
  });
  return mergeGuideSchedules(schedules);
}
