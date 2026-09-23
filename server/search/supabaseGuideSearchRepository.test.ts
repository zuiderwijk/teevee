import { describe, expect, it } from 'vitest';

import type { GuideSearchRepositoryRequest } from './searchRepository';
import {
  SupabaseGuideSearchRepository,
  type GuideSearchRpcClient,
} from './supabaseGuideSearchRepository';

const request: GuideSearchRepositoryRequest = {
  query: 'De slimste mens',
  now: '2026-09-23T18:00:00.000Z',
  windows: [
    { from: '2026-09-21T04:00:00.000Z', to: '2026-09-22T04:00:00.000Z' },
    { from: '2026-09-22T04:00:00.000Z', to: '2026-09-23T04:00:00.000Z' },
    { from: '2026-09-23T04:00:00.000Z', to: '2026-09-24T04:00:00.000Z' },
    { from: '2026-09-24T04:00:00.000Z', to: '2026-09-25T04:00:00.000Z' },
    { from: '2026-09-25T04:00:00.000Z', to: '2026-09-26T04:00:00.000Z' },
    { from: '2026-09-26T04:00:00.000Z', to: '2026-09-27T04:00:00.000Z' },
    { from: '2026-09-27T04:00:00.000Z', to: '2026-09-28T04:00:00.000Z' },
    { from: '2026-09-28T04:00:00.000Z', to: '2026-09-29T04:00:00.000Z' },
    { from: '2026-09-29T04:00:00.000Z', to: '2026-09-30T04:00:00.000Z' },
    { from: '2026-09-30T04:00:00.000Z', to: '2026-10-01T04:00:00.000Z' },
  ],
  programmeLimit: 24,
  channelLimit: 24,
};

const channel = {
  id: 'nl-npo-1',
  name: 'NPO 1',
  displayName: 'NPO 1',
  shortName: 'NPO 1',
  sortOrder: 1,
  isActive: true,
};

const programme = {
  id: 'programme-1',
  channelId: 'nl-npo-1',
  startAt: '2026-09-23T18:30:00Z',
  endAt: '2026-09-23T19:30:00Z',
  title: 'De slimste mens',
};

class FakeRpcClient implements GuideSearchRpcClient {
  readonly calls: Array<{
    functionName: string;
    args: Record<string, unknown>;
  }> = [];

  constructor(
    private readonly response: {
      data: unknown;
      error: { message: string } | null;
    },
  ) {}

  async rpc<T>(functionName: string, args: Record<string, unknown>) {
    this.calls.push({ functionName, args });
    return this.response as {
      data: T | null;
      error: { message: string } | null;
    };
  }
}

describe('SupabaseGuideSearchRepository', () => {
  it('calls one bounded Search RPC with the exact server-owned horizon', async () => {
    const client = new FakeRpcClient({
      data: {
        status: 'ok',
        programmeCoverage: 'complete',
        channelMatches: [channel],
        programmeMatches: [{ programme, channel }],
        editorialSignals: [],
      },
      error: null,
    });
    const repository = new SupabaseGuideSearchRepository(client);

    await expect(repository.search(request)).resolves.toMatchObject({
      programmeCoverage: 'complete',
      channelMatches: [{ id: 'nl-npo-1' }],
      programmeMatches: [{ programme: { id: 'programme-1' } }],
    });

    expect(client.calls).toEqual([
      {
        functionName: 'teevee_search_guide',
        args: {
          p_query: request.query,
          p_now: request.now,
          p_windows: request.windows,
          p_programme_limit: 24,
          p_channel_limit: 24,
        },
      },
    ]);
  });

  it('rejects malformed canonical payloads and duplicate identities', async () => {
    const mismatch = new SupabaseGuideSearchRepository(
      new FakeRpcClient({
        data: {
          status: 'ok',
          programmeCoverage: 'complete',
          channelMatches: [],
          programmeMatches: [
            {
              programme,
              channel: { ...channel, id: 'nl-npo-2' },
            },
          ],
          editorialSignals: [],
        },
        error: null,
      }),
    );
    await expect(mismatch.search(request)).rejects.toThrow(
      'channel does not match programme',
    );

    const duplicate = new SupabaseGuideSearchRepository(
      new FakeRpcClient({
        data: {
          status: 'ok',
          programmeCoverage: 'complete',
          channelMatches: [channel, channel],
          programmeMatches: [],
          editorialSignals: [],
        },
        error: null,
      }),
    );
    await expect(duplicate.search(request)).rejects.toThrow(
      'duplicate channel matches',
    );
  });

  it('surfaces RPC/storage errors and unexpected unavailable payloads', async () => {
    const failed = new SupabaseGuideSearchRepository(
      new FakeRpcClient({
        data: null,
        error: { message: 'database unavailable' },
      }),
    );
    await expect(failed.search(request)).rejects.toThrow(
      'Supabase Guide Search failed: database unavailable',
    );

    const unavailable = new SupabaseGuideSearchRepository(
      new FakeRpcClient({
        data: { status: 'unavailable' },
        error: null,
      }),
    );
    await expect(unavailable.search(request)).rejects.toThrow(
      'returned unavailable unexpectedly',
    );
  });
});
