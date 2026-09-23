import { describe, expect, it, vi } from 'vitest';

import { HostedProgrammeClassificationClient } from './hostedProgrammeClassificationClient.ts';

function response(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HostedProgrammeClassificationClient', () => {
  it('posts only canonical programme ids and receives provider-independent semantics', async () => {
    const payload = {
      status: 'ok',
      classifications: [
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
    };
    const fetcher = vi.fn(async () => response(payload));
    const client = new HostedProgrammeClassificationClient(
      'https://api.test/programme-classifications',
      fetcher,
    );

    await expect(
      client.getClassifications({ programmeIds: [' programme-1 '] }),
    ).resolves.toEqual(payload);

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.test/programme-classifications',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ programmeIds: ['programme-1'] }),
      }),
    );
  });

  it('preserves bounded unavailability without hiding other transport failures', async () => {
    const unavailable = new HostedProgrammeClassificationClient(
      'https://api.test/programme-classifications',
      vi.fn(async () => response({ status: 'unavailable' }, 503)),
    );
    await expect(
      unavailable.getClassifications({ programmeIds: ['programme-1'] }),
    ).resolves.toEqual({ status: 'unavailable' });

    const bad = new HostedProgrammeClassificationClient(
      'https://api.test/programme-classifications',
      vi.fn(async () => response({ error: 'bad' }, 400)),
    );
    await expect(
      bad.getClassifications({ programmeIds: ['programme-1'] }),
    ).rejects.toThrow('HTTP 400');
  });
});
