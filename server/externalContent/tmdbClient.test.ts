import { describe, expect, it, vi } from 'vitest';

import {
  TmdbApiClient,
  TmdbRequestError,
  TmdbRequestSession,
} from './tmdbClient.ts';

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

describe('TmdbApiClient', () => {
  it('keeps the bearer token inside the server request boundary and parses JSON', async () => {
    const fetcher = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer server-secret');
      return jsonResponse({ ok: true });
    });
    const client = new TmdbApiClient({
      token: 'server-secret',
      fetcher,
      maxRetries: 0,
    });

    await expect(client.getJson('/3/test')).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('owns a bounded timeout and reports timeout without exposing the token', async () => {
    const fetcher = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('aborted', 'AbortError')),
          { once: true },
        );
      }),
    );
    const client = new TmdbApiClient({
      token: 'never-log-me',
      fetcher,
      timeoutMs: 5,
      maxRetries: 0,
    });

    const error = await client.getJson('/3/slow').catch((value: unknown) => value);
    expect(error).toBeInstanceOf(TmdbRequestError);
    expect(error).toMatchObject({ kind: 'timeout' });
    expect(String(error)).not.toContain('never-log-me');
  });

  it('retries one safe 5xx failure with deterministic bounded backoff', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ status_message: 'busy' }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = vi.fn(async () => undefined);
    const client = new TmdbApiClient({
      token: 'secret',
      fetcher,
      maxRetries: 1,
      sleep,
    });

    await expect(client.getJson('/3/retry')).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(150);
  });

  it('honours a bounded 429 Retry-After and retries only when it fits the policy', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ status_message: 'slow down' }, 429, { 'Retry-After': '0.2' }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = vi.fn(async () => undefined);
    const client = new TmdbApiClient({
      token: 'secret',
      fetcher,
      maxRetries: 1,
      maxRetryAfterMs: 500,
      sleep,
    });

    await expect(client.getJson('/3/rate')).resolves.toEqual({ ok: true });
    expect(sleep).toHaveBeenCalledWith(200);
  });

  it('fails fast on a 429 Retry-After outside the bounded retry budget', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({ status_message: 'slow down' }, 429, { 'Retry-After': '5' }),
    );
    const client = new TmdbApiClient({
      token: 'secret',
      fetcher,
      maxRetries: 1,
      maxRetryAfterMs: 500,
      sleep: vi.fn(async () => undefined),
    });

    await expect(client.getJson('/3/rate')).rejects.toMatchObject({
      kind: 'rate-limited',
      status: 429,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not retry non-retryable 4xx failures', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ status_message: 'bad' }, 401));
    const client = new TmdbApiClient({
      token: 'secret',
      fetcher,
      maxRetries: 2,
      sleep: vi.fn(async () => undefined),
    });

    await expect(client.getJson('/3/auth')).rejects.toMatchObject({
      kind: 'client',
      status: 401,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed successful responses', async () => {
    const fetcher = vi.fn(async () =>
      new Response('not-json', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
    );
    const client = new TmdbApiClient({
      token: 'secret',
      fetcher,
      maxRetries: 0,
    });

    await expect(client.getJson('/3/bad-json')).rejects.toMatchObject({
      kind: 'malformed',
    });
  });
});

describe('TmdbRequestSession', () => {
  it('treats a missing TMDB season as a deterministic episode-coordinate mismatch', async () => {
    const fetcher = vi.fn(async (url: URL | RequestInfo) => {
      const value = String(url);
      if (value.includes('/tv/200/season/38')) {
        return jsonResponse({ status_message: 'not found' }, 404);
      }
      throw new Error(`unexpected URL ${value}`);
    });
    const session = new TmdbRequestSession(
      new TmdbApiClient({ token: 'secret', fetcher, maxRetries: 0 }),
    );

    await expect(session.seriesHasEpisode('200', 38, 188)).resolves.toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('deduplicates identical request-scope searches and candidate detail work', async () => {
    const fetcher = vi.fn(async (url: URL | RequestInfo) => {
      const value = String(url);
      if (value.includes('/search/movie')) {
        return jsonResponse({ results: [{ id: 100 }] });
      }
      if (value.includes('/movie/100')) {
        return jsonResponse({
          id: 100,
          title: 'Billy Elliot',
          original_title: 'Billy Elliot',
          release_date: '2000-09-29',
          credits: {
            crew: [{ job: 'Director', name: 'Stephen Daldry' }],
            cast: [{ name: 'Jamie Bell' }],
          },
          alternative_titles: { titles: [] },
        });
      }
      throw new Error(`unexpected URL ${value}`);
    });
    const session = new TmdbRequestSession(
      new TmdbApiClient({ token: 'secret', fetcher, maxRetries: 0 }),
    );

    await session.searchMovieIds('Billy Elliot');
    await session.searchMovieIds('Billy Elliot');
    await session.getMovie('100');
    await session.getMovie('100');

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
