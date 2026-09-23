import { describe, expect, it, vi } from 'vitest';

import type { ProgrammeEditorialSignalRepository } from '../editorial/editorialRepository';
import type { ScheduleRepository } from '../epg/scheduleRepository';
import type { Channel, GuideSchedule, Programme } from '../../data/domain/epg';
import { guideTelevisionDayHorizon } from '../../data/domain/guideTime';
import { RepositoryGuideSearchApi } from './searchService';

const NOW = Date.parse('2026-09-23T18:00:00Z');

const channels: Channel[] = [
  {
    id: 'nl-npo-1',
    name: 'NPO 1',
    displayName: 'NPO 1',
    shortName: 'NPO 1',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'nl-rtl-4',
    name: 'RTL 4',
    displayName: 'RTL 4',
    shortName: 'RTL 4',
    sortOrder: 4,
    isActive: true,
  },
];

function programme(
  id: string,
  title: string,
  startAt: string,
  endAt: string,
  channelId = 'nl-npo-1',
): Programme {
  return { id, title, startAt, endAt, channelId };
}

function scheduleFor(
  fromMs: number,
  toMs: number,
  programmes: readonly Programme[],
): GuideSchedule {
  return {
    generatedAt: new Date(fromMs + 1_000).toISOString(),
    timezone: 'Europe/Amsterdam',
    channels,
    programmes: programmes.filter(
      (item) =>
        Date.parse(item.startAt) < toMs && Date.parse(item.endAt) > fromMs,
    ),
  };
}

function completeWindowSchedules(
  programmes: readonly Programme[],
  nowMs = NOW,
): Map<string, GuideSchedule> {
  return new Map(
    guideTelevisionDayHorizon(nowMs).map(({ fromMs, toMs }) => [
      new Date(fromMs).toISOString(),
      scheduleFor(fromMs, toMs, programmes),
    ]),
  );
}

function fakeScheduleRepository(
  schedules: Map<string, GuideSchedule | null>,
  rejectedFrom = new Set<string>(),
): {
  repository: ScheduleRepository;
  getSchedule: ReturnType<typeof vi.fn>;
} {
  const getSchedule = vi.fn(async (query: { from: string }) => {
    if (rejectedFrom.has(query.from)) throw new Error('storage unavailable');
    return schedules.get(query.from) ?? null;
  });

  return {
    repository: {
      replaceWindow: vi.fn(),
      getSchedule,
    },
    getSchedule,
  };
}

