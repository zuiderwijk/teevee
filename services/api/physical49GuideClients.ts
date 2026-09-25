import {
  CANONICAL_CHANNEL_CATALOG,
  canonicalActiveChannels,
} from '@/data/domain/channelCatalog';
import type { Channel, Programme } from '@/data/domain/epg';
import {
  guideSearchMatchKind,
  guideSearchMatchRank,
  normalizeGuideSearchText,
} from '@/data/domain/search';

import {
  parseGuideScheduleApiRequest,
  parseGuideScheduleApiResponse,
  type GuideScheduleApi,
  type GuideScheduleApiRequest,
  type GuideScheduleApiResponse,
} from './guideScheduleContract';
import {
  GUIDE_SEARCH_CHANNEL_LIMIT,
  parseGuideSearchApiRequest,
  parseGuideSearchApiResponse,
  type GuideSearchApi,
  type GuideSearchApiOptions,
  type GuideSearchApiRequest,
  type GuideSearchApiResponse,
} from './guideSearchContract';

const HOUR_MS = 60 * 60 * 1000;
const PHYSICAL_FIXTURE_SOURCE = 'teevee-physical-49';

function channelFixtureProgrammes(
  channel: Channel,
  fromMs: number,
  toMs: number,
): Programme[] {
  const programmes: Programme[] = [];
  let cursor = fromMs;
  let sequence = 0;

  while (cursor < toMs) {
    const end = Math.min(cursor + HOUR_MS, toMs);
    programmes.push({
      id: `${PHYSICAL_FIXTURE_SOURCE}:${channel.id}:${cursor}`,
      channelId: channel.id,
      startAt: new Date(cursor).toISOString(),
      endAt: new Date(end).toISOString(),
      title: `${channel.displayName} · fysiek testprogramma ${sequence + 1}`,
      description:
        'Deterministische non-production acceptance data voor de canonical Teevee client-contracten.',
      genre: sequence % 4 === 0 ? 'Nieuws' : sequence % 4 === 1 ? 'Serie' : 'Algemeen',
      ...(sequence % 6 === 0 ? { isLive: true } : {}),
    });
    cursor = end;
    sequence += 1;
  }

  return programmes;
}

function selectedChannels(channelIds?: readonly string[]): Channel[] {
  const channels = canonicalActiveChannels(CANONICAL_CHANNEL_CATALOG);
  if (!channelIds) return channels;
  const selected = new Set(channelIds);
  return channels.filter(({ id }) => selected.has(id));
}

export function buildPhysical49Schedule(
  request: GuideScheduleApiRequest,
): Extract<GuideScheduleApiResponse, { status: 'ok' }> {
  const parsed = parseGuideScheduleApiRequest(request);
  const fromMs = Date.parse(parsed.from);
  const toMs = Date.parse(parsed.to);
  const channels = selectedChannels(parsed.channelIds);

  return parseGuideScheduleApiResponse({
    status: 'ok',
    schedule: {
      generatedAt: new Date(fromMs).toISOString(),
      timezone: 'Europe/Amsterdam',
      channels,
      programmes: channels.flatMap((channel) =>
        channelFixtureProgrammes(channel, fromMs, toMs),
      ),
    },
    editorialSignals: [],
  }) as Extract<GuideScheduleApiResponse, { status: 'ok' }>;
}

export class Physical49GuideScheduleClient implements GuideScheduleApi {
  async getSchedule(
    request: GuideScheduleApiRequest,
  ): Promise<GuideScheduleApiResponse> {
    return buildPhysical49Schedule(request);
  }
}

function channelSearchRank(channel: Channel, normalizedQuery: string): number | null {
  const candidates = [
    channel.displayName,
    channel.name,
    channel.shortName ?? '',
  ];
  let best: number | null = null;

  for (const candidate of candidates) {
    const kind = guideSearchMatchKind(candidate, normalizedQuery);
    if (!kind) continue;
    const rank = guideSearchMatchRank(kind);
    best = best === null ? rank : Math.min(best, rank);
  }
  return best;
}

export function buildPhysical49SearchResponse(
  request: GuideSearchApiRequest,
): Extract<GuideSearchApiResponse, { status: 'ok' }> {
  const parsed = parseGuideSearchApiRequest(request);
  const normalizedQuery = normalizeGuideSearchText(parsed.query);

  const channelMatches = canonicalActiveChannels(CANONICAL_CHANNEL_CATALOG)
    .map((channel) => ({
      channel,
      rank: channelSearchRank(channel, normalizedQuery),
    }))
    .filter(
      (candidate): candidate is { channel: Channel; rank: number } =>
        candidate.rank !== null,
    )
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        left.channel.sortOrder - right.channel.sortOrder ||
        left.channel.id.localeCompare(right.channel.id),
    )
    .slice(0, GUIDE_SEARCH_CHANNEL_LIMIT)
    .map(({ channel }) => channel);

  return parseGuideSearchApiResponse({
    status: 'ok',
    programmeCoverage: 'complete',
    channelMatches,
    programmeMatches: [],
    editorialSignals: [],
  }) as Extract<GuideSearchApiResponse, { status: 'ok' }>;
}

export class Physical49GuideSearchClient implements GuideSearchApi {
  async search(
    request: GuideSearchApiRequest,
    options: GuideSearchApiOptions = {},
  ): Promise<GuideSearchApiResponse> {
    if (options.signal?.aborted) {
      const error = new Error('Physical Guide Search request aborted');
      error.name = 'AbortError';
      throw error;
    }
    return buildPhysical49SearchResponse(request);
  }
}
