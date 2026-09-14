import type {
  GuideScheduleApi,
  GuideScheduleApiRequest,
  GuideScheduleApiResponse,
} from './guideScheduleContract';
import { parseGuideScheduleApiResponse } from './guideScheduleContract';

export const DEFAULT_TEEVEE_GUIDE_SCHEDULE_URL =
  'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/guide-schedule';

export type HostedGuideScheduleClientOptions = {
  endpoint?: string;
  fetcher?: typeof fetch;
};

export class HostedGuideScheduleClient implements GuideScheduleApi {
  private readonly endpoint: string;
  private readonly fetcher: typeof fetch;

  constructor(options: HostedGuideScheduleClientOptions = {}) {
    const configuredEndpoint = options.endpoint?.trim();
    this.endpoint = configuredEndpoint || DEFAULT_TEEVEE_GUIDE_SCHEDULE_URL;
    this.fetcher = options.fetcher ?? fetch;
  }

  async getSchedule(request: GuideScheduleApiRequest): Promise<GuideScheduleApiResponse> {
    const response = await this.fetcher(this.endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Teevee guide schedule request failed with HTTP ${response.status}`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error('Teevee guide schedule returned invalid JSON');
    }
    return parseGuideScheduleApiResponse(payload);
  }
}
