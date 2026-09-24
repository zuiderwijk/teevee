import { describe, expect, it, vi } from 'vitest';

import type { Channel, Programme } from '../../data/domain/epg.ts';
import type { ProgrammeClassification } from '../../data/domain/programmeClassification.ts';
import { InMemoryScheduleRepository } from '../epg/inMemoryScheduleRepository.ts';
import { ingestProviderSchedule, type StoredProviderScheduleObservation } from '../epg/ingest.ts';
import type { NormalisedProgrammeObservation } from '../epg/normalise.ts';
import type { EpgProvider } from '../epg/provider.ts';
import { enrichStoredExternalContent } from './enrichment.ts';
import {
  TmdbApiClient,
  TmdbRequestError,
  TmdbRequestSession,
} from './tmdbClient.ts';
import type { ProgrammeExternalContentRepository } from './externalContentRepository.ts';
import type { TmdbGateway } from './tmdbGateway.ts';

const channel: Channel = {
  id: 'channel-1',
  name: 'Een',
  displayName: 'Een',
  sortOrder: 0,
  isActive: true,
};

const filmClassification: ProgrammeClassification = {
  programmeId: 'placeholder',
  contentType: 'film',
  seriesType: 'unknown',
  audience: 'unknown',
  sportType: 'unknown',
  liveStatus: 'unknown',
  repeatStatus: 'unknown',
  confidence: 'high',
};

function filmObservation(
  id: string,
  startAt: string,
  endAt: string,
): NormalisedProgrammeObservation {
  const programme: Programme = {
    id,
    channelId: channel.id,
    startAt,
    endAt,
    title: 'Billy Elliot',
    genre: 'Film',
  };
  return {
    programme,
    classification: { ...filmClassification, programmeId: id },
    externalProgramme: {
      title: 'Billy Elliot',
      productionDate: { raw: '2000', year: 2000 },
      credits: {
        director: ['Stephen Daldry'],
        actor: ['Jamie Bell', 'Julie Walters'],
        producer: [],
      },
      categories: ['Film'],
    },
  };
}

function tmdbGateway(): TmdbGateway {
  return {
    searchMovieIds: vi.fn(async () => ['100']),
    getMovie: vi.fn(async () => ({
      id: '100',
      title: 'Billy Elliot',
      originalTitle: 'Billy Elliot',
      alternativeTitles: [],
      releaseYear: 2000,
      directors: ['Stephen Daldry'],
      cast: ['Jamie Bell', 'Julie Walters'],
    })),
    getDirectedMovieCredits: vi.fn(async () => []),
    searchSeriesIds: vi.fn(async () => []),
    getSeries: vi.fn(async () => {
      throw new Error('not used');
    }),
    seriesHasEpisode: vi.fn(async () => false),
  };
}

function captureRepository() {
  const writes: Parameters<ProgrammeExternalContentRepository['applyDecisions']>[0][] = [];
  const repository: ProgrammeExternalContentRepository = {
    applyDecisions: vi.fn(async (input: Parameters<ProgrammeExternalContentRepository['applyDecisions']>[0]) => {
      writes.push(input);
      return {
        decisionCount: input.decisions.length,
        resolvedReferenceCount: input.decisions.filter(
          ({ decision }) => decision.status === 'resolved',
        ).length,
        clearedReferenceCount: 0,
        ignoredStaleCount: 0,
      };
    }),
  };
  return { repository, writes };
}

