import {
  parseGuideChannel,
  parseGuideProgramme,
} from '../../services/api/guideScheduleContract.ts';
import type {
  GuideSearchProgrammeCoverage,
  GuideSearchProgrammeMatch,
} from '../../data/domain/search.ts';
import type {
  GuideSearchRepository,
  GuideSearchRepositoryRequest,
  GuideSearchRepositoryResult,
} from './searchRepository.ts';

type RpcError = { message: string };

type RpcResponse<T> = {
  data: T | null;
  error: RpcError | null;
};

export type GuideSearchRpcClient = {
  rpc<T>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<RpcResponse<T>>;
};

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseCoverage(value: unknown): GuideSearchProgrammeCoverage {
  if (value === 'complete' || value === 'partial' || value === 'unavailable') {
    return value;
  }
  throw new Error('Supabase Guide Search returned invalid programme coverage');
}

function parseProgrammeMatch(value: unknown): GuideSearchProgrammeMatch {
  const input = record(value);
  if (!input) throw new Error('Supabase Guide Search programme match must be an object');

  const programme = parseGuideProgramme(input.programme);
  const channel = parseGuideChannel(input.channel);
  if (programme.channelId !== channel.id) {
    throw new Error('Supabase Guide Search programme/channel identity mismatch');
  }
  return { programme, channel };
}

function parseResult(value: unknown): GuideSearchRepositoryResult {
  const input = record(value);
  if (
    !input ||
    !Array.isArray(input.channelMatches) ||
    !Array.isArray(input.programmeMatches)
  ) {
    throw new Error('Supabase Guide Search returned an invalid payload');
  }

  const channelMatches = input.channelMatches.map(parseGuideChannel);
  const programmeMatches = input.programmeMatches.map(parseProgrammeMatch);

  const channelIds = new Set<string>();
  for (const channel of channelMatches) {
    if (channelIds.has(channel.id)) {
      throw new Error('Supabase Guide Search returned duplicate channel matches');
    }
    channelIds.add(channel.id);
  }

  const programmeIds = new Set<string>();
  for (const { programme } of programmeMatches) {
    if (programmeIds.has(programme.id)) {
      throw new Error('Supabase Guide Search returned duplicate programme matches');
    }
    programmeIds.add(programme.id);
  }

  return {
    programmeCoverage: parseCoverage(input.programmeCoverage),
    channelMatches,
    programmeMatches,
  };
}

export class SupabaseGuideSearchRepository implements GuideSearchRepository {
  constructor(private readonly client: GuideSearchRpcClient) {}

  async search(
    request: GuideSearchRepositoryRequest,
  ): Promise<GuideSearchRepositoryResult> {
    const response = await this.client.rpc<unknown>('teevee_search_guide', {
      p_query: request.query,
      p_now: request.now,
      p_windows: request.windows,
      p_programme_limit: request.programmeLimit,
      p_channel_limit: request.channelLimit,
    });

    if (response.error) {
      throw new Error(`Supabase Guide Search failed: ${response.error.message}`);
    }
    return parseResult(response.data);
  }
}
