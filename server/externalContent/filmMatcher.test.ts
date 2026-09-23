import { describe, expect, it, vi } from 'vitest';

import type { ExternalProgramme } from '../epg/provider.ts';
import { matchFilmIdentity } from './filmMatcher.ts';
import type {
  TmdbGateway,
  TmdbMovieIdentityCandidate,
} from './tmdbGateway.ts';

function movie(
  overrides: Partial<TmdbMovieIdentityCandidate> = {},
): TmdbMovieIdentityCandidate {
  return {
    id: '100',
    title: 'Billy Elliot',
    originalTitle: 'Billy Elliot',
    alternativeTitles: [],
    releaseYear: 2000,
    directors: ['Stephen Daldry'],
    cast: ['Jamie Bell', 'Julie Walters'],
    ...overrides,
  };
}

function gateway(input: {
  direct?: TmdbMovieIdentityCandidate[];
  directedIds?: string[];
  extra?: TmdbMovieIdentityCandidate[];
} = {}): TmdbGateway {
  const candidates = [...(input.direct ?? []), ...(input.extra ?? [])];
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  return {
    searchMovieIds: vi.fn(async () => (input.direct ?? []).map(({ id }) => id)),
    getMovie: vi.fn(async (id) => {
      const candidate = byId.get(id);
      if (!candidate) throw new Error(`missing movie ${id}`);
      return candidate;
    }),
    getDirectedMovieCredits: vi.fn(async () =>
      (input.directedIds ?? []).map((id) => ({
        id,
        releaseYear: byId.get(id)?.releaseYear ?? null,
      })),
    ),
    searchSeriesIds: vi.fn(async () => []),
    getSeries: vi.fn(async () => {
      throw new Error('not used');
    }),
    seriesHasEpisode: vi.fn(async () => false),
  };
}

function filmProgramme(overrides: Partial<ExternalProgramme> = {}): ExternalProgramme {
  return {
    productionDate: { raw: '2000', year: 2000 },
    credits: {
      director: ['Stephen Daldry'],
      actor: ['Jamie Bell', 'Julie Walters'],
      producer: [],
    },
    ...overrides,
  };
}

describe('matchFilmIdentity', () => {
  it('resolves an exact title/year/director unique candidate', async () => {
    await expect(
      matchFilmIdentity(
        { title: 'Billy Elliot', programme: filmProgramme() },
        gateway({ direct: [movie()] }),
      ),
    ).resolves.toEqual({
      status: 'resolved',
      source: 'tmdb',
      mediaType: 'film',
      externalContentId: '100',
      confidence: 'high',
      matcherVersion: 1,
    });
  });

  it('accepts a +1 release year when title and people evidence remain strong', async () => {
    const candidate = movie({ releaseYear: 2001 });
    await expect(
      matchFilmIdentity(
        { title: 'Billy Elliot', programme: filmProgramme() },
        gateway({ direct: [candidate] }),
      ),
    ).resolves.toMatchObject({ status: 'resolved', externalContentId: '100' });
  });

  it('requires stronger cast evidence for an alternative/localized-title-only match', async () => {
    const candidate = movie({
      title: 'Original Title',
      originalTitle: 'Original Title',
      alternativeTitles: ['De leerling'],
      cast: ['Actor Een', 'Actor Twee'],
    });
    const programme = filmProgramme({
      credits: {
        director: ['Stephen Daldry'],
        actor: ['Actor Een', 'Actor Twee'],
        producer: [],
      },
    });

    await expect(
      matchFilmIdentity(
        { title: 'De leerling', programme },
        gateway({ direct: [candidate] }),
      ),
    ).resolves.toMatchObject({ status: 'resolved', externalContentId: '100' });
  });

  it('rejects title+year without director evidence', async () => {
    const tmdb = gateway({ direct: [movie()] });
    await expect(
      matchFilmIdentity(
        {
          title: 'Billy Elliot',
          programme: filmProgramme({
            credits: { director: [], actor: ['Jamie Bell'], producer: [] },
          }),
        },
        tmdb,
      ),
    ).resolves.toEqual({
      status: 'unresolved',
      reason: 'missing-required-evidence',
    });
    expect(tmdb.searchMovieIds).not.toHaveBeenCalled();
  });

  it('rejects a wrong director even when title and year match', async () => {
    await expect(
      matchFilmIdentity(
        { title: 'Billy Elliot', programme: filmProgramme() },
        gateway({ direct: [movie({ directors: ['Someone Else'] })] }),
      ),
    ).resolves.toEqual({
      status: 'unresolved',
      reason: 'no-qualifying-candidate',
    });
  });

  it('returns ambiguous when multiple candidates qualify', async () => {
    await expect(
      matchFilmIdentity(
        { title: 'Billy Elliot', programme: filmProgramme() },
        gateway({
          direct: [
            movie({ id: '100' }),
            movie({ id: '101', releaseYear: 1999 }),
          ],
        }),
      ),
    ).resolves.toEqual({ status: 'ambiguous' });
  });

  it('fails closed when the production year is missing', async () => {
    await expect(
      matchFilmIdentity(
        {
          title: 'Billy Elliot',
          programme: filmProgramme({ productionDate: { raw: 'unknown' } }),
        },
        gateway({ direct: [movie()] }),
      ),
    ).resolves.toEqual({
      status: 'unresolved',
      reason: 'missing-required-evidence',
    });
  });

  it('uses a bounded director-filmography fallback only after direct search has no qualifying candidate', async () => {
    const fallback = movie({ id: '222', alternativeTitles: ['Enough!'] });
    const tmdb = gateway({
      direct: [],
      directedIds: ['222'],
      extra: [fallback],
    });

    await expect(
      matchFilmIdentity(
        {
          title: 'Enough!',
          programme: filmProgramme(),
        },
        tmdb,
      ),
    ).resolves.toMatchObject({
      status: 'resolved',
      externalContentId: '222',
    });
    expect(tmdb.getDirectedMovieCredits).toHaveBeenCalledTimes(1);
  });
});
