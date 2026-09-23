import type { Channel } from '../../data/domain/epg.ts';
import type {
  GuideSearchProgrammeCoverage,
  GuideSearchProgrammeMatch,
} from '../../data/domain/search.ts';

export type GuideSearchWindow = {
  from: string;
  to: string;
};

export type GuideSearchRepositoryRequest = {
  query: string;
  now: string;
  windows: GuideSearchWindow[];
  programmeLimit: number;
  channelLimit: number;
};

export type GuideSearchRepositoryResult = {
  programmeCoverage: GuideSearchProgrammeCoverage;
  channelMatches: Channel[];
  programmeMatches: GuideSearchProgrammeMatch[];
};

/**
 * Provider-independent canonical Search storage boundary.
 *
 * Implementations search only authoritative canonical Teevee storage. They must
 * not expose provider identity, full GuideSchedule payloads or persistence details.
 */
export interface GuideSearchRepository {
  search(request: GuideSearchRepositoryRequest): Promise<GuideSearchRepositoryResult>;
}
