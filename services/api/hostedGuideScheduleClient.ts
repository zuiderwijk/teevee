import type { Channel, GuideSchedule, GuideScheduleQuery, Programme } from '@/data/domain/epg';
import { guideDayStart } from '@/data/domain/guideTime';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOSTED_DAY_COUNT = 2;

export const GUIDE_SCHEDULE_ENDPOINT =
  'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/guide-schedule';

export type GuideScheduleFetch = typeof fetch;

type HostedScheduleResponse =
  | { status: 'ok'; schedule: GuideSchedule }
  | { status: 'unavailable' };

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function timestamp(value: unknown, label: string): string {
  const input = nonEmptyString(value, label);
  const parsed = Date.parse(input);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp`);
  return new Date(parsed).toISOString();
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  return nonEmptyString(value, label);
}

function optionalBoolean(value: unknown, label: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new Error(`${label} must be boolean when provided`);
  return value;
}

function parseChannel(value: unknown): Channel {
  const input = record(value);
  if (!input) throw new Error('Schedule channel must be an object');
  if (typeof input.sortOrder !== 'number' || !Number.isFinite(input.sortOrder)) {
    throw new Error('Schedule channel sortOrder must be a finite number');
  }
  if (typeof input.isActive !== 'boolean') {
    throw new Error('Schedule channel isActive must be boolean');
  }

  const shortName = optionalString(input.shortName, 'Schedule channel shortName');
  const logoUrl = optionalString(input.logoUrl, 'Schedule channel logoUrl');
  return {
    id: nonEmptyString(input.id, 'Schedule channel id'),
    name: nonEmptyString(input.name, 'Schedule channel name'),
    displayName: nonEmptyString(input.displayName, 'Schedule channel displayName'),
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    ...(shortName ? { shortName } : {}),
    ...(logoUrl ? { logoUrl } : {}),
  };
}

function parseProgramme(value: unknown): Programme {
  const input = record(value);
  if (!input) throw new Error('Schedule programme must be an object');
  const startAt = timestamp(input.startAt, 'Schedule programme startAt');
  const endAt = timestamp(input.endAt, 'Schedule programme endAt');
  if (Date.parse(endAt) <= Date.parse(startAt)) {
    throw new Error('Schedule programme must end after it starts');
  }

  const subtitle = optionalString(input.subtitle, 'Schedule programme subtitle');
  const description = optionalString(input.description, 'Schedule programme description');
  const genre = optionalString(input.genre, 'Schedule programme genre');
  const isLive = optionalBoolean(input.isLive, 'Schedule programme isLive');
  const isRepeat = optionalBoolean(input.isRepeat, 'Schedule programme isRepeat');
  return {
    id: nonEmptyString(input.id, 'Schedule programme id'),
    channelId: nonEmptyString(input.channelId, 'Schedule programme channelId'),
    startAt,
    endAt,
    title: nonEmptyString(input.title, 'Schedule programme title'),
    ...(subtitle ? { subtitle } : {}),
    ...(description ? { description } : {}),
    ...(genre ? { genre } : {}),
    ...(isLive !== undefined ? { isLive } : {}),
    ...(isRepeat !== undefined ? { isRepeat } : {}),
  };
}

export function parseHostedScheduleResponse(value: unknown): HostedScheduleResponse {
  const input = record(value);
  if (!input) throw new Error('Hosted schedule response must be an object');
  if (input.status === 'unavailable') return { status: 'unavailable' };
  if (input.status !== 'ok') throw new Error('Hosted schedule response has invalid status');

  const rawSchedule = record(input.schedule);
  if (!rawSchedule) throw new Error('Hosted schedule response is missing schedule');
  if (rawSchedule.timezone !== 'Europe/Amsterdam') {
    throw new Error('Hosted schedule timezone must be Europe/Amsterdam');
  }
  if (!Array.isArray(rawSchedule.channels) || !Array.isArray(rawSchedule.programmes)) {
    throw new Error('Hosted schedule channels/programmes must be arrays');
  }

  const channels = rawSchedule.channels.map(parseChannel);
  const channelIds = new Set(channels.map(({ id }) => id));
  if (channelIds.size !== channels.length) throw new Error('Hosted schedule has duplicate channels');
  const programmes = rawSchedule.programmes.map(parseProgramme);
  for (const programme of programmes) {
    if (!channelIds.has(programme.channelId)) {
      throw new Error(`Hosted schedule programme references unknown channel ${programme.channelId}`);
    }
  }

  return {
    status: 'ok',
    schedule: {
      generatedAt: timestamp(rawSchedule.generatedAt, 'Hosted schedule generatedAt'),
      timezone: 'Europe/Amsterdam',
      channels,
      programmes,
    },
  };
}

/**
 * Builds exactly two Amsterdam calendar-day scopes and splits any >24h DST day
 * into transport-safe chunks. Normal Dutch days therefore produce two requests;
 * the autumn 25-hour transition produces one extra chunk.
 */
export function hostedScheduleQueries(anchorMs: number): GuideScheduleQuery[] {
  if (!Number.isFinite(anchorMs)) throw new Error('Guide schedule anchor must be finite');
  const queries: GuideScheduleQuery[] = [];

  for (let dayOffset = 0; dayOffset < HOSTED_DAY_COUNT; dayOffset += 1) {
    const dayStartMs = guideDayStart(anchorMs, dayOffset);
    const dayEndMs = guideDayStart(anchorMs, dayOffset + 1);
    let cursor = dayStartMs;
    while (cursor < dayEndMs) {
      const chunkEnd = Math.min(dayEndMs, cursor + DAY_MS);
      queries.push({
        from: new Date(cursor).toISOString(),
        to: new Date(chunkEnd).toISOString(),
      });
      cursor = chunkEnd;
    }
  }

  return queries;
}

export function mergeHostedSchedules(schedules: GuideSchedule[]): GuideSchedule {
  if (schedules.length === 0) throw new Error('At least one hosted schedule is required');
  const channelById = new Map<string, Channel>();
  const programmeById = new Map<string, Programme>();
  let generatedAtMs = Number.POSITIVE_INFINITY;

  for (const schedule of schedules) {
    if (schedule.timezone !== 'Europe/Amsterdam') {
      throw new Error('Hosted schedule timezone mismatch');
    }
    generatedAtMs = Math.min(generatedAtMs, Date.parse(schedule.generatedAt));
    for (const channel of schedule.channels) {
      const existing = channelById.get(channel.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(channel)) {
        throw new Error(`Conflicting hosted channel metadata for ${channel.id}`);
      }
      channelById.set(channel.id, channel);
    }
    for (const programme of schedule.programmes) {
      const existing = programmeById.get(programme.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(programme)) {
        throw new Error(`Conflicting hosted programme data for ${programme.id}`);
      }
      programmeById.set(programme.id, programme);
    }
  }

  if (!Number.isFinite(generatedAtMs)) throw new Error('Hosted schedules have invalid freshness');
  const channels = [...channelById.values()].sort((left, right) => left.sortOrder - right.sortOrder);
  const programmes = [...programmeById.values()].sort((left, right) => {
    const channel = left.channelId.localeCompare(right.channelId);
    if (channel !== 0) return channel;
    const start = Date.parse(left.startAt) - Date.parse(right.startAt);
    return start !== 0 ? start : left.id.localeCompare(right.id);
  });

  return {
    generatedAt: new Date(generatedAtMs).toISOString(),
    timezone: 'Europe/Amsterdam',
    channels,
    programmes,
  };
}

async function fetchHostedChunk(
  query: GuideScheduleQuery,
  fetcher: GuideScheduleFetch,
): Promise<GuideSchedule | null> {
  const response = await fetcher(GUIDE_SCHEDULE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!response.ok) throw new Error(`Hosted schedule request failed with HTTP ${response.status}`);
  const parsed = parseHostedScheduleResponse(await response.json());
  return parsed.status === 'ok' ? parsed.schedule : null;
}

/** Returns null unless the complete two-day horizon is authoritatively available. */
export async function loadHostedGuideSchedule(
  anchorMs: number,
  fetcher: GuideScheduleFetch = fetch,
): Promise<GuideSchedule | null> {
  const chunks = await Promise.all(
    hostedScheduleQueries(anchorMs).map((query) => fetchHostedChunk(query, fetcher)),
  );
  if (chunks.some((schedule) => schedule === null)) return null;
  return mergeHostedSchedules(chunks as GuideSchedule[]);
}