describe('external content enrichment lifecycle', () => {
  it('deduplicates identical identity work while allowing repeated broadcasts to share one TMDB identity', async () => {
    const stored: StoredProviderScheduleObservation = {
      from: '2026-09-24T16:00:00.000Z',
      to: '2026-09-25T02:00:00.000Z',
      observedAt: '2026-09-24T10:00:00.000Z',
      channelIds: [channel.id],
      programmes: [
        filmObservation('programme-1', '2026-09-24T18:00:00.000Z', '2026-09-24T20:00:00.000Z'),
        filmObservation('programme-2', '2026-09-24T20:00:00.000Z', '2026-09-24T22:00:00.000Z'),
      ],
    };
    const tmdb = tmdbGateway();
    const { repository, writes } = captureRepository();

    const result = await enrichStoredExternalContent({
      observations: [stored],
      gateway: tmdb,
      repository,
      clock: () => new Date('2026-09-24T10:00:05.000Z'),
    });

    expect(result).toMatchObject({
      eligibleProgrammeCount: 2,
      uniqueIdentityWorkCount: 1,
      resolvedCount: 2,
      providerFailureCount: 0,
      persistedReferenceCount: 2,
    });
    expect(tmdb.searchMovieIds).toHaveBeenCalledTimes(1);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.decisions.map(({ decision }) =>
      decision.status === 'resolved' ? decision.externalContentId : null,
    )).toEqual(['100', '100']);
  });

  it.each([
    ['timeout', new TmdbRequestError('timeout', 'TMDB request timed out')],
    ['429', new TmdbRequestError('rate-limited', 'TMDB rate limit exceeded', 429)],
    ['5xx', new TmdbRequestError('server', 'TMDB server unavailable', 503)],
    ['malformed', new TmdbRequestError('malformed', 'TMDB required collection is invalid')],
  ])('keeps a stored canonical Guide write usable after TMDB %s failure', async (_kind, failure) => {
    const repository = new InMemoryScheduleRepository();
    const provider: EpgProvider = {
      key: 'development-xmltv',
      getChannels: vi.fn(async () => []),
      getSchedule: vi.fn(async () => ({
        coverage: 'complete' as const,
        programmes: [{
          channelId: 'raw-one',
          startAt: '2026-09-24T18:00:00.000Z',
          endAt: '2026-09-24T20:00:00.000Z',
          title: 'Billy Elliot',
          categories: ['Film'],
          genre: 'Film',
          productionDate: { raw: '2000', year: 2000 },
          credits: {
            director: ['Stephen Daldry'],
            actor: ['Jamie Bell'],
            producer: [],
          },
          hasDirectorCredit: true,
        }],
      })),
    };

    const ingest = await ingestProviderSchedule({
      provider,
      repository,
      canonicalChannels: [channel],
      channelMappings: [{ providerChannelId: 'raw-one', channelId: channel.id }],
      providerChannelIds: ['raw-one'],
      from: new Date('2026-09-24T18:00:00.000Z'),
      to: new Date('2026-09-24T20:00:00.000Z'),
      clock: () => new Date('2026-09-24T10:00:00.000Z'),
    });
    expect(ingest.write.status).toBe('stored');
    expect(ingest.storedObservation).not.toBeNull();

    const failingGateway: TmdbGateway = {
      ...tmdbGateway(),
      searchMovieIds: vi.fn(async () => {
        throw failure;
      }),
    };
    const externalRepository = captureRepository();

    const enrichment = await enrichStoredExternalContent({
      observations: [ingest.storedObservation!],
      gateway: failingGateway,
      repository: externalRepository.repository,
    });

    expect(enrichment.providerFailureCount).toBe(1);
    expect(externalRepository.writes).toHaveLength(0);
    expect(externalRepository.repository.applyDecisions).not.toHaveBeenCalled();
    await expect(repository.getSchedule({
      from: '2026-09-24T18:00:00.000Z',
      to: '2026-09-24T20:00:00.000Z',
      channelIds: [channel.id],
    })).resolves.toMatchObject({
      programmes: [expect.objectContaining({ title: 'Billy Elliot' })],
    });
  });

  it('treats malformed TMDB array elements as provider failure with no negative persistence write', async () => {
    const stored: StoredProviderScheduleObservation = {
      from: '2026-09-24T16:00:00.000Z',
      to: '2026-09-25T02:00:00.000Z',
      observedAt: '2026-09-24T10:00:00.000Z',
      channelIds: [channel.id],
      programmes: [
        filmObservation(
          'programme-1',
          '2026-09-24T18:00:00.000Z',
          '2026-09-24T20:00:00.000Z',
        ),
      ],
    };
    const fetcher = vi.fn(async (url: URL | RequestInfo) => {
      if (String(url).includes('/search/movie')) {
        return new Response(JSON.stringify({ results: [{}] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected URL ${String(url)}`);
    });
    const gateway = new TmdbRequestSession(
      new TmdbApiClient({ token: 'secret', fetcher, maxRetries: 0 }),
    );
    const capture = captureRepository();

    const result = await enrichStoredExternalContent({
      observations: [stored],
      gateway,
      repository: capture.repository,
    });

    expect(result).toMatchObject({
      providerFailureCount: 1,
      resolvedCount: 0,
      unresolvedCount: 0,
      ambiguousCount: 0,
      persistedReferenceCount: 0,
      clearedReferenceCount: 0,
    });
    expect(capture.repository.applyDecisions).not.toHaveBeenCalled();
    expect(capture.writes).toHaveLength(0);
  });

  it('treats malformed TMDB release_date as provider failure with no negative persistence write', async () => {
    const stored: StoredProviderScheduleObservation = {
      from: '2026-09-24T16:00:00.000Z',
      to: '2026-09-25T02:00:00.000Z',
      observedAt: '2026-09-24T10:00:00.000Z',
      channelIds: [channel.id],
      programmes: [
        filmObservation(
          'programme-1',
          '2026-09-24T18:00:00.000Z',
          '2026-09-24T20:00:00.000Z',
        ),
      ],
    };
    const fetcher = vi.fn(async (url: URL | RequestInfo) => {
      const value = String(url);
      if (value.includes('/search/movie')) {
        return new Response(JSON.stringify({ results: [{ id: 100 }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (value.includes('/movie/100')) {
        return new Response(JSON.stringify({
          id: 100,
          title: 'Billy Elliot',
          original_title: 'Billy Elliot',
          release_date: {},
          credits: {
            crew: [{ job: 'Director', name: 'Stephen Daldry' }],
            cast: [{ name: 'Jamie Bell' }],
          },
          alternative_titles: { titles: [] },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected URL ${value}`);
    });
    const gateway = new TmdbRequestSession(
      new TmdbApiClient({ token: 'secret', fetcher, maxRetries: 0 }),
    );
    const capture = captureRepository();

    const result = await enrichStoredExternalContent({
      observations: [stored],
      gateway,
      repository: capture.repository,
    });

    expect(result).toMatchObject({
      providerFailureCount: 1,
      resolvedCount: 0,
      unresolvedCount: 0,
      ambiguousCount: 0,
      persistedReferenceCount: 0,
      clearedReferenceCount: 0,
    });
    expect(capture.repository.applyDecisions).not.toHaveBeenCalled();
    expect(capture.writes).toHaveLength(0);
  });

  it('never treats partial provider coverage as an authoritative enrichment observation', async () => {
    const repository = new InMemoryScheduleRepository();
    const provider: EpgProvider = {
      key: 'development-xmltv',
      getChannels: vi.fn(async () => []),
      getSchedule: vi.fn(async () => ({
        coverage: 'partial' as const,
        programmes: [{
          channelId: 'raw-one',
          startAt: '2026-09-24T18:00:00.000Z',
          endAt: '2026-09-24T20:00:00.000Z',
          title: 'Billy Elliot',
          categories: ['Film'],
          productionDate: { raw: '2000', year: 2000 },
          credits: {
            director: ['Stephen Daldry'],
            actor: ['Jamie Bell'],
            producer: [],
          },
        }],
      })),
    };

    const result = await ingestProviderSchedule({
      provider,
      repository,
      canonicalChannels: [channel],
      channelMappings: [{ providerChannelId: 'raw-one', channelId: channel.id }],
      providerChannelIds: ['raw-one'],
      from: new Date('2026-09-24T18:00:00.000Z'),
      to: new Date('2026-09-24T20:00:00.000Z'),
      clock: () => new Date('2026-09-24T10:00:00.000Z'),
    });

    expect(result.write).toMatchObject({
      status: 'skipped',
      reason: 'partial-provider-coverage',
    });
    expect(result.storedObservation).toBeNull();
  });

  it('uses central classification semantics instead of canonical genre as an identity gate', async () => {
    const item = filmObservation(
      'programme-1',
      '2026-09-24T18:00:00.000Z',
      '2026-09-24T20:00:00.000Z',
    );
    item.classification = {
      ...item.classification,
      contentType: 'unknown',
      confidence: 'unknown',
    };
    item.programme.genre = 'Film';

    const tmdb = tmdbGateway();
    const capture = captureRepository();
    const result = await enrichStoredExternalContent({
      observations: [{
        from: '2026-09-24T16:00:00.000Z',
        to: '2026-09-25T02:00:00.000Z',
        observedAt: '2026-09-24T10:00:00.000Z',
        channelIds: [channel.id],
        programmes: [item],
      }],
      gateway: tmdb,
      repository: capture.repository,
    });

    expect(result.eligibleProgrammeCount).toBe(0);
    expect(tmdb.searchMovieIds).not.toHaveBeenCalled();
    expect(capture.writes).toHaveLength(0);
  });

  it('does not use the enrichment path as historical D0 reconciliation for already-ended broadcasts', async () => {
    const tmdb = tmdbGateway();
    const capture = captureRepository();
    const result = await enrichStoredExternalContent({
      observations: [{
        from: '2026-09-23T04:00:00.000Z',
        to: '2026-09-24T04:00:00.000Z',
        observedAt: '2026-09-24T10:00:00.000Z',
        channelIds: [channel.id],
        programmes: [
          filmObservation(
            'historical-programme',
            '2026-09-23T18:00:00.000Z',
            '2026-09-23T20:00:00.000Z',
          ),
        ],
      }],
      gateway: tmdb,
      repository: capture.repository,
    });

    expect(result.eligibleProgrammeCount).toBe(0);
    expect(tmdb.searchMovieIds).not.toHaveBeenCalled();
    expect(capture.writes).toHaveLength(0);
  });
});
