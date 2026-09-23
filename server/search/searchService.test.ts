import { describe, expect, it, vi } from 'vitest';

import type { ProgrammeEditorialSignalRepository } from '../editorial/editorialRepository';
import type { Channel, Programme } from '../../data/domain/epg';
import { guideTelevisionDayHorizon } from '../../data/domain/guideTime';
import {
  GUIDE_SEARCH_CHANNEL_LIMIT,
  GUIDE_SEARCH_PROGRAMME_LIMIT,
} from '../../services/api/guideSearchContract';
import type { GuideSearchRepository } from './searchRepository';
import { RepositoryGuideSearchApi } from './searchService';

const NOW = Date.parse('2026-09-23T18:00:00Z');

const channel: Channel = {
  id: 'nl-npo-1',
  name: 'NPO 1',
  displayName: 'NPO 1',
  shortName: 'NPO 1',
  sortOrder: 1,
  isActive: true,
};

const programme: Programme = {
  id: 'programme-1',
  channelId: channel.id,
  startAt: '2026-09-23T18:30:00Z',
  endAt: '2026-09-23T19:30:00Z',
  title: 'De slimste mens',
};

function fakeRepository(
  result: Awaited<ReturnType<GuideSearchRepository['search']>> = {
    programmeCoverage: 'complete',
    channelMatches: [channel],
    programmeMatches: [{ programme, channel }],
  },
) {
  const search = vi.fn(async () => result);
  return {
    repository: { search } satisfies GuideSearchRepository,
    search,
  };
}

describe('RepositoryGuideSearchApi', () => {
  it('owns the exact DST-safe D-2..D+7 horizon and bounded result limits', async () => {
    const { repository, search } = fakeRepository();
    const api = new RepositoryGuideSearchApi(repository, undefined, () => NOW);

    await expect(api.search({ query: '  De slimste mens  ' })).resolves.toMatchObject({
      status: 'ok',
      programmeCoverage: 'complete',
    });

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith({
      query: 'De slimste mens',
      now: new Date(NOW).toISOString(),
      windows: guideTelevisionDayHorizon(NOW).map(({ fromMs, toMs }) => ({
        from: new Date(fromMs).toISOString(),
        to: new Date(toMs).toISOString(),
      })),
      programmeLimit: GUIDE_SEARCH_PROGRAMME_LIMIT,
      channelLimit: GUIDE_SEARCH_CHANNEL_LIMIT,
    });
  });

  it('passes canonical coverage and channel results through without fabricating programme availability', async () => {
    const { repository } = fakeRepository({
      programmeCoverage: 'unavailable',
      channelMatches: [channel],
      programmeMatches: [],
    });
    const api = new RepositoryGuideSearchApi(repository, undefined, () => NOW);

    await expect(api.search({ query: 'NPO' })).resolves.toEqual({
      status: 'ok',
      programmeCoverage: 'unavailable',
      channelMatches: [channel],
      programmeMatches: [],
      editorialSignals: [],
    });
  });

  it('loads optional Kijktip metadata only for returned programme IDs and fails it open', async () => {
    const second: Programme = {
      ...programme,
      id: 'programme-2',
      startAt: '2026-09-24T18:30:00Z',
      endAt: '2026-09-24T19:30:00Z',
    };
    const { repository } = fakeRepository({
      programmeCoverage: 'partial',
      channelMatches: [],
      programmeMatches: [
        { programme, channel },
        { programme: second, channel },
      ],
    });
    const getSignalsForProgrammeIds = vi.fn(async () => [
      {
        programmeId: programme.id,
        type: 'kijktip' as const,
        source: 'tvgids' as const,
        sourceItemId: 'tip-1',
        matchedBy: 'channel-title-start' as const,
      },
    ]);
    const editorialRepository: ProgrammeEditorialSignalRepository = {
      replaceSourceSnapshot: vi.fn(),
      getSignalsForProgrammeIds,
    };
    const api = new RepositoryGuideSearchApi(
      repository,
      editorialRepository,
      () => NOW,
    );

    const result = await api.search({ query: 'slimste' });
    expect(getSignalsForProgrammeIds).toHaveBeenCalledWith([
      'programme-1',
      'programme-2',
    ]);
    expect(result).toMatchObject({
      status: 'ok',
      editorialSignals: [{ programmeId: 'programme-1' }],
    });

    getSignalsForProgrammeIds.mockRejectedValueOnce(new Error('editorial unavailable'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const degraded = await api.search({ query: 'slimste' });
    expect(degraded).toMatchObject({ status: 'ok', editorialSignals: [] });
    error.mockRestore();
  });

  it('uses 23/25-hour shared television-day windows without fixed-duration arithmetic', async () => {
    const dstNow = Date.parse('2026-10-25T01:30:00Z');
    const { repository, search } = fakeRepository({
      programmeCoverage: 'unavailable',
      channelMatches: [],
      programmeMatches: [],
    });
    const api = new RepositoryGuideSearchApi(repository, undefined, () => dstNow);

    await api.search({ query: 'NPO' });

    const windows = search.mock.calls[0]?.[0].windows ?? [];
    expect(windows).toHaveLength(10);
    expect(
      windows.some(
        ({ from, to }) =>
          Date.parse(to) - Date.parse(from) === 25 * 60 * 60 * 1_000,
      ),
    ).toBe(true);
  });

  it('propagates canonical repository failures so the Edge boundary can return typed unavailability', async () => {
    const search = vi.fn(async () => {
      throw new Error('canonical store unavailable');
    });
    const api = new RepositoryGuideSearchApi(
      { search } satisfies GuideSearchRepository,
      undefined,
      () => NOW,
    );

    await expect(api.search({ query: 'nieuws' })).rejects.toThrow(
      'canonical store unavailable',
    );
  });
});
