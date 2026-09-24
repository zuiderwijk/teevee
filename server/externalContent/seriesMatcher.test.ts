import { describe, expect, it, vi } from 'vitest';

import type { ExternalProgramme } from '../epg/provider.ts';
import { matchSeriesIdentity } from './seriesMatcher.ts';
import type {
  TmdbGateway,
  TmdbSeriesIdentityCandidate,
} from './tmdbGateway.ts';

function series(
  overrides: Partial<TmdbSeriesIdentityCandidate> = {},
): TmdbSeriesIdentityCandidate {
  return {
    id: '200',
    name: 'Sullivan\'s Crossing',
    originalName: 'Sullivan\'s Crossing',
    alternativeTitles: [],
    cast: ['Morgan Kohan', 'Chad Michael Murray', 'Scott Patterson', 'Tom Jackson'],
    ...overrides,
  };
}

function gateway(input: {
  searches: Record<string, TmdbSeriesIdentityCandidate[]>;
  episodeExists?: Record<string, boolean>;
}): TmdbGateway {
  const byId = new Map(
    Object.values(input.searches)
      .flat()
      .map((candidate) => [candidate.id, candidate]),
  );
  return {
    searchMovieIds: vi.fn(async () => []),
    getMovie: vi.fn(async () => {
      throw new Error('not used');
    }),
    getDirectedMovieCredits: vi.fn(async () => []),
    searchSeriesIds: vi.fn(async (query) =>
      (input.searches[query] ?? []).map(({ id }) => id),
    ),
    getSeries: vi.fn(async (id) => {
      const candidate = byId.get(id);
      if (!candidate) throw new Error(`missing series ${id}`);
      return candidate;
    }),
    seriesHasEpisode: vi.fn(async (id, season, episode) =>
      input.episodeExists?.[`${id}:${season}:${episode}`] ?? false,
    ),
  };
}

function programme(actors: string[], episode = 'S4 E3'): ExternalProgramme {
  return {
    credits: { director: [], actor: actors, producer: [] },
    episodeNumbers: [{ value: episode }],
  };
}

describe('matchSeriesIdentity', () => {
  it('resolves a full-title unique candidate with cast overlap and coherent S/E evidence', async () => {
    const candidate = series();
    const tmdb = gateway({
      searches: { "Sullivan's Crossing": [candidate] },
      episodeExists: { '200:4:3': true },
    });

    await expect(
      matchSeriesIdentity(
        {
          title: "Sullivan's Crossing",
          programme: programme(['Morgan Kohan']),
        },
        tmdb,
      ),
    ).resolves.toEqual({
      status: 'resolved',
      source: 'tmdb',
      mediaType: 'series',
      externalContentId: '200',
      confidence: 'high',
      matcherVersion: 1,
    });
    expect(tmdb.seriesHasEpisode).toHaveBeenCalledWith('200', 4, 3);
  });

  it('uses actor overlap as required supporting identity evidence', async () => {
    await expect(
      matchSeriesIdentity(
        {
          title: "Sullivan's Crossing",
          programme: programme(['Unrelated Actor']),
        },
        gateway({
          searches: { "Sullivan's Crossing": [series()] },
          episodeExists: { '200:4:3': true },
        }),
      ),
    ).resolves.toEqual({
      status: 'unresolved',
      reason: 'no-qualifying-candidate',
    });
  });

  it('keeps a strong unique Series identity when provider episode numbering disagrees in the proven base-title fallback', async () => {
    const neighbours = series({
      id: '300',
      name: 'Neighbours',
      originalName: 'Neighbours',
      cast: ['Alan Fletcher', 'Stefan Dennis', 'Jackie Woodburne', 'Ryan Moloney'],
    });
    const tmdb = gateway({
      searches: {
        'Neighbours: A New Chapter': [neighbours],
        Neighbours: [neighbours],
      },
      episodeExists: { '300:38:188': false },
    });

    await expect(
      matchSeriesIdentity(
        {
          title: 'Neighbours: A New Chapter',
          programme: programme(
            ['Alan Fletcher', 'Stefan Dennis', 'Jackie Woodburne', 'Ryan Moloney'],
            'S38 E188',
          ),
        },
        tmdb,
      ),
    ).resolves.toMatchObject({
      status: 'resolved',
      externalContentId: '300',
      mediaType: 'series',
    });
  });

  it('uses base-title fallback only with strengthened people evidence and coherent S/E', async () => {
    const candidate = series({
      id: '400',
      name: 'The First Years',
      originalName: 'The First Years',
      cast: ['Actor Een', 'Actor Twee'],
    });
    await expect(
      matchSeriesIdentity(
        {
          title: 'First Years: Nieuwe start',
          programme: programme(['Actor Een', 'Actor Twee'], 'S2 E5'),
        },
        gateway({
          searches: {
            'First Years: Nieuwe start': [],
            'First Years': [candidate],
          },
          episodeExists: { '400:2:5': true },
        }),
      ),
    ).resolves.toMatchObject({
      status: 'resolved',
      externalContentId: '400',
    });
  });

  it('fails closed when people evidence is absent', async () => {
    const tmdb = gateway({
      searches: { "Sullivan's Crossing": [series()] },
      episodeExists: { '200:4:3': true },
    });
    await expect(
      matchSeriesIdentity(
        {
          title: "Sullivan's Crossing",
          programme: programme([]),
        },
        tmdb,
      ),
    ).resolves.toEqual({
      status: 'unresolved',
      reason: 'insufficient-people-evidence',
    });
    expect(tmdb.searchSeriesIds).not.toHaveBeenCalled();
  });

  it('returns ambiguous when multiple full-title candidates qualify', async () => {
    await expect(
      matchSeriesIdentity(
        {
          title: "Sullivan's Crossing",
          programme: programme(['Morgan Kohan']),
        },
        gateway({
          searches: {
            "Sullivan's Crossing": [
              series({ id: '200' }),
              series({ id: '201' }),
            ],
          },
          episodeExists: {
            '200:4:3': true,
            '201:4:3': true,
          },
        }),
      ),
    ).resolves.toEqual({ status: 'ambiguous' });
  });

  it('never produces a TMDB episode identity', async () => {
    const result = await matchSeriesIdentity(
      {
        title: "Sullivan's Crossing",
        programme: programme(['Morgan Kohan']),
      },
      gateway({
        searches: { "Sullivan's Crossing": [series()] },
        episodeExists: { '200:4:3': true },
      }),
    );

    expect(result).toEqual({
      status: 'resolved',
      source: 'tmdb',
      mediaType: 'series',
      externalContentId: '200',
      confidence: 'high',
      matcherVersion: 1,
    });
    expect(result).not.toHaveProperty('episodeId');
  });
});
