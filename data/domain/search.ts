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

export function normalizeGuideSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('nl-NL')
    .replace(/[’'\`´]/g, '')
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
