import { describe, expect, it, vi } from 'vitest';

import type { ProgrammeEditorialSignalRepository } from '../editorial/editorialRepository';
import { guideTelevisionDayHorizon } from '../../data/domain/guideTime';
import type {
  GuideSearchRepository,
  GuideSearchRepositoryRequest,
  GuideSearchRepositoryResult,
} from './searchRepository';
import { RepositoryGuideSearchApi } from './searchService';

const NOW = Date.parse('2026-09-23T18:00:00Z');

const channel = {
  id: 'nl-npo-1',
  name: 'NPO 1',
  displayName: 'NPO 1',
  shortName: 'NPO 1',
  sortOrder: 1,
  isActive: true,
};

const programme = {
  id: 'programme-1',
  channelId: 'nl-npo-1',
  startAt: '2026-09-23T19:00:00Z',
  endAt: '2026-09-23T20:00:00Z',
  title: 'De slimste mens',
};

function searchRepository(
  result: GuideSearchRepositoryResult = {
    programmeCoverage: 'complete',
    channelMatches: [channel],
    programmeMatches: [{ programme, channel }],
  },
) {
  const search = vi.fn(async (_request: GuideSearchRepositoryRequest) => result);
  return {
    repository: { search } satisfies GuideSearchRepository,
    search,
  };
}

describe('RepositoryGuideSearchApi', () => {
  it('owns the exact D-2..D+7 horizon and passes bounded repository limits', async () => {
    const { repository, search } = searchRepository();
    const api = new RepositoryGuideSearchApi(repository, undefined, () => NOW);

    await api.search({ query: '  De slimste mens  ' });

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith({
      query: 'De slimste mens',
      now: new Date(NOW).toISOString(),
      windows: guideTelevisionDayHorizon(NOW).map(({ fromMs, toMs }) => ({
        from: new Date(fromMs).toISOString(),
        to: new Date(toMs).toISOString(),
      })),
      programmeLimit: 24,
      channelLimit: 24,
    });
  });

  it('preserves repository coverage and channel/programme result identity', async () => {
    const { repository } = searchRepository({
      programmeCoverage: 'partial',
      channelMatches: [channel],
      programmeMatches: [{ programme, channel }],
    });
    const api = new RepositoryGuideSearchApi(repository, undefined, () => NOW);

    await expect(api.search({ query: 'slimste' })).resolves.toEqual({
      status: 'ok',
      programmeCoverage: 'partial',
      channelMatches: [channel],
      programmeMatches: [{ programme, channel }],
      editorialSignals: [],
    });
  });

  it('loads editorial metadata only for returned programmes and fails enrichment open', async () => {
    const { repository } = searchRepository();
    const getSignalsForProgrammeIds = vi.fn(async () => [
      {
        programmeId: 'programme-1',
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

    const enriched = await api.search({ query: 'slimste' });
    expect(getSignalsForProgrammeIds).toHaveBeenCalledWith(['programme-1']);
    expect(enriched).toMatchObject({
      status: 'ok',
      editorialSignals: [{ programmeId: 'programme-1', type: 'kijktip' }],
    });

    getSignalsForProgrammeIds.mockRejectedValueOnce(new Error('down'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(api.search({ query: 'slimste' })).resolves.toMatchObject({
      status: 'ok',
      editorialSignals: [],
    });
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  it('does not query editorial storage when no programme result is returned', async () => {
    const { repository } = searchRepository({
      programmeCoverage: 'unavailable',
      channelMatches: [channel],
      programmeMatches: [],
    });
    const getSignalsForProgrammeIds = vi.fn();
    const editorialRepository: ProgrammeEditorialSignalRepository = {
      replaceSourceSnapshot: vi.fn(),
      getSignalsForProgrammeIds,
    };
    const api = new RepositoryGuideSearchApi(
      repository,
      editorialRepository,
      () => NOW,
    );

    const result = await api.search({ query: 'NPO' });
    expect(result).toMatchObject({
      status: 'ok',
      programmeCoverage: 'unavailable',
      channelMatches: [{ id: 'nl-npo-1' }],
      programmeMatches: [],
    });
    expect(getSignalsForProgrammeIds).not.toHaveBeenCalled();
  });

  it('uses shared television-day primitives across the 05:59 -> 06:00 rollover and DST', async () => {
    const before = Date.parse('2026-09-23T03:59:00Z');
    const after = Date.parse('2026-09-23T04:00:00Z');
    const fallDst = Date.parse('2026-10-25T01:30:00Z');

    const beforeSearch = searchRepository();
    const afterSearch = searchRepository();
    const dstSearch = searchRepository();

    await new RepositoryGuideSearchApi(
      beforeSearch.repository,
      undefined,
      () => before,
    ).search({ query: 'NPO' });
    await new RepositoryGuideSearchApi(
      afterSearch.repository,
      undefined,
      () => after,
    ).search({ query: 'NPO' });
    await new RepositoryGuideSearchApi(
      dstSearch.repository,
      undefined,
      () => fallDst,
    ).search({ query: 'NPO' });

    const beforeWindows = beforeSearch.search.mock.calls[0]![0].windows;
    const afterWindows = afterSearch.search.mock.calls[0]![0].windows;
    expect(beforeWindows[0]?.from).not.toBe(afterWindows[0]?.from);

    const dstWindows = dstSearch.search.mock.calls[0]![0].windows;
    expect(
      dstWindows.some(
        ({ from, to }) =>
          Date.parse(to) - Date.parse(from) === 25 * 60 * 60 * 1_000,
      ),
    ).toBe(true);
  });
});
