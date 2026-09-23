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

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function id(value: unknown): string {
  return Number.isInteger(value) && (value as number) > 0 ? String(value) : '';
}

function year(value: unknown): number | null {
  const match = text(value).match(/^(\d{4})-/);
  return match ? Number(match[1]) : null;
}

function names(values: unknown): string[] {
  return array(values)
    .map((value) => text(record(value, 'person').name))
    .filter(Boolean);
}

function alternativeMovieTitles(value: unknown): string[] {
  const container = record(value ?? {}, 'movie alternative titles');
  return array(container.titles)
    .map((item) => text(record(item, 'movie alternative title').title))
    .filter(Boolean);
}

function alternativeSeriesTitles(value: unknown): string[] {
  const container = record(value ?? {}, 'series alternative titles');
  return array(container.results)
    .map((item) => text(record(item, 'series alternative title').title))
    .filter(Boolean);
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
    return array(record(payload, 'movie search').results)
      .map((item) => id(record(item, 'movie search result').id))
      .filter(Boolean)
      .slice(0, SEARCH_RESULT_LIMIT);
  }

  async getMovie(movieId: string): Promise<TmdbMovieIdentityCandidate> {
    const payload = await this.cached(
      `movie:${movieId}`,
      () => this.client.getJson(`/3/movie/${encodeURIComponent(movieId)}`, {
        language: 'nl-NL',
        append_to_response: 'credits,alternative_titles',
      }),
    );
    const movie = record(payload, 'movie');
    const credits = record(movie.credits ?? {}, 'movie credits');
    const directors = array(credits.crew)
      .map((item) => record(item, 'movie crew'))
      .filter((item) => text(item.job).toLocaleLowerCase('en-US') === 'director')
      .map((item) => text(item.name))
      .filter(Boolean);

    const candidateId = id(movie.id);
    if (!candidateId) throw new TmdbRequestError('malformed', 'TMDB movie id is invalid');

    return {
      id: candidateId,
      title: text(movie.title),
      originalTitle: text(movie.original_title),
      alternativeTitles: alternativeMovieTitles(movie.alternative_titles),
      releaseYear: year(movie.release_date),
      directors,
      cast: names(credits.cast),
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
    const people = array(record(search, 'person search').results)
      .map((item) => record(item, 'person search result'))
      .filter((item) => normaliseIdentityText(text(item.name)) === target)
      .slice(0, PERSON_RESULT_LIMIT);

    const result = new Map<string, TmdbDirectedMovieCredit>();
    for (const person of people) {
      const personId = id(person.id);
      if (!personId) continue;
      const creditsPayload = await this.cached(
        `person-movie-credits:${personId}`,
        () => this.client.getJson(
          `/3/person/${encodeURIComponent(personId)}/movie_credits`,
          { language: 'nl-NL' },
        ),
      );
      const credits = record(creditsPayload, 'person movie credits');
      for (const item of array(credits.crew).map((entry) => record(entry, 'person movie crew'))) {
        if (text(item.job).toLocaleLowerCase('en-US') !== 'director') continue;
        const movieId = id(item.id);
        if (!movieId) continue;
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
    return array(record(payload, 'series search').results)
      .map((item) => id(record(item, 'series search result').id))
      .filter(Boolean)
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
    const credits = record(series.aggregate_credits ?? {}, 'series aggregate credits');
    const candidateId = id(series.id);
    if (!candidateId) throw new TmdbRequestError('malformed', 'TMDB series id is invalid');

    return {
      id: candidateId,
      name: text(series.name),
      originalName: text(series.original_name),
      alternativeTitles: alternativeSeriesTitles(series.alternative_titles),
      cast: names(credits.cast),
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

    return array(record(payload, 'series season').episodes).some((item) => {
      const episode = record(item, 'series episode');
      return episode.episode_number === episodeNumber;
    });
  }
}
