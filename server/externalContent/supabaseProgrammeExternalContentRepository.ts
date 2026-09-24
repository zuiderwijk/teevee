import type {
  ExternalContentDecisionWriteResult,
  ProgrammeExternalContentRepository,
} from './externalContentRepository.ts';
import type { ProgrammeExternalContentDecision } from './types.ts';

type RpcError = { message: string };
type RpcClient = {
  rpc<T>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<{ data: T | null; error: RpcError | null }>;
};

function nonNegativeInteger(
  value: unknown,
  field: keyof ExternalContentDecisionWriteResult,
): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`Supabase external-content write returned invalid ${field}`);
  }
  return value as number;
}

function parseResult(value: unknown): ExternalContentDecisionWriteResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Supabase external-content write returned an invalid payload');
  }
  const payload = value as Record<string, unknown>;
  const result = {
    decisionCount: nonNegativeInteger(payload.decisionCount, 'decisionCount'),
    resolvedReferenceCount: nonNegativeInteger(
      payload.resolvedReferenceCount,
      'resolvedReferenceCount',
    ),
    clearedReferenceCount: nonNegativeInteger(
      payload.clearedReferenceCount,
      'clearedReferenceCount',
    ),
    ignoredStaleCount: nonNegativeInteger(
      payload.ignoredStaleCount,
      'ignoredStaleCount',
    ),
  };
  if (result.ignoredStaleCount > result.decisionCount) {
    throw new Error('Supabase external-content write returned inconsistent counts');
  }
  return result;
}

function persistenceDecision(decision: ProgrammeExternalContentDecision) {
  const common = {
    programmeId: decision.programmeId,
    channelId: decision.channelId,
    startAt: decision.startAt,
    endAt: decision.endAt,
    title: decision.title,
    status: decision.decision.status,
  };

  return decision.decision.status === 'resolved'
    ? {
        ...common,
        source: decision.decision.source,
        mediaType: decision.decision.mediaType,
        externalContentId: decision.decision.externalContentId,
        confidence: decision.decision.confidence,
        matcherVersion: decision.decision.matcherVersion,
      }
    : common;
}

export class SupabaseProgrammeExternalContentRepository
  implements ProgrammeExternalContentRepository
{
  constructor(private readonly client: RpcClient) {}

  async applyDecisions(input: {
    observedAt: string;
    resolvedAt: string;
    decisions: readonly ProgrammeExternalContentDecision[];
  }): Promise<ExternalContentDecisionWriteResult> {
    if (input.decisions.length === 0) {
      return {
        decisionCount: 0,
        resolvedReferenceCount: 0,
        clearedReferenceCount: 0,
        ignoredStaleCount: 0,
      };
    }
    if (input.decisions.length > 256) {
      throw new Error('External-content decision write is bounded to 256 programmes');
    }

    const response = await this.client.rpc<unknown>(
      'teevee_apply_programme_external_content_decisions',
      {
        p_observed_at: input.observedAt,
        p_resolved_at: input.resolvedAt,
        p_decisions: input.decisions.map(persistenceDecision),
      },
    );
    if (response.error) {
      throw new Error(`Supabase external-content write failed: ${response.error.message}`);
    }
    return parseResult(response.data);
  }
}
