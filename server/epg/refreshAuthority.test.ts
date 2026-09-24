import { describe, expect, it } from 'vitest';

import type { IngestWriteResult } from './ingest.ts';
import { classifyEpgRefreshWorkItemAuthority } from './refreshAuthority.ts';

function stored(channelIds: string[]): IngestWriteResult {
  return {
    status: 'stored',
    channelIds,
    result: {
      status: 'stored',
      removedProgrammeCount: 10,
      storedProgrammeCount: 10,
    },
  };
}

function ignoredStale(channelIds: string[]): IngestWriteResult {
  return {
    status: 'ignored-stale',
    channelIds,
    result: {
      status: 'ignored-stale',
      removedProgrammeCount: 0,
      storedProgrammeCount: 0,
    },
  };
}

describe('classifyEpgRefreshWorkItemAuthority', () => {
  it('accepts a stored write only when the whole expected child scope is authoritative', () => {
    expect(
      classifyEpgRefreshWorkItemAuthority({
        expectedCanonicalChannelIds: ['channel-2', 'channel-1'],
        write: stored(['channel-1', 'channel-2']),
      }),
    ).toEqual({
      status: 'authoritative',
      reason: 'stored-exact-scope',
      expectedChannelIds: ['channel-1', 'channel-2'],
      actualChannelIds: ['channel-1', 'channel-2'],
    });

    expect(
      classifyEpgRefreshWorkItemAuthority({
        expectedCanonicalChannelIds: ['channel-1', 'channel-2'],
        write: stored(['channel-1']),
      }),
    ).toEqual({
      status: 'incomplete',
      reason: 'incomplete-channel-scope',
      expectedChannelIds: ['channel-1', 'channel-2'],
      actualChannelIds: ['channel-1'],
    });
  });

  it('accepts ignored-stale only when newer authority owns the exact child scope', () => {
    expect(
      classifyEpgRefreshWorkItemAuthority({
        expectedCanonicalChannelIds: ['channel-1', 'channel-2'],
        write: ignoredStale(['channel-2', 'channel-1']),
      }),
    ).toMatchObject({
      status: 'authoritative',
      reason: 'newer-authority-exact-scope',
    });

    expect(
      classifyEpgRefreshWorkItemAuthority({
        expectedCanonicalChannelIds: ['channel-1', 'channel-2'],
        write: ignoredStale(['channel-1']),
      }),
    ).toMatchObject({
      status: 'incomplete',
      reason: 'incomplete-channel-scope',
    });
  });

  it.each([
    'partial-provider-coverage',
    'unattributed-provider-record',
    'no-safe-channel-scope',
  ] as const)('persists skipped %s as incomplete authority', (reason) => {
    expect(
      classifyEpgRefreshWorkItemAuthority({
        expectedCanonicalChannelIds: ['channel-1', 'channel-2'],
        write: {
          status: 'skipped',
          channelIds: reason === 'no-safe-channel-scope' ? [] : ['channel-1'],
          reason,
        },
      }),
    ).toMatchObject({
      status: 'incomplete',
      reason,
      expectedChannelIds: ['channel-1', 'channel-2'],
    });
  });

  it('rejects an empty expected canonical scope', () => {
    expect(() =>
      classifyEpgRefreshWorkItemAuthority({
        expectedCanonicalChannelIds: [],
        write: stored([]),
      }),
    ).toThrow('requires an expected canonical channel scope');
  });
});