describe('RepositoryGuideSearchApi', () => {
  it('searches all ten canonical television-day windows and ranks concrete repeats', async () => {
    const programmes = [
      programme(
        'historical-old',
        'De slimste mens',
        '2026-09-21T18:30:00Z',
        '2026-09-21T19:30:00Z',
      ),
      programme(
        'historical-new',
        'De slimste mens',
        '2026-09-22T18:30:00Z',
        '2026-09-22T19:30:00Z',
      ),
      programme(
        'current',
        'De slimste mens',
        '2026-09-23T17:30:00Z',
        '2026-09-23T18:30:00Z',
      ),
      programme(
        'future-near',
        'De slimste mens',
        '2026-09-23T19:00:00Z',
        '2026-09-23T20:00:00Z',
      ),
      programme(
        'future-far',
        'De slimste mens',
        '2026-09-24T19:00:00Z',
        '2026-09-24T20:00:00Z',
      ),
      programme(
        'prefix-current',
        'De slimste mens junior',
        '2026-09-23T17:45:00Z',
        '2026-09-23T18:45:00Z',
      ),
      programme(
        'substring-current',
        'Vanavond: De slimste mens',
        '2026-09-23T17:45:00Z',
        '2026-09-23T18:45:00Z',
      ),
    ];
    const { repository, getSchedule } = fakeScheduleRepository(
      completeWindowSchedules(programmes),
    );
    const api = new RepositoryGuideSearchApi(
      repository,
      undefined,
      channels,
      () => NOW,
    );

    const result = await api.search({ query: 'de slimste mens' });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unexpected unavailable');

    expect(result.programmeCoverage).toBe('complete');
    expect(result.programmeMatches.map(({ programme: item }) => item.id)).toEqual([
      'current',
      'future-near',
      'future-far',
      'historical-new',
      'historical-old',
      'prefix-current',
      'substring-current',
    ]);

    expect(getSchedule).toHaveBeenCalledTimes(10);
    expect(getSchedule.mock.calls.map(([query]) => query)).toEqual(
      guideTelevisionDayHorizon(NOW).map(({ fromMs, toMs }) => ({
        from: new Date(fromMs).toISOString(),
        to: new Date(toMs).toISOString(),
      })),
    );
  });

  it('deduplicates one canonical broadcast intersecting adjacent television-day windows', async () => {
    const crossing = programme(
      'crossing',
      'Nachtprogramma',
      '2026-09-24T03:30:00Z',
      '2026-09-24T04:30:00Z',
    );
    const { repository } = fakeScheduleRepository(
      completeWindowSchedules([crossing]),
    );
    const api = new RepositoryGuideSearchApi(
      repository,
      undefined,
      channels,
      () => NOW,
    );

    const result = await api.search({ query: 'nachtprogramma' });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unexpected unavailable');

    expect(result.programmeMatches).toHaveLength(1);
    expect(result.programmeMatches[0]?.programme.id).toBe('crossing');
  });

  it('keeps channel retrieval available when every programme window is unavailable', async () => {
    const unavailable = new Map(
      guideTelevisionDayHorizon(NOW).map(({ fromMs }) => [
        new Date(fromMs).toISOString(),
        null,
      ]),
    );
    const { repository } = fakeScheduleRepository(unavailable);
    const api = new RepositoryGuideSearchApi(
      repository,
      undefined,
      channels,
      () => NOW,
    );

    const result = await api.search({ query: 'NPO' });
    expect(result).toMatchObject({
      status: 'ok',
      programmeCoverage: 'unavailable',
      channelMatches: [{ id: 'nl-npo-1' }],
      programmeMatches: [],
    });
  });

  it('marks programme coverage partial when any horizon window is unavailable or fails', async () => {
    const schedules = completeWindowSchedules([
      programme(
        'news',
        'Nieuwsuur',
        '2026-09-23T20:00:00Z',
        '2026-09-23T21:00:00Z',
      ),
    ]);
    const horizon = guideTelevisionDayHorizon(NOW);
    schedules.set(new Date(horizon[0]!.fromMs).toISOString(), null);
    const rejected = new Set([new Date(horizon[9]!.fromMs).toISOString()]);
    const { repository } = fakeScheduleRepository(schedules, rejected);
    const api = new RepositoryGuideSearchApi(
      repository,
      undefined,
      channels,
      () => NOW,
    );

    const result = await api.search({ query: 'nieuws' });
    expect(result).toMatchObject({
      status: 'ok',
      programmeCoverage: 'partial',
      programmeMatches: [{ programme: { id: 'news' } }],
    });
  });

  it('uses exact/prefix/substring channel ranking and canonical sort order', async () => {
    const catalog: Channel[] = [
      ...channels,
      {
        id: 'npo-extra',
        name: 'NPO Extra',
        displayName: 'NPO Extra',
        sortOrder: 3,
        isActive: true,
      },
      {
        id: 'regional-npo',
        name: 'Regio NPO',
        displayName: 'Regio NPO',
        sortOrder: 2,
        isActive: true,
      },
    ];
    const { repository } = fakeScheduleRepository(
      new Map(
        guideTelevisionDayHorizon(NOW).map(({ fromMs }) => [
          new Date(fromMs).toISOString(),
          null,
        ]),
      ),
    );
    const api = new RepositoryGuideSearchApi(
      repository,
      undefined,
      catalog,
      () => NOW,
    );

    const result = await api.search({ query: 'NPO' });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unexpected unavailable');

    expect(result.channelMatches.map(({ id }) => id)).toEqual([
      'nl-npo-1',
      'npo-extra',
      'regional-npo',
    ]);
  });

  it('loads Kijktip metadata only for bounded returned programme IDs and fails it open', async () => {
    const programmes = Array.from({ length: 30 }, (_, index) =>
      programme(
        `programme-${index.toString().padStart(2, '0')}`,
        'Nieuws',
        new Date(NOW + (index + 1) * 60 * 60 * 1_000).toISOString(),
        new Date(NOW + (index + 2) * 60 * 60 * 1_000).toISOString(),
      ),
    );
    const { repository } = fakeScheduleRepository(
      completeWindowSchedules(programmes),
    );
    const getSignalsForProgrammeIds = vi.fn(
      async (programmeIds: readonly string[]) => [
        {
          programmeId: programmeIds[0]!,
          type: 'kijktip' as const,
          source: 'tvgids' as const,
          sourceItemId: 'tip-1',
          matchedBy: 'channel-title-start' as const,
        },
      ],
    );
    const editorialRepository: ProgrammeEditorialSignalRepository = {
      replaceSourceSnapshot: vi.fn(),
      getSignalsForProgrammeIds,
    };
    const api = new RepositoryGuideSearchApi(
      repository,
      editorialRepository,
      channels,
      () => NOW,
    );

    const result = await api.search({ query: 'nieuws' });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unexpected unavailable');

    expect(result.programmeMatches).toHaveLength(24);
    expect(getSignalsForProgrammeIds).toHaveBeenCalledTimes(1);
    expect(getSignalsForProgrammeIds.mock.calls[0]?.[0]).toEqual(
      result.programmeMatches.map(({ programme: item }) => item.id),
    );
    expect(result.editorialSignals).toHaveLength(1);

    getSignalsForProgrammeIds.mockRejectedValueOnce(
      new Error('editorial unavailable'),
    );
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const degraded = await api.search({ query: 'nieuws' });
    expect(degraded).toMatchObject({
      status: 'ok',
      editorialSignals: [],
    });
    error.mockRestore();
  });

  it('uses the shared DST-aware D-2..D+7 horizon rather than fixed 24-hour arithmetic', async () => {
    const dstNow = Date.parse('2026-10-25T01:30:00Z');
    const horizon = guideTelevisionDayHorizon(dstNow);
    const schedules = new Map(
      horizon.map(({ fromMs, toMs }) => [
        new Date(fromMs).toISOString(),
        scheduleFor(fromMs, toMs, []),
      ]),
    );
    const { repository, getSchedule } = fakeScheduleRepository(schedules);
    const api = new RepositoryGuideSearchApi(
      repository,
      undefined,
      channels,
      () => dstNow,
    );

    await api.search({ query: 'NPO' });

    expect(getSchedule.mock.calls.map(([query]) => query)).toEqual(
      horizon.map(({ fromMs, toMs }) => ({
        from: new Date(fromMs).toISOString(),
        to: new Date(toMs).toISOString(),
      })),
    );
    expect(
      horizon.some(({ fromMs, toMs }) => toMs - fromMs === 25 * 60 * 60 * 1_000),
    ).toBe(true);
  });
});
