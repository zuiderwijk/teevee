import { describe, expect, it, vi } from 'vitest';

import { HostedGuideSearchClient } from './hostedGuideSearchClient';

const okPayload = {
  status: 'ok',
  programmeCoverage: 'complete',
  channelMatches: [],
  programmeMatches: [],
  editorialSignals: [],
};

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HostedGuideSearchClient', () => {
  it('posts only the validated Search query to the public endpoint', async () => {
    const fetcher = vi.fn(async () => jsonResponse(okPayload));
    const client = new HostedGuideSearchClient({
      endpoint: 'https://api.test/guide-search',
      fetcher,
    });

    await expect(client.search({ query: '  NPO 1  ' })).resolves.toEqual(okPayload);

    expect(fetcher).toHaveBeenCalledWith('https://api.test/guide-search', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'NPO 1' }),
      signal: undefined,
    });
  });

  it('forwards AbortSignal so a newer live query can cancel transport work', async () => {
    const fetcher = vi.fn(async () => jsonResponse(okPayload));
    const client = new HostedGuideSearchClient({
      endpoint: 'https://api.test/guide-search',
      fetcher,
    });
    const controller = new AbortController();

    await client.search({ query: 'NPO' }, { signal: controller.signal });

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.test/guide-search',
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('maps the hosted 503 availability contract without hiding other HTTP failures', async () => {
    const unavailable = new HostedGuideSearchClient({
      fetcher: vi.fn(async () => jsonResponse({ status: 'unavailable' }, 503)),
    });
    await expect(unavailable.search({ query: 'nieuws' })).resolves.toEqual({
      status: 'unavailable',
    });

    const badRequest = new HostedGuideSearchClient({
      fetcher: vi.fn(async () => jsonResponse({ error: 'invalid' }, 400)),
    });
    await expect(badRequest.search({ query: 'nieuws' })).rejects.toThrow(
      'HTTP 400',
    );
  });

  it('rejects malformed success payloads and invalid JSON', async () => {
    const malformed = new HostedGuideSearchClient({
      fetcher: vi.fn(async () => jsonResponse({ status: 'ok' })),
    });
    await expect(malformed.search({ query: 'nieuws' })).rejects.toThrow(
      'matches must be arrays',
    );

    const invalidJson = new HostedGuideSearchClient({
      fetcher: vi.fn(
        async () =>
          new Response('not-json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    });
    await expect(invalidJson.search({ query: 'nieuws' })).rejects.toThrow(
      'invalid JSON',
    );
  });
});
