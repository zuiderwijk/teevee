import {
  parseGuideSearchApiRequest,
  parseGuideSearchApiResponse,
  type GuideSearchApi,
  type GuideSearchApiRequest,
  type GuideSearchApiResponse,
} from './guideSearchContract.ts';

export const DEFAULT_TEEVEE_GUIDE_SEARCH_URL =
  'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/guide-search';

export type HostedGuideSearchClientOptions = {
  endpoint?: string;
  fetcher?: typeof fetch;
};

export class HostedGuideSearchClient implements GuideSearchApi {
  private readonly endpoint: string;
  private readonly fetcher: typeof fetch;

  constructor(options: HostedGuideSearchClientOptions = {}) {
    const configuredEndpoint = options.endpoint?.trim();
    this.endpoint = configuredEndpoint || DEFAULT_TEEVEE_GUIDE_SEARCH_URL;
    this.fetcher = options.fetcher ?? fetch;
  }

  async search(request: GuideSearchApiRequest): Promise<GuideSearchApiResponse> {
    const parsedRequest = parseGuideSearchApiRequest(request);
    const response = await this.fetcher(this.endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedRequest),
    });

    if (!response.ok) {
      throw new Error(`Teevee Guide Search request failed with HTTP ${response.status}`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error('Teevee Guide Search returned invalid JSON');
    }
    return parseGuideSearchApiResponse(payload);
  }
}
