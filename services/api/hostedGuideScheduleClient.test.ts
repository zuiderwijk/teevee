import { describe, expect, it, vi } from 'vitest';

import { HostedGuideScheduleClient } from './hostedGuideScheduleClient';

const scheduleResponse = {
  status: 'ok',
  schedule: {
    generatedAt: '2026-09-14T06:00:00Z',
    timezone: 'Europe/Amsterdam',
    channels: [
      {
        id: 'nl-npo-1',
        name: 'NPO 1',
        displayName: 'NPO 1',
        sortOrder: 0,
        isActive: true,
      },
    ],
    programmes: [
      {
        id: 'programme-1',
        channelId: 'nl-npo-1',
        startAt: '2026-09-14T16:00:00Z',
        endAt: '2026-09-14T17:00:00Z',
        title: 'Nieuws',
      },
    ],
  },
};

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HostedGuideScheduleClient', () => {
  it('posts only canonical Teevee query data to the public schedule endpoint', async () => {
    const fetcher = vi.fn(async () => jsonResponse(scheduleResponse));
    const client = new HostedGuideScheduleClient({
      endpoint: 'https://api.test/guide-schedule',
      fetcher,
    });

    await expect(
      client.getSchedule({
        from: '2026-09-13T22:00:00.000Z',
        to: '2026-09-14T22:00:00.000Z',
      }),
    ).resolves.toMatchObject({ status: 'ok' });

    expect(fetcher).toHaveBeenCalledWith('https://api.test/guide-schedule', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '2026-09-13T22:00:00.000Z',
        to: '2026-09-14T22:00:00.000Z',
      }),
    });
  });

  it('surfaces transport and malformed-response failures', async () => {
    const unavailable = new HostedGuideScheduleClient({
      fetcher: vi.fn(async () => jsonResponse({ error: 'down' }, 503)),
    });
    await expect(
      unavailable.getSchedule({ from: '2026-09-14T00:00:00Z', to: '2026-09-14T01:00:00Z' }),
    ).rejects.toThrow('HTTP 503');

    const invalid = new HostedGuideScheduleClient({
      fetcher: vi.fn(async () => new Response('not-json', { status: 200 })),
    });
    await expect(
      invalid.getSchedule({ from: '2026-09-14T00:00:00Z', to: '2026-09-14T01:00:00Z' }),
    ).rejects.toThrow('invalid JSON');
  });
});
