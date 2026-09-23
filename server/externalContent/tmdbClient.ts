import { normaliseIdentityText } from './titleIdentity.ts';
import type {
  TmdbDirectedMovieCredit,
  TmdbGateway,
  TmdbMovieIdentityCandidate,
  TmdbSeriesIdentityCandidate,
} from './tmdbGateway.ts';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const SEARCH_RESULT_LIMIT = 8;
const PERSON_RESULT_LIMIT = 3;

export type TmdbFailureKind =
  | 'timeout'
  | 'rate-limited'
  | 'server'
  | 'client'
  | 'network'
  | 'malformed';

export class TmdbRequestError extends Error {
  constructor(
    readonly kind: TmdbFailureKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'TmdbRequestError';
  }
}

export type TmdbApiClientOptions = {
  token: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  maxRetryAfterMs?: number;
  sleep?: (ms: number) => Promise<void>;
  signal?: AbortSignal;
};

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} must not be empty`);
  return trimmed;
}

function retryAfterMs(response: Response): number | null {
  const value = response.headers.get('retry-after')?.trim();
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);

  const date = Date.parse(value);
  if (!Number.isFinite(date)) return null;
  return Math.max(0, date - Date.now());
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

export class TmdbApiClient {
  private readonly token: string;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly maxRetryAfterMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly signal: AbortSignal | undefined;

  constructor(options: TmdbApiClientOptions) {
    this.token = required(options.token, 'TMDB token');
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 2500;
    this.maxRetries = options.maxRetries ?? 1;
    this.maxRetryAfterMs = options.maxRetryAfterMs ?? 1000;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.signal = options.signal;

    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new Error('TMDB timeoutMs must be positive');
    }
    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0 || this.maxRetries > 2) {
      throw new Error('TMDB maxRetries must be an integer between 0 and 2');
    }
  }

  async getJson(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const url = new URL(path, TMDB_BASE_URL);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    let lastFailure: TmdbRequestError | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      if (this.signal?.aborted) {
        throw new TmdbRequestError('network', 'TMDB request was cancelled');
      }

      const controller = new AbortController();
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, this.timeoutMs);
      const cancelFromOwner = () => controller.abort();
      this.signal?.addEventListener('abort', cancelFromOwner, { once: true });

      let response: Response;
      try {
        response = await this.fetcher(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timeout);
        this.signal?.removeEventListener('abort', cancelFromOwner);

        const failure = timedOut
          ? new TmdbRequestError('timeout', 'TMDB request timed out')
          : isAbortError(error) && this.signal?.aborted
            ? new TmdbRequestError('network', 'TMDB request was cancelled')
            : new TmdbRequestError('network', 'TMDB network request failed');
        lastFailure = failure;

        if (this.signal?.aborted || attempt >= this.maxRetries) throw failure;
        await this.sleep(150 * (attempt + 1));
        continue;
      }

      clearTimeout(timeout);
      this.signal?.removeEventListener('abort', cancelFromOwner);

      if (response.status === 429) {
        const wait = retryAfterMs(response) ?? 250;
        const failure = new TmdbRequestError(
          'rate-limited',
          'TMDB rate limit exceeded',
          response.status,
        );
        lastFailure = failure;
        if (attempt >= this.maxRetries || wait > this.maxRetryAfterMs) throw failure;
        await this.sleep(wait);
        continue;
      }

      if (response.status >= 500) {
        const failure = new TmdbRequestError(
          'server',
          `TMDB server request failed with HTTP ${response.status}`,
          response.status,
        );
        lastFailure = failure;
        if (attempt >= this.maxRetries) throw failure;
        await this.sleep(150 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        throw new TmdbRequestError(
          'client',
          `TMDB request failed with HTTP ${response.status}`,
          response.status,
        );
      }

      try {
        return await response.json();
      } catch {
        throw new TmdbRequestError('malformed', 'TMDB returned malformed JSON');
      }
    }

    throw lastFailure ?? new TmdbRequestError('network', 'TMDB request failed');
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TmdbRequestError('malformed', `TMDB ${label} payload is invalid`);
  }
  return value as Record<string, unknown>;
}

function requiredArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new TmdbRequestError('malformed', `TMDB ${label} payload is invalid`);
  }
  return value;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value: unknown, label: string): string {
  const result = text(value);
  if (!result) {
    throw new TmdbRequestError('malformed', `TMDB ${label} payload is invalid`);
  }
  return result;
}

function requiredId(value: unknown, label: string): string {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new TmdbRequestError('malformed', `TMDB ${label} payload is invalid`);
  }
  return String(value);
}

function requiredNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new TmdbRequestError('malformed', `TMDB ${label} payload is invalid`);
  }
  return value as number;
}

function year(value: unknown): number | null {
  const match = text(value).match(/^(\d{4})-/);
  return match ? Number(match[1]) : null;
}

function names(values: unknown, label: string): string[] {
  return requiredArray(values, label).map((value) =>
    requiredText(record(value, 'person').name, `${label} person name`),
  );
}

function alternativeMovieTitles(value: unknown): string[] {
  const container = record(value, 'movie alternative titles');
  return requiredArray(container.titles, 'movie alternative titles').map((item) =>
    requiredText(record(item, 'movie alternative title').title, 'movie alternative title'),
  );
}

function alternativeSeriesTitles(value: unknown): string[] {
  const container = record(value, 'series alternative titles');
  return requiredArray(container.results, 'series alternative titles').map((item) =>
    requiredText(record(item, 'series alternative title').title, 'series alternative title'),
  );
}

export class TmdbRequestSession implements TmdbGateway {
  private readonly cache = new Map<string, Promise<unknown>>();

  constructor(private readonly client: TmdbApiClient) {}

  private cached(key: string, load: () => Promise<unknown>): Promise<unknown> {
    const existing = this.cache.get(key);
    if (existing) return existing;
    const promise = load();
    this.cache.set(key, promise);
    return promise;
  }

  async searchMovieIds(query: string): Promise<string[]> {
    const normalizedQuery = query.trim();
    const payload = await this.cached(
      `movie-search:${normalizedQuery}`,
      () => this.client.getJson('/3/search/movie', {
        query: normalizedQuery,
        language: 'nl-NL',
        include_adult: 'false',
        page: '1',
      }),
    );
    return requiredArray(record(payload, 'movie search').results, 'movie search results')
      .map((item) =>
        requiredId(record(item, 'movie search result').id, 'movie search result id'),
      )
      .slice(0, SEARCH_RESULT_LIMIT);
  }

  async getMovie(movieId: string): Promise<TmdbMovieIdentityCandidate> {
    const payload = await this.cached(
      `movie:${movieId}`,
      // Keep the candidate primary title language-stable. Localized Dutch provider
      // titles are still discoverable through search and alternative_titles, but then
      // intentionally enter the stricter localized-title evidence path in filmMatcher.
      () => this.client.getJson(`/3/movie/${encodeURIComponent(movieId)}`, {
        language: 'en-US',
        append_to_response: 'credits,alternative_titles',
      }),
    );
    const movie = record(payload, 'movie');
    const credits = record(movie.credits, 'movie credits');
    const directors: string[] = [];
    for (const item of requiredArray(credits.crew, 'movie credits crew')) {
      const crew = record(item, 'movie crew');
      const job = requiredText(crew.job, 'movie crew job');
      if (job.toLocaleLowerCase('en-US') !== 'director') continue;
      directors.push(requiredText(crew.name, 'movie director name'));
    }

    const candidateId = requiredId(movie.id, 'movie id');

    return {
      id: candidateId,
      title: requiredText(movie.title, 'movie title'),
      originalTitle: requiredText(movie.original_title, 'movie original title'),
      alternativeTitles: alternativeMovieTitles(movie.alternative_titles),
      releaseYear: year(movie.release_date),
      directors,
      cast: names(credits.cast, 'movie credits cast'),
    };
  }

  async getDirectedMovieCredits(directorName: string): Promise<TmdbDirectedMovieCredit[]> {
    const normalizedName = directorName.trim();
    const search = await this.cached(
      `person-search:${normalizedName}`,
      () => this.client.getJson('/3/search/person', {
        query: normalizedName,
        language: 'nl-NL',
        include_adult: 'false',
        page: '1',
      }),
    );

    const target = normaliseIdentityText(normalizedName);
    const people = requiredArray(record(search, 'person search').results, 'person search results')
      .map((item) => {
        const person = record(item, 'person search result');
        return {
          id: requiredId(person.id, 'person search result id'),
          name: requiredText(person.name, 'person search result name'),
        };
      })
      .filter((item) => normaliseIdentityText(item.name) === target)
      .slice(0, PERSON_RESULT_LIMIT);

    const result = new Map<string, TmdbDirectedMovieCredit>();
    for (const person of people) {
      const personId = person.id;
      const creditsPayload = await this.cached(
        `person-movie-credits:${personId}`,
        () => this.client.getJson(
          `/3/person/${encodeURIComponent(personId)}/movie_credits`,
          { language: 'nl-NL' },
        ),
      );
      const credits = record(creditsPayload, 'person movie credits');
      for (const entry of requiredArray(credits.crew, 'person movie credits crew')) {
        const item = record(entry, 'person movie crew');
        const job = requiredText(item.job, 'person movie crew job');
        if (job.toLocaleLowerCase('en-US') !== 'director') continue;
        const movieId = requiredId(item.id, 'person directed movie id');
        result.set(movieId, {
          id: movieId,
          releaseYear: year(item.release_date),
        });
      }
    }

    return [...result.values()].sort((left, right) => Number(left.id) - Number(right.id));
  }

  async searchSeriesIds(query: string): Promise<string[]> {
    const normalizedQuery = query.trim();
    const payload = await this.cached(
      `series-search:${normalizedQuery}`,
      () => this.client.getJson('/3/search/tv', {
        query: normalizedQuery,
        language: 'nl-NL',
        include_adult: 'false',
        page: '1',
      }),
    );
    return requiredArray(record(payload, 'series search').results, 'series search results')
      .map((item) =>
        requiredId(record(item, 'series search result').id, 'series search result id'),
      )
      .slice(0, SEARCH_RESULT_LIMIT);
  }

  async getSeries(seriesId: string): Promise<TmdbSeriesIdentityCandidate> {
    const payload = await this.cached(
      `series:${seriesId}`,
      () => this.client.getJson(`/3/tv/${encodeURIComponent(seriesId)}`, {
        language: 'nl-NL',
        append_to_response: 'aggregate_credits,alternative_titles',
      }),
    );
    const series = record(payload, 'series');
    const credits = record(series.aggregate_credits, 'series aggregate credits');
    const candidateId = requiredId(series.id, 'series id');

    return {
      id: candidateId,
      name: requiredText(series.name, 'series name'),
      originalName: requiredText(series.original_name, 'series original name'),
      alternativeTitles: alternativeSeriesTitles(series.alternative_titles),
      cast: names(credits.cast, 'series aggregate credits cast'),
    };
  }

  async seriesHasEpisode(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number,
  ): Promise<boolean> {
    let payload: unknown;
    try {
      payload = await this.cached(
        `series-season:${seriesId}:${seasonNumber}`,
        () => this.client.getJson(
          `/3/tv/${encodeURIComponent(seriesId)}/season/${seasonNumber}`,
          { language: 'nl-NL' },
        ),
      );
    } catch (error) {
      if (
        error instanceof TmdbRequestError &&
        error.kind === 'client' &&
        error.status === 404
      ) {
        return false;
      }
      throw error;
    }

    return requiredArray(
      record(payload, 'series season').episodes,
      'series season episodes',
    ).some((item) => {
      const episode = record(item, 'series episode');
      return (
        requiredNonNegativeInteger(
          episode.episode_number,
          'series episode number',
        ) === episodeNumber
      );
    });
  }
}
