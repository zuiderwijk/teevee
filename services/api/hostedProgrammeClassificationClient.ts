import {
  parseProgrammeClassificationApiRequest,
  parseProgrammeClassificationApiResponse,
  type ProgrammeClassificationApi,
  type ProgrammeClassificationApiRequest,
  type ProgrammeClassificationApiResponse,
} from './programmeClassificationContract.ts';

export const DEFAULT_TEEVEE_PROGRAMME_CLASSIFICATION_URL =
  'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/programme-classifications';

export class HostedProgrammeClassificationClient
  implements ProgrammeClassificationApi
{
  constructor(
    private readonly endpoint = DEFAULT_TEEVEE_PROGRAMME_CLASSIFICATION_URL,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async getClassifications(
    input: ProgrammeClassificationApiRequest,
  ): Promise<ProgrammeClassificationApiResponse> {
    const request = parseProgrammeClassificationApiRequest(input);
    const response = await this.fetcher(this.endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(
        `Teevee programme classification request returned invalid JSON (HTTP ${response.status})`,
      );
    }

    if (!response.ok) {
      if (response.status === 503) {
        const unavailable = parseProgrammeClassificationApiResponse(payload);
        if (unavailable.status === 'unavailable') return unavailable;
      }
      throw new Error(
        `Teevee programme classification request failed with HTTP ${response.status}`,
      );
    }
    return parseProgrammeClassificationApiResponse(payload);
  }
}
