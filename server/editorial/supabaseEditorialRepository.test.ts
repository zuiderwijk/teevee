import { describe, expect, it, vi } from 'vitest';

import { SupabaseEditorialSignalRepository } from './supabaseEditorialRepository';

describe('SupabaseEditorialSignalRepository', () => {
  it('writes one authoritative source snapshot through the private RPC bridge', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        status: 'stored',
        removedSignalCount: 2,
        storedSignalCount: 1,
      },
      error: null,
    });
    const repository = new SupabaseEditorialSignalRepository({ rpc });

    await expect(
      repository.replaceSourceSnapshot({
        source: 'tvgids',
        refreshedAt: '2026-09-22T18:00:00.000Z',
        signals: [
          {
            programmeId: 'programme-1',
            type: 'kijktip',
            source: 'tvgids',
            sourceItemId: 'tip-1',
            matchedBy: 'channel-title-start',
          },
        ],
      }),
    ).resolves.toEqual({
      status: 'stored',
      removedSignalCount: 2,
      storedSignalCount: 1,
    });

    expect(rpc).toHaveBeenCalledWith(
      'teevee_replace_editorial_signal_snapshot',
      expect.objectContaining({
        p_source: 'tvgids',
        p_refreshed_at: '2026-09-22T18:00:00.000Z',
      }),
    );
  });

  it('preserves ignored-stale semantics from concurrent refreshes', async () => {
    const repository = new SupabaseEditorialSignalRepository({
      rpc: vi.fn().mockResolvedValue({
        data: {
          status: 'ignored-stale',
          removedSignalCount: 0,
          storedSignalCount: 0,
        },
        error: null,
      }),
    });

    await expect(
      repository.replaceSourceSnapshot({
        source: 'tvgids',
        refreshedAt: '2026-09-22T17:00:00.000Z',
        signals: [],
      }),
    ).resolves.toEqual({
      status: 'ignored-stale',
      removedSignalCount: 0,
      storedSignalCount: 0,
    });
  });

  it('returns retained historical signals without client-side age filtering', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          programmeId: 'programme-historical',
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: 'tip-historical',
          publishedAt: '2026-09-20T18:00:00.000Z',
          matchedBy: 'channel-title-start',
        },
      ],
      error: null,
    });
    const repository = new SupabaseEditorialSignalRepository({ rpc });

    await expect(
      repository.getSignalsForProgrammeIds(['programme-historical']),
    ).resolves.toEqual([
      {
        programmeId: 'programme-historical',
        type: 'kijktip',
        source: 'tvgids',
        sourceItemId: 'tip-historical',
        publishedAt: '2026-09-20T18:00:00.000Z',
        matchedBy: 'channel-title-start',
      },
    ]);

    expect(rpc).toHaveBeenCalledWith('teevee_get_editorial_signals', {
      p_programme_ids: ['programme-historical'],
    });
  });

  it('validates serialized signals returned by the RPC', async () => {
    const repository = new SupabaseEditorialSignalRepository({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            programmeId: 'programme-1',
            type: 'kijktip',
            source: 'tvgids',
            sourceItemId: 'tip-1',
            matchedBy: 'channel-exact-start',
          },
        ],
        error: null,
      }),
    });

    await expect(
      repository.getSignalsForProgrammeIds(['programme-1', 'programme-1']),
    ).resolves.toEqual([
      {
        programmeId: 'programme-1',
        type: 'kijktip',
        source: 'tvgids',
        sourceItemId: 'tip-1',
        matchedBy: 'channel-exact-start',
      },
    ]);
  });
});
