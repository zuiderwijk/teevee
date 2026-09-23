import { describe, expect, it, vi } from 'vitest';

import { RepositoryProgrammeClassificationApi } from './classificationService.ts';

const classification = {
  programmeId: 'programme-1',
  contentType: 'film' as const,
  seriesType: 'unknown' as const,
  audience: 'unknown' as const,
  sportType: 'unknown' as const,
  liveStatus: 'unknown' as const,
  repeatStatus: 'unknown' as const,
  confidence: 'high' as const,
};

describe('RepositoryProgrammeClassificationApi', () => {
  it('returns only requested provider-independent sibling classifications', async () => {
    const repository = {
      getClassificationsForProgrammeIds: vi.fn(async () => [classification]),
    };
    const api = new RepositoryProgrammeClassificationApi(repository);

    await expect(
      api.getClassifications({ programmeIds: ['programme-1'] }),
    ).resolves.toEqual({
      status: 'ok',
      classifications: [classification],
    });
  });

  it('fails closed if a repository leaks classification identity outside the bounded request', async () => {
    const repository = {
      getClassificationsForProgrammeIds: vi.fn(async () => [
        { ...classification, programmeId: 'programme-other' },
      ]),
    };
    const api = new RepositoryProgrammeClassificationApi(repository);

    await expect(
      api.getClassifications({ programmeIds: ['programme-1'] }),
    ).rejects.toThrow('unrequested programme');
  });
});
