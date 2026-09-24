import type { Channel, Programme } from './epg';

export type GuideSearchMatchKind = 'exact' | 'prefix' | 'substring';

export type GuideSearchProgrammeCoverage =
  | 'complete'
  | 'partial'
  | 'unavailable';

export type GuideSearchProgrammeMatch = {
  programme: Programme;
  channel: Channel;
};

export type GuideSearchNavigationIntent =
  | {
      type: 'programme-detail';
      match: GuideSearchProgrammeMatch;
    }
  | {
      type: 'per-channel';
      channelId: Channel['id'];
      referenceAt: string;
    };

export function guideSearchProgrammeDetailIntent(
  match: GuideSearchProgrammeMatch,
): Extract<GuideSearchNavigationIntent, { type: 'programme-detail' }> {
  return { type: 'programme-detail', match };
}

export function guideSearchPerChannelIntent(
  channel: Channel,
  referenceMs: number,
): Extract<GuideSearchNavigationIntent, { type: 'per-channel' }> {
  if (!Number.isFinite(referenceMs)) {
    throw new RangeError('Guide Search channel navigation requires a valid reference instant');
  }
  return {
    type: 'per-channel',
    channelId: channel.id,
    referenceAt: new Date(referenceMs).toISOString(),
  };
}

export function normalizeGuideSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('nl-NL')
    .replace(/[’'\u0060´]/g, '')
    .replace(/&/g, ' en ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function guideSearchMatchKind(
  candidate: string,
  normalizedQuery: string,
): GuideSearchMatchKind | null {
  const normalizedCandidate = normalizeGuideSearchText(candidate);
  if (!normalizedCandidate || !normalizedQuery) return null;
  if (normalizedCandidate === normalizedQuery) return 'exact';
  if (normalizedCandidate.startsWith(normalizedQuery)) return 'prefix';
  if (normalizedCandidate.includes(normalizedQuery)) return 'substring';
  return null;
}

export function guideSearchMatchRank(kind: GuideSearchMatchKind): number {
  switch (kind) {
    case 'exact':
      return 0;
    case 'prefix':
      return 1;
    case 'substring':
      return 2;
  }
}


const GUIDE_SEARCH_CHANNEL_ALIASES = new Map<string, string>([
  ['rtl8', 'RTL 8'],
  ['rtl7', 'RTL 7'],
  ['rtlz', 'RTL Z'],
  ['npo1', 'NPO 1'],
  ['espn1', 'ESPN'],
  ['vrt1', 'VRT 1'],
  ['bbcnl', 'BBC NL'],
]);

const GUIDE_SEARCH_CHANNEL_MANAGEMENT_INTENTS = new Set([
  'zenders',
  'alle zenders',
  'zenderoverzicht',
  'mijn zenders',
  'zenders instellen',
  'zenders toevoegen',
  'zendervolgorde',
]);

export function canonicalGuideSearchQuery(value: string): string {
  const trimmed = value.trim();
  const normalized = normalizeGuideSearchText(trimmed);
  return GUIDE_SEARCH_CHANNEL_ALIASES.get(normalized) ?? trimmed;
}

export function guideSearchChannelManagementIntent(
  value: string,
): 'manage-channels' | null {
  return GUIDE_SEARCH_CHANNEL_MANAGEMENT_INTENTS.has(
    normalizeGuideSearchText(value),
  )
    ? 'manage-channels'
    : null;
}
