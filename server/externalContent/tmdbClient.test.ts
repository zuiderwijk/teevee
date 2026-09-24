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

function requestSession(bodies: Record<string, unknown>): TmdbRequestSession {
  const fetcher = vi.fn(async (url: URL | RequestInfo) => {
    const value = String(url);
    const match = Object.entries(bodies).find(([needle]) => value.includes(needle));
    if (!match) throw new Error(`unexpected URL ${value}`);
    return jsonResponse(match[1]);
  });
  return new TmdbRequestSession(
    new TmdbApiClient({ token: 'secret', fetcher, maxRetries: 0 }),
  );
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

  it('validates every season episode before deriving membership', async () => {
    const malformed = requestSession({
      '/tv/200/season/38': {
        episodes: [
          { episode_number: 188 },
          {},
        ],
      },
    });
    await expect(malformed.seriesHasEpisode('200', 38, 188)).rejects.toMatchObject({
      kind: 'malformed',
    });

    const matching = requestSession({
      '/tv/200/season/38': {
        episodes: [
          { episode_number: 187 },
          { episode_number: 188 },
        ],
      },
    });
    await expect(matching.seriesHasEpisode('200', 38, 188)).resolves.toBe(true);

    const missing = requestSession({
      '/tv/200/season/38': {
        episodes: [
          { episode_number: 187 },
          { episode_number: 189 },
        ],
      },
    });
    await expect(missing.seriesHasEpisode('200', 38, 188)).resolves.toBe(false);
  });

  it.each([
    ['object', { results: {} }],
    ['missing', {}],
    ['null', { results: null }],
  ])('rejects malformed movie-search results when %s', async (_case, payload) => {
    const session = requestSession({ '/search/movie': payload });
    await expect(session.searchMovieIds('Billy Elliot')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it.each([
    ['wrong-shaped', { results: 'not-an-array' }],
    ['missing', {}],
  ])('rejects malformed TV-search results when %s', async (_case, payload) => {
    const session = requestSession({ '/search/tv': payload });
    await expect(session.searchSeriesIds('Neighbours')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it.each([
    ['missing', {}],
    ['wrong-shaped', { episodes: {} }],
  ])('rejects HTTP 200 season payloads with %s episodes', async (_case, payload) => {
    const session = requestSession({ '/tv/200/season/38': payload });
    await expect(session.seriesHasEpisode('200', 38, 188)).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('rejects a malformed movie credits container', async () => {
    const session = requestSession({ '/movie/100': {
      id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
      credits: null, alternative_titles: { titles: [] },
    } });
    await expect(session.getMovie('100')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('rejects malformed movie crew evidence', async () => {
    const session = requestSession({ '/movie/100': {
      id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
      credits: { crew: {}, cast: [] }, alternative_titles: { titles: [] },
    } });
    await expect(session.getMovie('100')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('rejects malformed movie cast evidence', async () => {
    const session = requestSession({ '/movie/100': {
      id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
      credits: { crew: [], cast: {} }, alternative_titles: { titles: [] },
    } });
    await expect(session.getMovie('100')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it.each([
    ['container', null],
    ['titles', { titles: {} }],
  ])('rejects malformed movie alternative-title %s', async (_case, alternativeTitles) => {
    const session = requestSession({ '/movie/100': {
      id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
      credits: { crew: [], cast: [] }, alternative_titles: alternativeTitles,
    } });
    await expect(session.getMovie('100')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it.each([
    ['aggregate-credits container', null],
    ['aggregate cast', { cast: {} }],
  ])('rejects malformed Series %s', async (_case, aggregateCredits) => {
    const session = requestSession({ '/tv/200': {
      id: 200, name: 'Neighbours', original_name: 'Neighbours',
      aggregate_credits: aggregateCredits, alternative_titles: { results: [] },
    } });
    await expect(session.getSeries('200')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it.each([
    ['container', null],
    ['results', { results: {} }],
  ])('rejects malformed Series alternative-title %s', async (_case, alternativeTitles) => {
    const session = requestSession({ '/tv/200': {
      id: 200, name: 'Neighbours', original_name: 'Neighbours',
      aggregate_credits: { cast: [] }, alternative_titles: alternativeTitles,
    } });
    await expect(session.getSeries('200')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it.each([
    ['wrong-shaped', { results: {} }],
    ['missing', {}],
  ])('rejects malformed person-search results when %s', async (_case, payload) => {
    const session = requestSession({ '/search/person': payload });
    await expect(session.getDirectedMovieCredits('Stephen Daldry')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('rejects malformed person movie-credit crew evidence', async () => {
    const session = requestSession({
      '/search/person': { results: [{ id: 10, name: 'Stephen Daldry' }] },
      '/person/10/movie_credits': { crew: {} },
    });
    await expect(session.getDirectedMovieCredits('Stephen Daldry')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('rejects malformed movie-search result elements instead of filtering them out', async () => {
    const session = requestSession({ '/search/movie': { results: [{}] } });
    await expect(session.searchMovieIds('Billy Elliot')).rejects.toMatchObject({
      kind: 'malformed',
    });
  });

  it('rejects malformed TV-search result elements instead of filtering them out', async () => {
    const session = requestSession({ '/search/tv': { results: [{}] } });
    await expect(session.searchSeriesIds('Neighbours')).rejects.toMatchObject({
      kind: 'malformed',
    });
  });

  it('rejects malformed season episode elements instead of treating them as mismatch', async () => {
    const session = requestSession({
      '/tv/200/season/38': { episodes: [{}] },
    });
    await expect(session.seriesHasEpisode('200', 38, 188)).rejects.toMatchObject({
      kind: 'malformed',
    });
  });

  it('rejects malformed movie crew elements instead of producing no-director evidence', async () => {
    const session = requestSession({ '/movie/100': {
      id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
      credits: { crew: [{}], cast: [] }, alternative_titles: { titles: [] },
    } });
    await expect(session.getMovie('100')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('rejects malformed movie cast elements instead of producing no-cast evidence', async () => {
    const session = requestSession({ '/movie/100': {
      id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
      credits: { crew: [], cast: [{}] }, alternative_titles: { titles: [] },
    } });
    await expect(session.getMovie('100')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('rejects malformed Series cast elements instead of producing no-cast evidence', async () => {
    const session = requestSession({ '/tv/200': {
      id: 200, name: 'Neighbours', original_name: 'Neighbours',
      aggregate_credits: { cast: [{}] }, alternative_titles: { results: [] },
    } });
    await expect(session.getSeries('200')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('rejects malformed movie alternative-title elements', async () => {
    const session = requestSession({ '/movie/100': {
      id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
      credits: { crew: [], cast: [] }, alternative_titles: { titles: [{}] },
    } });
    await expect(session.getMovie('100')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('rejects malformed Series alternative-title elements', async () => {
    const session = requestSession({ '/tv/200': {
      id: 200, name: 'Neighbours', original_name: 'Neighbours',
      aggregate_credits: { cast: [] }, alternative_titles: { results: [{}] },
    } });
    await expect(session.getSeries('200')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('requires a person id only when the search result name actually matches', async () => {
    const nonMatch = requestSession({
      '/search/person': { results: [{ name: 'Someone Else' }] },
    });
    await expect(nonMatch.getDirectedMovieCredits('Stephen Daldry')).resolves.toEqual([]);

    const malformedMatch = requestSession({
      '/search/person': { results: [{ name: 'Stephen Daldry' }] },
    });
    await expect(malformedMatch.getDirectedMovieCredits('Stephen Daldry')).rejects.toMatchObject({
      kind: 'malformed',
    });
  });

  it('rejects malformed person-search elements instead of filtering them out', async () => {
    const session = requestSession({
      '/search/person': { results: [{}] },
    });
    await expect(session.getDirectedMovieCredits('Stephen Daldry')).rejects.toMatchObject({
      kind: 'malformed',
    });
  });

  it('rejects malformed person movie-credit crew elements instead of filtering them out', async () => {
    const session = requestSession({
      '/search/person': { results: [{ id: 10, name: 'Stephen Daldry' }] },
      '/person/10/movie_credits': { crew: [{}] },
    });
    await expect(session.getDirectedMovieCredits('Stephen Daldry')).rejects.toMatchObject({
      kind: 'malformed',
    });
  });

  it('requires director-specific movie crew fields only after the Director role is established', async () => {
    const nonDirector = requestSession({ '/movie/100': {
      id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
      credits: { crew: [{ job: 'Writer' }], cast: [] }, alternative_titles: { titles: [] },
    } });
    await expect(nonDirector.getMovie('100')).resolves.toMatchObject({ directors: [] });

    const malformedDirector = requestSession({ '/movie/100': {
      id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
      credits: { crew: [{ job: 'Director' }], cast: [] }, alternative_titles: { titles: [] },
    } });
    await expect(malformedDirector.getMovie('100')).rejects.toMatchObject({ kind: 'malformed' });
  });

  it('requires a directed-movie id only after the Director role is established', async () => {
    const nonDirector = requestSession({
      '/search/person': { results: [{ id: 10, name: 'Stephen Daldry' }] },
      '/person/10/movie_credits': { crew: [{ job: 'Writer' }] },
    });
    await expect(nonDirector.getDirectedMovieCredits('Stephen Daldry')).resolves.toEqual([]);

    const malformedDirector = requestSession({
      '/search/person': { results: [{ id: 10, name: 'Stephen Daldry' }] },
      '/person/10/movie_credits': { crew: [{ job: 'Director' }] },
    });
    await expect(malformedDirector.getDirectedMovieCredits('Stephen Daldry')).rejects.toMatchObject({
      kind: 'malformed',
    });
  });

  it.each([
    ['missing', undefined],
    ['null', null],
    ['empty', ''],
    ['whitespace', '   '],
  ])('keeps movie release_date %s as legitimate unknown year', async (_case, releaseDate) => {
    const movie = {
      id: 100,
      title: 'Billy Elliot',
      original_title: 'Billy Elliot',
      credits: { crew: [], cast: [] },
      alternative_titles: { titles: [] },
      ...(releaseDate !== undefined ? { release_date: releaseDate } : {}),
    };
    const session = requestSession({ '/movie/100': movie });

    await expect(session.getMovie('100')).resolves.toMatchObject({
      releaseYear: null,
    });
  });

  it.each([
    ['object', {}],
    ['number', 2000],
    ['array', []],
    ['invalid string', '2000'],
    ['whitespace-padded date', ' 2000-09-29 '],
    ['invalid month', '2000-13-01'],
    ['invalid day', '2000-02-31'],
  ])('rejects malformed movie release_date when %s', async (_case, releaseDate) => {
    const session = requestSession({ '/movie/100': {
      id: 100,
      title: 'Billy Elliot',
      original_title: 'Billy Elliot',
      release_date: releaseDate,
      credits: { crew: [], cast: [] },
      alternative_titles: { titles: [] },
    } });

    await expect(session.getMovie('100')).rejects.toMatchObject({
      kind: 'malformed',
    });
  });

  it.each([
    ['missing', undefined],
    ['null', null],
    ['empty', ''],
    ['whitespace', '   '],
  ])('keeps director-filmography release_date %s as optional unknown year', async (_case, releaseDate) => {
    const credit = {
      id: 100,
      job: 'Director',
      ...(releaseDate !== undefined ? { release_date: releaseDate } : {}),
    };
    const session = requestSession({
      '/search/person': { results: [{ id: 10, name: 'Stephen Daldry' }] },
      '/person/10/movie_credits': { crew: [credit] },
    });

    await expect(session.getDirectedMovieCredits('Stephen Daldry')).resolves.toEqual([
      { id: '100', releaseYear: null },
    ]);
  });

  it.each([
    ['object', {}],
    ['number', 2000],
    ['array', []],
    ['invalid string', '2000-09'],
    ['whitespace-padded date', ' 2000-09-29 '],
  ])('rejects malformed director-filmography release_date when %s', async (_case, releaseDate) => {
    const session = requestSession({
      '/search/person': { results: [{ id: 10, name: 'Stephen Daldry' }] },
      '/person/10/movie_credits': {
        crew: [{ id: 100, job: 'Director', release_date: releaseDate }],
      },
    });

    await expect(session.getDirectedMovieCredits('Stephen Daldry')).rejects.toMatchObject({
      kind: 'malformed',
    });
  });

  it('parses a valid TMDB release_date year without changing Film year semantics', async () => {
    const session = requestSession({ '/movie/100': {
      id: 100,
      title: 'Billy Elliot',
      original_title: 'Billy Elliot',
      release_date: '2000-09-29',
      credits: { crew: [], cast: [] },
      alternative_titles: { titles: [] },
    } });

    await expect(session.getMovie('100')).resolves.toMatchObject({
      releaseYear: 2000,
    });
  });

  it('accepts legitimate empty required arrays as valid empty evidence', async () => {
    const session = requestSession({
      '/search/movie': { results: [] },
      '/search/tv': { results: [] },
      '/search/person': { results: [] },
      '/movie/100': {
        id: 100, title: 'Billy Elliot', original_title: 'Billy Elliot', release_date: '2000-09-29',
        credits: { crew: [], cast: [] }, alternative_titles: { titles: [] },
      },
      '/tv/200/season/38': { episodes: [] },
      '/tv/200': {
        id: 200, name: 'Neighbours', original_name: 'Neighbours',
        aggregate_credits: { cast: [] }, alternative_titles: { results: [] },
      },
    });

    await expect(session.searchMovieIds('Billy Elliot')).resolves.toEqual([]);
    await expect(session.searchSeriesIds('Neighbours')).resolves.toEqual([]);
    await expect(session.getDirectedMovieCredits('Stephen Daldry')).resolves.toEqual([]);
    await expect(session.getMovie('100')).resolves.toMatchObject({ directors: [], cast: [], alternativeTitles: [] });
    await expect(session.getSeries('200')).resolves.toMatchObject({ cast: [], alternativeTitles: [] });
    await expect(session.seriesHasEpisode('200', 38, 188)).resolves.toBe(false);
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
    const movieDetailUrl = String(fetcher.mock.calls[1]?.[0]);
    expect(movieDetailUrl).toContain('/movie/100');
    expect(movieDetailUrl).toContain('language=en-US');
  });
});
