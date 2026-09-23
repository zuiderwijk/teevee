import {
  parseProgrammeClassificationApiResponse,
} from '../../services/api/programmeClassificationContract.ts';
import type { ProgrammeClassificationRepository } from './classificationRepository.ts';

type RpcError = { message: string };
type RpcClient = {
  rpc<T>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<{ data: T | null; error: RpcError | null }>;
};

export class SupabaseProgrammeClassificationRepository
  implements ProgrammeClassificationRepository
{
  constructor(private readonly client: RpcClient) {}

  async getClassificationsForProgrammeIds(programmeIds: readonly string[]) {
    if (programmeIds.length === 0) return [];
    const response = await this.client.rpc<unknown>(
      'teevee_get_programme_classifications',
      { p_programme_ids: [...programmeIds] },
    );
    if (response.error) {
      throw new Error(
        `Supabase programme classification read failed: ${response.error.message}`,
      );
    }
    const parsed = parseProgrammeClassificationApiResponse({
      status: 'ok',
      classifications: response.data,
    });
    if (parsed.status !== 'ok') {
      throw new Error('Programme classification repository returned unavailable');
    }
    return parsed.classifications;
  }
}
