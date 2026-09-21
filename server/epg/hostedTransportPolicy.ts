import type { GuideScheduleApiRequest } from '../../services/api/guideScheduleContract.ts';
import { parseGuideScheduleApiRequest } from '../../services/api/guideScheduleContract.ts';

export const HOSTED_SCHEDULE_MAX_WINDOW_MS = 25 * 60 * 60 * 1000;
export const HOSTED_REQUEST_MAX_BODY_BYTES = 8 * 1024;

export type HostedWindowRefreshRequest = {
  mode: 'window';
  from: string;
  to: string;
  providerChannelIds: string[];
};

export type HostedGuideHorizonRefreshRequest = {
  mode: 'guide-horizon';
  providerChannelIds: string[];
};

export type HostedRefreshRequest =
  | HostedWindowRefreshRequest
  | HostedGuideHorizonRefreshRequest;

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function allowedIds(ids: readonly string[], label: string): string[] {
  const normalized = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (normalized.length === 0) throw new Error(`${label} must contain at least one channel`);
  return normalized;
}

function assertHostedWindow(from: string, to: string): void {
  const duration = Date.parse(to) - Date.parse(from);
  if (duration > HOSTED_SCHEDULE_MAX_WINDOW_MS) {
    throw new Error('Hosted schedule requests are limited to 25 hours');
  }
}

function requestedIds(
  value: unknown,
  allowed: readonly string[],
  field: string,
): string[] {
  const available = allowedIds(allowed, `Allowed ${field}`);
  if (value === undefined) return available;
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} must be a non-empty array when provided`);
  }

  const requested = [
    ...new Set(
      value.map((channelId) => {
        if (typeof channelId !== 'string' || channelId.trim() === '') {
          throw new Error(`${field} must contain non-empty strings`);
        }
        return channelId.trim();
      }),
    ),
  ];
  const allowedSet = new Set(available);
  const unknown = requested.find((channelId) => !allowedSet.has(channelId));
  if (unknown) throw new Error(`Unsupported ${field} value: ${unknown}`);
  return requested;
}

/** Public transport policy layered on top of the provider-independent API contract. */
export function parseHostedGuideScheduleRequest(
  value: unknown,
  allowedCanonicalChannelIds: readonly string[],
): GuideScheduleApiRequest {
  const request = parseGuideScheduleApiRequest(value);
  assertHostedWindow(request.from, request.to);

  return {
    from: request.from,
    to: request.to,
    channelIds: requestedIds(request.channelIds, allowedCanonicalChannelIds, 'channelIds'),
  };
}

/**
 * Protected ingestion policy.
 *
 * Legacy explicit-window refresh remains available for diagnostics/manual repair. Cron uses
 * guide-horizon mode so the server derives the canonical 06:00 Amsterdam windows itself.
 * Provider IDs remain server-side and tightly allow-listed in both modes.
 */
export function parseHostedRefreshRequest(
  value: unknown,
  allowedProviderChannelIds: readonly string[],
): HostedRefreshRequest {
  const input = record(value);
  if (!input) throw new Error('Refresh request must be an object');

  const providerChannelIds = requestedIds(
    input.providerChannelIds,
    allowedProviderChannelIds,
    'providerChannelIds',
  );

  if (input.mode === 'guide-horizon') {
    if (input.from !== undefined || input.to !== undefined) {
      throw new Error('Guide-horizon refresh derives its own television-day windows');
    }
    return { mode: 'guide-horizon', providerChannelIds };
  }

  if (input.mode !== undefined && input.mode !== 'window') {
    throw new Error('Refresh request mode is invalid');
  }

  const from = input.from;
  const to = input.to;
  if (typeof from !== 'string' || !Number.isFinite(Date.parse(from))) {
    throw new Error('Refresh request from must be a valid timestamp');
  }
  if (typeof to !== 'string' || !Number.isFinite(Date.parse(to))) {
    throw new Error('Refresh request to must be a valid timestamp');
  }

  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  if (toMs <= fromMs) throw new Error('Refresh request to must be after from');
  const normalizedFrom = new Date(fromMs).toISOString();
  const normalizedTo = new Date(toMs).toISOString();
  assertHostedWindow(normalizedFrom, normalizedTo);

  return {
    mode: 'window',
    from: normalizedFrom,
    to: normalizedTo,
    providerChannelIds,
  };
}
