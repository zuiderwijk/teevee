import type { GuideSchedule, GuideScheduleQuery } from '@/data/domain/epg';

export type GuideScheduleApiRequest = GuideScheduleQuery;

/**
 * Transport-independent public schedule result. A stored schedule with zero programmes
 * is still `ok`; `unavailable` means the Teevee service has no canonical schedule yet.
 */
export type GuideScheduleApiResponse =
  | { status: 'ok'; schedule: GuideSchedule }
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

/**
 * Runtime trust-boundary validation for future HTTP/Edge Function transports.
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
