import type { ProgrammeEditorialSignal } from '../../data/domain/editorial.ts';
import type { Channel, Programme } from '../../data/domain/epg.ts';
import type {
  GuideSearchProgrammeCoverage,
  GuideSearchProgrammeMatch,
} from '../../data/domain/search.ts';
import { normalizeGuideSearchText } from '../../data/domain/search.ts';
import { parseProgrammeEditorialSignals } from './editorialSignalContract.ts';
import {
  parseGuideChannel,
  parseGuideProgramme,
} from './guideScheduleContract.ts';

export const GUIDE_SEARCH_MIN_QUERY_LENGTH = 2;
export const GUIDE_SEARCH_MAX_QUERY_LENGTH = 80;
export const GUIDE_SEARCH_PROGRAMME_LIMIT = 24;

export type GuideSearchApiRequest = {
  query: string;
};

export type GuideSearchApiResponse =
  | {
      status: 'ok';
      programmeCoverage: GuideSearchProgrammeCoverage;
      channelMatches: Channel[];
      programmeMatches: GuideSearchProgrammeMatch[];
      editorialSignals: ProgrammeEditorialSignal[];
    }
  | {
      status: 'unavailable';
    };

export interface GuideSearchApi {
  search(request: GuideSearchApiRequest): Promise<GuideSearchApiResponse>;
}

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseGuideSearchApiRequest(value: unknown): GuideSearchApiRequest {
  const input = record(value);
  if (!input || typeof input.query !== 'string') {
    throw new Error('Search request query must be a string');
  }

  const query = input.query.trim();
  const normalized = normalizeGuideSearchText(query);
  if (normalized.length < GUIDE_SEARCH_MIN_QUERY_LENGTH) {
    throw new Error(
      `Search request query must contain at least ${GUIDE_SEARCH_MIN_QUERY_LENGTH} searchable characters`,
    );
  }
  if (normalized.length > GUIDE_SEARCH_MAX_QUERY_LENGTH) {
    throw new Error(
      `Search request query must contain at most ${GUIDE_SEARCH_MAX_QUERY_LENGTH} searchable characters`,
    );
  }

  return { query };
}

function parseCoverage(value: unknown): GuideSearchProgrammeCoverage {
  if (value === 'complete' || value === 'partial' || value === 'unavailable') {
    return value;
  }
  throw new Error('Search response programmeCoverage is invalid');
}

function parseProgrammeMatch(value: unknown): GuideSearchProgrammeMatch {
  const input = record(value);
  if (!input) throw new Error('Search response programme match must be an object');

  const programme = parseGuideProgramme(input.programme);
  const channel = parseGuideChannel(input.channel);
  if (programme.channelId !== channel.id) {
    throw new Error('Search response programme match channel does not match programme');
  }
  return { programme, channel };
}

export function parseGuideSearchApiResponse(value: unknown): GuideSearchApiResponse {
  const input = record(value);
  if (!input) throw new Error('Search response must be an object');
  if (input.status === 'unavailable') return { status: 'unavailable' };
  if (input.status !== 'ok') throw new Error('Search response status is invalid');
  if (!Array.isArray(input.channelMatches) || !Array.isArray(input.programmeMatches)) {
    throw new Error('Search response matches must be arrays');
  }

  const channelMatches = input.channelMatches.map(parseGuideChannel);
  const channelIds = new Set<string>();
  for (const channel of channelMatches) {
    if (channelIds.has(channel.id)) {
      throw new Error('Search response contains duplicate channel matches');
    }
    channelIds.add(channel.id);
  }

  const programmeMatches = input.programmeMatches.map(parseProgrammeMatch);
  const programmeIds = new Set<string>();
  for (const { programme } of programmeMatches) {
    if (programmeIds.has(programme.id)) {
      throw new Error('Search response contains duplicate programme matches');
    }
    programmeIds.add(programme.id);
  }

  let editorialSignals: ProgrammeEditorialSignal[] = [];
  if (input.editorialSignals !== undefined) {
    try {
      const parsed = parseProgrammeEditorialSignals(input.editorialSignals);
      if (parsed.some(({ programmeId }) => !programmeIds.has(programmeId))) {
        throw new Error('Search editorial signal references a programme outside results');
      }
      editorialSignals = parsed;
    } catch {
      editorialSignals = [];
    }
  }

  return {
    status: 'ok',
    programmeCoverage: parseCoverage(input.programmeCoverage),
    channelMatches,
    programmeMatches,
    editorialSignals,
  };
}

export type {
  GuideSearchProgrammeCoverage,
  GuideSearchProgrammeMatch,
  Channel,
  Programme,
};
