import { describe, expect, it, vi } from 'vitest';

import { SupabaseProgrammeClassificationRepository } from './supabaseProgrammeClassificationRepository.ts';

describe('SupabaseProgrammeClassificationRepository', () => {
  it('reads a bounded provider-independent classification array through the private RPC bridge', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          programmeId: 'programme-1',
          contentType: 'film',
          seriesType: 'unknown',
          audience: 'unknown',
          sportType: 'unknown',
          liveStatus: 'unknown',
          repeatStatus: 'unknown',
          confidence: 'high',
        },
      ],
      error: null,
    });
    const repository = new SupabaseProgrammeClassificationRepository({ rpc });

    await expect(
      repository.getClassificationsForProgrammeIds(['programme-1']),
    ).resolves.toEqual([
      expect.objectContaining({
        programmeId: 'programme-1',
        contentType: 'film',
      }),
    ]);
    expect(rpc).toHaveBeenCalledWith('teevee_get_programme_classifications', {
      p_programme_ids: ['programme-1'],
    });
  });

  it('avoids an RPC for an empty internal request and rejects malformed storage payloads', async () => {
    const rpc = vi.fn();
    const repository = new SupabaseProgrammeClassificationRepository({ rpc });
    await expect(repository.getClassificationsForProgrammeIds([])).resolves.toEqual([]);
    expect(rpc).not.toHaveBeenCalled();

    rpc.mockResolvedValueOnce({
      data: [{ programmeId: 'programme-1', contentType: 'Film' }],
      error: null,
    });
    await expect(
      repository.getClassificationsForProgrammeIds(['programme-1']),
    ).rejects.toThrow('contentType');
  });

  it('surfaces storage failures instead of manufacturing classifications', async () => {
    const repository = new SupabaseProgrammeClassificationRepository({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'database unavailable' },
      }),
    });
    await expect(
      repository.getClassificationsForProgrammeIds(['programme-1']),
    ).rejects.toThrow('database unavailable');
  });
});
