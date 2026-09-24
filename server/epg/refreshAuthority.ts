import type { Channel } from '../../data/domain/epg.ts';

import type { IngestWriteResult } from './ingest.ts';

export type EpgRefreshAuthorityResult =
  | {
      status: 'authoritative';
      reason: 'stored-exact-scope' | 'newer-authority-exact-scope';
      expectedChannelIds: Channel['id'][];
      actualChannelIds: Channel['id'][];
    }
  | {
      status: 'incomplete';
      reason:
        | 'partial-provider-coverage'
        | 'unattributed-provider-record'
        | 'no-safe-channel-scope'
        | 'incomplete-channel-scope';
      expectedChannelIds: Channel['id'][];
      actualChannelIds: Channel['id'][];
    };

function normalizedChannelIds(values: readonly Channel['id'][]): Channel['id'][] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function sameChannelScope(
  expected: readonly Channel['id'][],
  actual: readonly Channel['id'][],
): boolean {
  if (expected.length !== actual.length) return false;
  return expected.every((channelId, index) => channelId === actual[index]);
}

/**
 * Durable orchestration success is stricter than a non-throwing ingest.
 *
 * A child represents one exact database-owned channel/time scope. The child is only
 * authoritative when the whole expected canonical channel set was stored, or when a
 * newer observation already owns that exact scope through ignored-stale. Provider
 * partial coverage, unattributed/no-safe input and channel-local data-quality blocking
 * remain durable incomplete outcomes rather than masquerading as horizon success.
 */
export function classifyEpgRefreshWorkItemAuthority(input: {
  expectedCanonicalChannelIds: readonly Channel['id'][];
  write: IngestWriteResult;
}): EpgRefreshAuthorityResult {
  const expectedChannelIds = normalizedChannelIds(input.expectedCanonicalChannelIds);
  if (expectedChannelIds.length === 0) {
    throw new Error('EPG refresh work item requires an expected canonical channel scope');
  }

  const actualChannelIds = normalizedChannelIds(input.write.channelIds);
  const exactScope = sameChannelScope(expectedChannelIds, actualChannelIds);

  if (input.write.status === 'stored' && exactScope) {
    return {
      status: 'authoritative',
      reason: 'stored-exact-scope',
      expectedChannelIds,
      actualChannelIds,
    };
  }

  if (input.write.status === 'ignored-stale' && exactScope) {
    return {
      status: 'authoritative',
      reason: 'newer-authority-exact-scope',
      expectedChannelIds,
      actualChannelIds,
    };
  }

  if (input.write.status === 'skipped') {
    return {
      status: 'incomplete',
      reason: input.write.reason,
      expectedChannelIds,
      actualChannelIds,
    };
  }

  return {
    status: 'incomplete',
    reason: 'incomplete-channel-scope',
    expectedChannelIds,
    actualChannelIds,
  };
}
