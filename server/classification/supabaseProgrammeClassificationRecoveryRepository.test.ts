import { describe, expect, it, vi } from 'vitest';

import type { ProgrammeClassification } from '@/data/domain/programmeClassification';

import { SupabaseProgrammeClassificationRecoveryRepository } from './supabaseProgrammeClassificationRecoveryRepository.ts';

const programme = {
  id: 'programme-1',
  channelId: 'channel-1',
  startAt: '2026-09-23T18:00:00.000Z',
  endAt: '2026-09-23T19:00:00.000Z',
  title: 'Film',
};

const classification: ProgrammeClassification = {
  programmeId: programme.id,
  contentType: 'film',
  seriesType: 'unknown',
  audience: 'unknown',
  sportType: 'unknown',
  liveStatus: 'unknown',
  repeatStatus: 'unknown',
  confidence: 'high',
};

describe('SupabaseProgrammeClassificationRecoveryRepository', () => {
  it('maps exact candidates to the service-only recovery RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        candidateProgrammeCount: 1,
        matchedProgrammeCount: 1,
        recoveredClassificationCount: 1,
        ignoredStaleCount: 0,
        unmatchedProgrammeCount: 0,
      },
      error: null,
    });
    const repository =
      new SupabaseProgrammeClassificationRecoveryRepository({ rpc });

    await expect(
      repository.recoverClassifications({
        from: '2026-09-23T04:00:00.000Z',
        to: '2026-09-24T04:00:00.000Z',
        observedAt: '2026-09-23T20:00:00.000Z',
        channelIds: ['channel-1'],
        programmes: [programme],
        classifications: [classification],
      }),
    ).resolves.toEqual({
      candidateProgrammeCount: 1,
      matchedProgrammeCount: 1,
      recoveredClassificationCount: 1,
      ignoredStaleCount: 0,
      unmatchedProgrammeCount: 0,
    });

    expect(rpc).toHaveBeenCalledWith(
      'teevee_recover_programme_classifications',
      {
        p_from: '2026-09-23T04:00:00.000Z',
        p_to: '2026-09-24T04:00:00.000Z',
        p_observed_at: '2026-09-23T20:00:00.000Z',
        p_channel_ids: ['channel-1'],
        p_programmes: [programme],
        p_classifications: [classification],
      },
    );
  });

  it('does not call storage for an empty recovery candidate set', async () => {
    const rpc = vi.fn();
    const repository =
      new SupabaseProgrammeClassificationRecoveryRepository({ rpc });

    await expect(
      repository.recoverClassifications({
        from: '2026-09-23T04:00:00.000Z',
        to: '2026-09-24T04:00:00.000Z',
        observedAt: '2026-09-23T20:00:00.000Z',
        channelIds: ['channel-1'],
        programmes: [],
        classifications: [],
      }),
    ).resolves.toEqual({
      candidateProgrammeCount: 0,
      matchedProgrammeCount: 0,
      recoveredClassificationCount: 0,
      ignoredStaleCount: 0,
      unmatchedProgrammeCount: 0,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects inconsistent recovery counts and surfaces RPC failures', async () => {
    const inconsistent =
      new SupabaseProgrammeClassificationRecoveryRepository({
        rpc: vi.fn().mockResolvedValue({
          data: {
            candidateProgrammeCount: 1,
            matchedProgrammeCount: 0,
            recoveredClassificationCount: 1,
            ignoredStaleCount: 0,
            unmatchedProgrammeCount: 1,
          },
          error: null,
        }),
      });
    await expect(
      inconsistent.recoverClassifications({
        from: '2026-09-23T04:00:00.000Z',
        to: '2026-09-24T04:00:00.000Z',
        observedAt: '2026-09-23T20:00:00.000Z',
        channelIds: ['channel-1'],
        programmes: [programme],
        classifications: [classification],
      }),
    ).rejects.toThrow('inconsistent counts');

    const failing =
      new SupabaseProgrammeClassificationRecoveryRepository({
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'database unavailable' },
        }),
      });
    await expect(
      failing.recoverClassifications({
        from: '2026-09-23T04:00:00.000Z',
        to: '2026-09-24T04:00:00.000Z',
        observedAt: '2026-09-23T20:00:00.000Z',
        channelIds: ['channel-1'],
        programmes: [programme],
        classifications: [classification],
      }),
    ).rejects.toThrow('database unavailable');
  });
});
