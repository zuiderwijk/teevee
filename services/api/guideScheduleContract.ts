import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';
import type { Channel, GuideSchedule, GuideScheduleQuery, Programme } from '@/data/domain/epg';

import { parseProgrammeEditorialSignals } from './editorialSignalContract.ts';

export type GuideScheduleApiRequest = GuideScheduleQuery;

/**
 * Transport-independent public schedule result. A stored schedule with zero programmes
 * is still `ok`; `unavailable` means the Teevee service has no canonical schedule yet.
 */
export type GuideScheduleApiResponse =
  | {
      status: 'ok';
      schedule: GuideSchedule;
      /**
       * Optional only for transport rollout compatibility. Runtime parsing normalises a
       * missing or rejected editorial payload to an empty array so Guide availability
       * never depends on enrichment.
       */
      editorialSignals?: ProgrammeEditorialSignal[];
    }
  | { status: 'unavailable' };

export interface GuideScheduleApi {
  getSchedule(request: GuideScheduleApiRequest): Promise<GuideScheduleApiResponse>;
}

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Schedule response ${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Schedule response ${field} must be a non-empty string when provided`);
  }
  return value.trim();
}

export function parseGuideChannel(value: unknown): Channel {

  const input = record(value);
  if (!input) throw new Error('Schedule response channel must be an object');
  if (typeof input.sortOrder !== 'number' || !Number.isInteger(input.sortOrder)) {
    throw new Error('Schedule response channel sortOrder must be an integer');
  }
  if (typeof input.isActive !== 'boolean') {
    throw new Error('Schedule response channel isActive must be a boolean');
  }

  const shortName = optionalString(input.shortName, 'channel shortName');
  const logoUrl = optionalString(input.logoUrl, 'channel logoUrl');

  return {
    id: requiredString(input.id, 'channel id'),
    name: requiredString(input.name, 'channel name'),
    displayName: requiredString(input.displayName, 'channel displayName'),
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    ...(shortName ? { shortName } : {}),
    ...(logoUrl ? { logoUrl } : {}),
  };
}

export function parseGuideProgramme(value: unknown): Programme {

  const input = record(value);
  if (!input) throw new Error('Schedule response programme must be an object');

  if (!validTimestamp(input.startAt) || !validTimestamp(input.endAt)) {
    throw new Error('Schedule response programme timestamps must be valid');
  }
  const startAt = new Date(Date.parse(input.startAt)).toISOString();
  const endAt = new Date(Date.parse(input.endAt)).toISOString();
  if (Date.parse(endAt) <= Date.parse(startAt)) {
    throw new Error('Schedule response programme endAt must be after startAt');
  }

  const subtitle = optionalString(input.subtitle, 'programme subtitle');
  const description = optionalString(input.description, 'programme description');
  const genre = optionalString(input.genre, 'programme genre');
  if (input.isLive !== undefined && typeof input.isLive !== 'boolean') {
    throw new Error('Schedule response programme isLive must be a boolean when provided');
  }
  if (input.isRepeat !== undefined && typeof input.isRepeat !== 'boolean') {
    throw new Error('Schedule response programme isRepeat must be a boolean when provided');
  }

  return {
    id: requiredString(input.id, 'programme id'),
    channelId: requiredString(input.channelId, 'programme channelId'),
    startAt,
    endAt,
    title: requiredString(input.title, 'programme title'),
    ...(subtitle ? { subtitle } : {}),
    ...(description ? { description } : {}),
    ...(genre ? { genre } : {}),
    ...(input.isLive !== undefined ? { isLive: input.isLive } : {}),
    ...(input.isRepeat !== undefined ? { isRepeat: input.isRepeat } : {}),
  };
}

export function parseGuideSchedule(value: unknown): GuideSchedule {
  const input = record(value);
  if (!input) throw new Error('Schedule response schedule must be an object');
  if (!validTimestamp(input.generatedAt)) {
    throw new Error('Schedule response generatedAt must be a valid timestamp');
  }
  if (input.timezone !== 'Europe/Amsterdam') {
    throw new Error('Schedule response timezone must be Europe/Amsterdam');
  }
  if (!Array.isArray(input.channels) || !Array.isArray(input.programmes)) {
    throw new Error('Schedule response channels and programmes must be arrays');
  }

  const channels = input.channels.map(parseGuideChannel);
  const programmes = input.programmes.map(parseGuideProgramme);
  const channelIds = new Set<string>();
  for (const channel of channels) {
    if (channelIds.has(channel.id)) throw new Error('Schedule response contains duplicate channel ids');
    channelIds.add(channel.id);
  }

  const programmeIds = new Set<string>();
  for (const programme of programmes) {
    if (programmeIds.has(programme.id)) {
      throw new Error('Schedule response contains duplicate programme ids');
    }
    programmeIds.add(programme.id);
    if (!channelIds.has(programme.channelId)) {
      throw new Error('Schedule response programme references an unknown channel');
    }
  }

  return {
    generatedAt: new Date(Date.parse(input.generatedAt)).toISOString(),
    timezone: 'Europe/Amsterdam',
    channels,
    programmes,
  };
}

export function parseGuideScheduleApiResponse(value: unknown): GuideScheduleApiResponse {
  const input = record(value);
  if (!input) throw new Error('Schedule response must be an object');
  if (input.status === 'unavailable') return { status: 'unavailable' };
  if (input.status !== 'ok') throw new Error('Schedule response status is invalid');

  const schedule = parseGuideSchedule(input.schedule);
  let editorialSignals: ProgrammeEditorialSignal[] = [];
  if (input.editorialSignals !== undefined) {
    try {
      const parsed = parseProgrammeEditorialSignals(input.editorialSignals);
      const programmeIds = new Set(schedule.programmes.map(({ id }) => id));
      if (parsed.some(({ programmeId }) => !programmeIds.has(programmeId))) {
        throw new Error('Editorial signal references a programme outside the schedule payload');
      }
      editorialSignals = parsed;
    } catch {
      // Editorial enrichment is optional. Reject the malformed enrichment at the
      // transport trust boundary while preserving the independently valid schedule.
      editorialSignals = [];
    }
  }

  return { status: 'ok', schedule, editorialSignals };
}

/**
 * Runtime trust-boundary validation for HTTP/Edge Function transports.
 * TypeScript alone cannot make serialized client input safe.
 */
export function parseGuideScheduleApiRequest(value: unknown): GuideScheduleApiRequest {
  const input = record(value);
  if (!input) throw new Error('Schedule request must be an object');

  if (!validTimestamp(input.from)) throw new Error('Schedule request from must be a valid timestamp');
  if (!validTimestamp(input.to)) throw new Error('Schedule request to must be a valid timestamp');

  const fromMs = Date.parse(input.from);
  const toMs = Date.parse(input.to);
  if (toMs <= fromMs) throw new Error('Schedule request to must be after from');

  if (input.channelIds === undefined) {
    return { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() };
  }

  if (!Array.isArray(input.channelIds) || input.channelIds.length === 0) {
    throw new Error('Schedule request channelIds must be a non-empty array when provided');
  }

  const channelIds = [...new Set(input.channelIds.map((channelId) => {
    if (typeof channelId !== 'string' || channelId.trim() === '') {
      throw new Error('Schedule request channelIds must contain non-empty strings');
    }
    return channelId.trim();
  }))];

  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    channelIds,
  };
}
