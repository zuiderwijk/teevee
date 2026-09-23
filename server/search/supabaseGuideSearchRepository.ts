import {
  parseGuideSearchApiResponse,
} from '../../services/api/guideSearchContract.ts';
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

    const parsed = parseGuideSearchApiResponse(response.data);
    if (parsed.status !== 'ok') {
      throw new Error('Supabase Guide Search returned unavailable unexpectedly');
    }

    return {
      programmeCoverage: parsed.programmeCoverage,
      channelMatches: parsed.channelMatches,
      programmeMatches: parsed.programmeMatches,
    };
  }
}
