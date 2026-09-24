import type { ExternalContentEnrichmentResult } from './enrichment.ts';

export type ExternalContentExecutionResult =
  | ({ status: 'completed' } & ExternalContentEnrichmentResult)
  | {
      status: 'unavailable';
      reason: 'tmdb-secret-unavailable' | 'external-content-enrichment-failed';
    }
  | {
      status: 'skipped';
      reason: 'no-authoritative-current-candidates';
    };

export type DurableExternalContentOutcome =
  | {
      result: 'succeeded';
      reason: 'completed-without-operational-failures';
    }
  | {
      result: 'retryable-failure';
      reason:
        | 'tmdb-secret-unavailable'
        | 'external-content-enrichment-failed'
        | 'provider-failures'
        | 'persistence-failures'
        | 'provider-and-persistence-failures'
        | 'unexpected-no-authoritative-candidates';
    };

/**
 * Deferred external-content lifecycle success means the owner-level enrichment pass
 * finished without infrastructure/provider/persistence failures.
 *
 * Semantic unresolved/ambiguous matcher decisions are successful work: they are valid
 * high-precision outcomes and must not trigger retry. Operational failures are retried
 * from the same staged provider observation. Guide authority is deliberately outside
 * this classifier and therefore cannot be rolled back by external-content failure.
 */
export function classifyDurableExternalContentOutcome(
  outcome: ExternalContentExecutionResult,
): DurableExternalContentOutcome {
  if (outcome.status === 'unavailable') {
    return { result: 'retryable-failure', reason: outcome.reason };
  }

  if (outcome.status === 'skipped') {
    return {
      result: 'retryable-failure',
      reason: 'unexpected-no-authoritative-candidates',
    };
  }

  const providerFailed = outcome.providerFailureCount > 0;
  const persistenceFailed = outcome.persistenceFailureCount > 0;

  if (providerFailed && persistenceFailed) {
    return {
      result: 'retryable-failure',
      reason: 'provider-and-persistence-failures',
    };
  }
  if (providerFailed) {
    return { result: 'retryable-failure', reason: 'provider-failures' };
  }
  if (persistenceFailed) {
    return { result: 'retryable-failure', reason: 'persistence-failures' };
  }

  return {
    result: 'succeeded',
    reason: 'completed-without-operational-failures',
  };
}
