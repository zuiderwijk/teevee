import type { ExternalProgramme } from '../epg/provider.ts';
import {
  EXTERNAL_CONTENT_MATCHER_VERSION,
  type ExternalContentMatchDecision,
} from './types.ts';
import type {
  TmdbGateway,
  TmdbMovieIdentityCandidate,
} from './tmdbGateway.ts';
import {
  conservativeTitleIdentity,
  peopleOverlap,
} from './titleIdentity.ts';

const DIRECT_SEARCH_CANDIDATE_LIMIT = 5;
const FALLBACK_DIRECTOR_LIMIT = 2;
const FALLBACK_MOVIE_LIMIT = 3;

export type FilmIdentityInput = {
  title: string;
  programme: ExternalProgramme;
};

function movieYearMatches(providerYear: number, candidateYear: number | null): boolean {
  return candidateYear !== null && Math.abs(providerYear - candidateYear) <= 1;
}

function qualifyingMovie(
  input: FilmIdentityInput,
  movie: TmdbMovieIdentityCandidate,
): boolean {
  const year = input.programme.productionDate?.year;
  const directors = input.programme.credits?.director ?? [];
  if (year === undefined || directors.length === 0) return false;
  if (!movieYearMatches(year, movie.releaseYear)) return false;
  if (peopleOverlap(directors, movie.directors) < 1) return false;

  const primaryIdentity = conservativeTitleIdentity(input.title, [
    movie.title,
    movie.originalTitle,
  ]);
  if (primaryIdentity) return true;

  const alternativeIdentity = conservativeTitleIdentity(
    input.title,
    movie.alternativeTitles,
  );
  if (!alternativeIdentity) return false;

  return peopleOverlap(input.programme.credits?.actor ?? [], movie.cast) >= 2;
}

async function qualifyingMovies(
  input: FilmIdentityInput,
  ids: readonly string[],
  gateway: TmdbGateway,
): Promise<TmdbMovieIdentityCandidate[]> {
  const qualifying: TmdbMovieIdentityCandidate[] = [];
  const unique = [...new Set(ids)].slice(0, DIRECT_SEARCH_CANDIDATE_LIMIT);
  for (const id of unique) {
    const movie = await gateway.getMovie(id);
    if (qualifyingMovie(input, movie)) qualifying.push(movie);
  }
  return qualifying;
}

function decisionFor(
  candidates: readonly TmdbMovieIdentityCandidate[],
): ExternalContentMatchDecision | null {
  if (candidates.length > 1) return { status: 'ambiguous' };
  const candidate = candidates[0];
  if (!candidate) return null;
  return {
    status: 'resolved',
    source: 'tmdb',
    mediaType: 'film',
    externalContentId: candidate.id,
    confidence: 'high',
    matcherVersion: EXTERNAL_CONTENT_MATCHER_VERSION,
  };
}

export async function matchFilmIdentity(
  input: FilmIdentityInput,
  gateway: TmdbGateway,
): Promise<ExternalContentMatchDecision> {
  const year = input.programme.productionDate?.year;
  const directors = input.programme.credits?.director ?? [];
  if (year === undefined || directors.length === 0) {
    return { status: 'unresolved', reason: 'missing-required-evidence' };
  }

  const direct = await qualifyingMovies(
    input,
    await gateway.searchMovieIds(input.title),
    gateway,
  );
  const directDecision = decisionFor(direct);
  if (directDecision) return directDecision;

  const fallbackIds = new Set<string>();
  for (const director of directors.slice(0, FALLBACK_DIRECTOR_LIMIT)) {
    const credits = await gateway.getDirectedMovieCredits(director);
    for (const credit of credits) {
      if (movieYearMatches(year, credit.releaseYear)) {
        fallbackIds.add(credit.id);
        if (fallbackIds.size >= FALLBACK_MOVIE_LIMIT) break;
      }
    }
    if (fallbackIds.size >= FALLBACK_MOVIE_LIMIT) break;
  }

  const fallback = await qualifyingMovies(
    input,
    [...fallbackIds].slice(0, FALLBACK_MOVIE_LIMIT),
    gateway,
  );
  const fallbackDecision = decisionFor(fallback);
  if (fallbackDecision) return fallbackDecision;

  return { status: 'unresolved', reason: 'no-qualifying-candidate' };
}
