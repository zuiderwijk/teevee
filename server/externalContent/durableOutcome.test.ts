import { describe, expect, it } from 'vitest';

import {
  classifyDurableExternalContentOutcome,
  type ExternalContentExecutionResult,
} from './durableOutcome.ts';

function completed(
  overrides: Partial<Extract<ExternalContentExecutionResult, { status: 'completed' }>> = {},
): Extract<ExternalContentExecutionResult, { status: 'completed' }> {
  return {
    status: 'completed',
    eligibleProgrammeCount: 2,
    uniqueIdentityWorkCount: 2,
    resolvedCount: 1,
    unresolvedCount: 1,
    ambiguousCount: 0,
    providerFailureCount: 0,
    persistedReferenceCount: 1,
    clearedReferenceCount: 0,
    ignoredStaleCount: 0,
    persistenceFailureCount: 0,
    ...overrides,
  };
}

describe('classifyDurableExternalContentOutcome', () => {
  it('treats owner-level unavailability as retryable durable failure', () => {
    expect(classifyDurableExternalContentOutcome({
      status: 'unavailable',
      reason: 'tmdb-secret-unavailable',
    })).toEqual({
      result: 'retryable-failure',
      reason: 'tmdb-secret-unavailable',
    });

    expect(classifyDurableExternalContentOutcome({
      status: 'unavailable',
      reason: 'external-content-enrichment-failed',
    })).toEqual({
      result: 'retryable-failure',
      reason: 'external-content-enrichment-failed',
    });
  });

  it('retries non-zero provider failures even when other identity work completed', () => {
    expect(classifyDurableExternalContentOutcome(completed({
      providerFailureCount: 1,
      resolvedCount: 1,
    }))).toEqual({
      result: 'retryable-failure',
      reason: 'provider-failures',
    });
  });

  it('retries non-zero persistence failures even when provider work completed', () => {
    expect(classifyDurableExternalContentOutcome(completed({
      persistenceFailureCount: 1,
      persistedReferenceCount: 0,
    }))).toEqual({
      result: 'retryable-failure',
      reason: 'persistence-failures',
    });
  });

  it('retries when provider and persistence failures coexist', () => {
    expect(classifyDurableExternalContentOutcome(completed({
      providerFailureCount: 1,
      persistenceFailureCount: 2,
    }))).toEqual({
      result: 'retryable-failure',
      reason: 'provider-and-persistence-failures',
    });
  });

  it('treats semantic unresolved/ambiguous decisions as successful when operations succeeded', () => {
    expect(classifyDurableExternalContentOutcome(completed({
      resolvedCount: 0,
      unresolvedCount: 1,
      ambiguousCount: 1,
    }))).toEqual({
      result: 'succeeded',
      reason: 'completed-without-operational-failures',
    });
  });

  it('fails closed when a deferred worker unexpectedly has no authoritative candidates', () => {
    expect(classifyDurableExternalContentOutcome({
      status: 'skipped',
      reason: 'no-authoritative-current-candidates',
    })).toEqual({
      result: 'retryable-failure',
      reason: 'unexpected-no-authoritative-candidates',
    });
  });
});
