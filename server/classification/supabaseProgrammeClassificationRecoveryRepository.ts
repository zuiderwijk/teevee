import type {
  ProgrammeClassificationRecoveryRepository,
  ProgrammeClassificationRecoveryWrite,
  ProgrammeClassificationRecoveryWriteResult,
} from './classificationRecoveryRepository.ts';

type RpcError = { message: string };
type RpcClient = {
  rpc<T>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<{ data: T | null; error: RpcError | null }>;
};

function nonNegativeInteger(
  value: unknown,
  field: keyof ProgrammeClassificationRecoveryWriteResult,
): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`Supabase classification recovery returned invalid ${field}`);
  }
  return value as number;
}

function parseRecoveryResult(
  value: unknown,
): ProgrammeClassificationRecoveryWriteResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Supabase classification recovery returned an invalid payload');
  }

  const payload = value as Record<string, unknown>;
  const result: ProgrammeClassificationRecoveryWriteResult = {
    candidateProgrammeCount: nonNegativeInteger(
      payload.candidateProgrammeCount,
      'candidateProgrammeCount',
    ),
    matchedProgrammeCount: nonNegativeInteger(
      payload.matchedProgrammeCount,
      'matchedProgrammeCount',
    ),
    recoveredClassificationCount: nonNegativeInteger(
      payload.recoveredClassificationCount,
      'recoveredClassificationCount',
    ),
    ignoredStaleCount: nonNegativeInteger(
      payload.ignoredStaleCount,
      'ignoredStaleCount',
    ),
    unmatchedProgrammeCount: nonNegativeInteger(
      payload.unmatchedProgrammeCount,
      'unmatchedProgrammeCount',
    ),
  };

  if (
    result.matchedProgrammeCount + result.unmatchedProgrammeCount !==
      result.candidateProgrammeCount ||
    result.recoveredClassificationCount + result.ignoredStaleCount >
      result.matchedProgrammeCount
  ) {
    throw new Error('Supabase classification recovery returned inconsistent counts');
  }

  return result;
}

export class SupabaseProgrammeClassificationRecoveryRepository
  implements ProgrammeClassificationRecoveryRepository
{
  constructor(private readonly client: RpcClient) {}

  async recoverClassifications(
    input: ProgrammeClassificationRecoveryWrite,
  ): Promise<ProgrammeClassificationRecoveryWriteResult> {
    if (input.programmes.length === 0) {
      return {
        candidateProgrammeCount: 0,
        matchedProgrammeCount: 0,
        recoveredClassificationCount: 0,
        ignoredStaleCount: 0,
        unmatchedProgrammeCount: 0,
      };
    }

    const response = await this.client.rpc<unknown>(
      'teevee_recover_programme_classifications',
      {
        p_from: input.from,
        p_to: input.to,
        p_observed_at: input.observedAt,
        p_channel_ids: input.channelIds,
        p_programmes: input.programmes,
        p_classifications: input.classifications,
      },
    );

    if (response.error) {
      throw new Error(
        `Supabase classification recovery failed: ${response.error.message}`,
      );
    }
    return parseRecoveryResult(response.data);
  }
}
