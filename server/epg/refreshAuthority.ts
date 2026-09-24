import type { Channel } from '../../data/domain/epg.ts';

import type { IngestWriteResult } from './ingest.ts';

export type EpgRefreshAuthorityResult =
  | {
      status: 'authoritative';
      reason: 'stored-exact-scope';
      expectedChannelIds: Channel['id'][];
      actualChannelIds: Channel['id'][];
    }
  | {
      status: 'requires-canonical-proof';
      reason: 'ignored-stale-exact-scope';
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
 * A stored write proves exact-scope authority when the actual stored channel set equals
 * the database-owned expected child scope. `ignored-stale` is deliberately different:
 * ADR 0007 rejects a whole multi-channel replacement when any target channel overlaps
 * newer coverage, so echoed channel IDs prove only the attempted scope. Exact
 * same-or-newer canonical coverage must therefore be proven atomically in Postgres
 * before durable success.
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
      status: 'requires-canonical-proof',
      reason: 'ignored-stale-exact-scope',
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
