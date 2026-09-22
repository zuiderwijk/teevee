import type { Programme } from './epg';

export type ProgrammeEditorialSignal = {
  programmeId: Programme['id'];
  type: 'kijktip';
  source: 'tvgids';
  sourceItemId: string;
  sourceUrl?: string;
  publishedAt?: string;
  matchedBy: 'source-id' | 'channel-title-start' | 'channel-exact-start';
};
