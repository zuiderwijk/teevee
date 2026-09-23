import { describe, expect, it, vi } from 'vitest';

import type { Channel, GuideSchedule, Programme } from '@/data/domain/epg';
import {
  isTonightFilmClassification,
  isTonightSeriesClassification,
  isTonightSportClassification,
} from '@/data/domain/programmeClassification';
import { InMemoryScheduleRepository } from '../epg/inMemoryScheduleRepository.ts';
import { ingestProviderSchedule } from '../epg/ingest.ts';
import { normaliseProviderSchedule } from '../epg/normalise.ts';
import type {
  EpgProvider,
  ExternalProgramme,
  ProviderScheduleBatch,
  ProviderScheduleQuery,
} from '../epg/provider.ts';
import { recoverProviderClassifications } from './classificationRecovery.ts';

const channelOne: Channel = {
  id: 'channel-1',
  name: 'Een',
  displayName: 'Een',
  sortOrder: 0,
  isActive: true,
};
const channelTwo: Channel = {
  id: 'channel-2',
  name: 'Twee',
  displayName: 'Twee',
  sortOrder: 1,
  isActive: true,
};
const canonicalChannels = [channelOne, channelTwo];
const channelMappings = [
  { providerChannelId: 'raw-one', channelId: 'channel-1' },
  { providerChannelId: 'raw-two', channelId: 'channel-2' },
];
const providerChannelIds = ['raw-one', 'raw-two'];
const from = new Date('2026-09-23T04:00:00.000Z');
const to = new Date('2026-09-24T04:00:00.000Z');

class TestProvider implements EpgProvider {
  readonly key = 'development-xmltv';

  constructor(private readonly batch: ProviderScheduleBatch) {}

  async getChannels() {
    return [
      { id: 'raw-one', name: 'Raw One' },
      { id: 'raw-two', name: 'Raw Two' },
    ];
  }

  async getSchedule(
    _input: ProviderScheduleQuery,
  ): Promise<ProviderScheduleBatch> {
    return this.batch;
  }
}

function programme(
  channelId: string,
  title: string,
  startAt: string,
  endAt: string,
  patch: Partial<ExternalProgramme> = {},
): ExternalProgramme {
  return {
    channelId,
    title,
    startAt,
    endAt,
    ...patch,
  };
}

function canonical(
  programmes: ExternalProgramme[],
  generatedAt: string,
): GuideSchedule {
  return normaliseProviderSchedule({
    providerKey: 'development-xmltv',
    generatedAt,
    canonicalChannels,
    channelMappings,
    programmes,
  }).schedule;
}

async function seedUnclassified(
  repository: InMemoryScheduleRepository,
  programmes: ExternalProgramme[],
  generatedAt = '2026-09-23T00:17:01.240Z',
) {
  const schedule = canonical(programmes, generatedAt);
  await repository.replaceWindow({
    from: from.toISOString(),
    to: to.toISOString(),
    channelIds: canonicalChannels.map(({ id }) => id),
    schedule,
  });
  return schedule;
}

async function recover(
  repository: InMemoryScheduleRepository,
  batch: ProviderScheduleBatch,
  observedAt = '2026-09-23T20:00:00.000Z',
) {
  return recoverProviderClassifications({
    provider: new TestProvider(batch),
    repository,
    canonicalChannels,
    channelMappings,
    providerChannelIds,
    from,
    to,
    clock: () => new Date(observedAt),
  });
}

async function storedSchedule(repository: InMemoryScheduleRepository) {
  return repository.getSchedule({
    from: from.toISOString(),
    to: to.toISOString(),
  });
}

describe('non-destructive programme classification recovery', () => {
  it('recovers an exact Film sibling from partial provider evidence without replacing canonical schedule state', async () => {
    const repository = new InMemoryScheduleRepository();
    const film = programme(
      'raw-one',
      'Feature film',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T20:00:00.000Z',
      { categories: ['Drama', 'Film'] },
    );
    const retained = programme(
      'raw-two',
      'Retained outside provider returnset',
      '2026-09-23T18:30:00.000Z',
      '2026-09-23T19:30:00.000Z',
    );
    const seeded = await seedUnclassified(repository, [film, retained]);

    const result = await recover(repository, {
      coverage: 'partial',
      programmes: [film],
    });

    expect(result.providerCoverage).toBe('partial');
    expect(result.recovery).toEqual({
      candidateProgrammeCount: 1,
      matchedProgrammeCount: 1,
      recoveredClassificationCount: 1,
      ignoredStaleCount: 0,
      unmatchedProgrammeCount: 0,
    });

    const after = await storedSchedule(repository);
    expect(after).toEqual({
      ...seeded,
      programmes: expect.arrayContaining(seeded.programmes),
    });
    if (!after) throw new Error('Expected canonical schedule to remain available');
    expect(after.generatedAt).toBe('2026-09-23T00:17:01.240Z');
    expect(after.programmes.map(({ title }) => title).sort()).toEqual([
      'Feature film',
      'Retained outside provider returnset',
    ]);

    const filmId = seeded.programmes.find(({ title }) => title === 'Feature film')!.id;
    const retainedId = seeded.programmes.find(
      ({ title }) => title === 'Retained outside provider returnset',
    )!.id;
    const classifications = await repository.getClassificationsForProgrammeIds([
      filmId,
      retainedId,
    ]);
    expect(classifications).toHaveLength(1);
    expect(classifications[0]).toMatchObject({
      programmeId: filmId,
      contentType: 'film',
      confidence: 'high',
    });
    expect(isTonightFilmClassification(classifications[0]!)).toBe(true);
  });

  it('recovers Series, Sport and explicit unknown semantics through the central classifier', async () => {
    const repository = new InMemoryScheduleRepository();
    const rows = [
      programme(
        'raw-one',
        'Scripted',
        '2026-09-23T18:00:00.000Z',
        '2026-09-23T19:00:00.000Z',
        { categories: ['Dramaseries'] },
      ),
      programme(
        'raw-one',
        'Live sport',
        '2026-09-23T19:00:00.000Z',
        '2026-09-23T20:00:00.000Z',
        {
          categories: ['Sport', 'Voetbal', 'Sports'],
          description: 'Verslag van de wedstrijd.',
        },
      ),
      programme(
        'raw-two',
        'Ambiguous',
        '2026-09-23T20:00:00.000Z',
        '2026-09-23T21:00:00.000Z',
        { categories: ['Onbekend'] },
      ),
    ];
    const seeded = await seedUnclassified(repository, rows);

    await recover(repository, { coverage: 'partial', programmes: rows });

    const byTitle = new Map(
      seeded.programmes.map((item) => [item.title, item.id]),
    );
    const classifications = await repository.getClassificationsForProgrammeIds(
      seeded.programmes.map(({ id }) => id),
    );
    const byId = new Map(
      classifications.map((classification) => [
        classification.programmeId,
        classification,
      ]),
    );

    const series = byId.get(byTitle.get('Scripted')!)!;
    const sport = byId.get(byTitle.get('Live sport')!)!;
    const unknown = byId.get(byTitle.get('Ambiguous')!)!;

    expect(isTonightSeriesClassification(series)).toBe(true);
    expect(isTonightSportClassification(sport)).toBe(true);
    expect(unknown).toMatchObject({
      contentType: 'unknown',
      confidence: 'unknown',
    });
    expect(isTonightFilmClassification(unknown)).toBe(false);
    expect(isTonightSeriesClassification(unknown)).toBe(false);
    expect(isTonightSportClassification(unknown)).toBe(false);
  });

  it('does not fabricate a sibling for a canonical broadcast missing from provider evidence', async () => {
    const repository = new InMemoryScheduleRepository();
    const missing = programme(
      'raw-one',
      'No current provider row',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
    );
    const seeded = await seedUnclassified(repository, [missing]);

    const result = await recover(repository, {
      coverage: 'partial',
      programmes: [],
    });

    expect(result.recovery.recoveredClassificationCount).toBe(0);
    await expect(
      repository.getClassificationsForProgrammeIds([
        seeded.programmes[0]!.id,
      ]),
    ).resolves.toEqual([]);
  });

  it('fails closed when a partial provider start correction does not exactly match the stored canonical broadcast', async () => {
    const repository = new InMemoryScheduleRepository();
    const original = programme(
      'raw-one',
      'Corrected later',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
      { categories: ['Film'] },
    );
    const seeded = await seedUnclassified(repository, [original]);
    const corrected = {
      ...original,
      startAt: '2026-09-23T18:02:00.000Z',
      endAt: '2026-09-23T19:02:00.000Z',
    };

    const recovery = await recover(repository, {
      coverage: 'partial',
      programmes: [corrected],
    });

    expect(recovery.recovery).toEqual({
      candidateProgrammeCount: 1,
      matchedProgrammeCount: 0,
      recoveredClassificationCount: 0,
      ignoredStaleCount: 0,
      unmatchedProgrammeCount: 1,
    });
    await expect(
      repository.getClassificationsForProgrammeIds([
        seeded.programmes[0]!.id,
      ]),
    ).resolves.toEqual([]);

    const authoritative = await ingestProviderSchedule({
      provider: new TestProvider({
        coverage: 'complete',
        programmes: [corrected],
      }),
      repository,
      canonicalChannels,
      channelMappings,
      providerChannelIds: ['raw-one'],
      from,
      to,
      clock: () => new Date('2026-09-23T20:10:00.000Z'),
    });
    expect(authoritative.write.status).toBe('stored');

    const after = await storedSchedule(repository);
    if (!after) throw new Error('Expected corrected canonical schedule');
    const correctedProgramme = after.programmes.find(
      ({ title }) => title === 'Corrected later',
    )!;
    expect(correctedProgramme.id).not.toBe(seeded.programmes[0]!.id);
    const classifications =
      await repository.getClassificationsForProgrammeIds([
        seeded.programmes[0]!.id,
        correctedProgramme.id,
      ]);
    expect(classifications).toEqual([
      expect.objectContaining({
        programmeId: correctedProgramme.id,
        contentType: 'film',
      }),
    ]);
  });

  it('rejects a corrected row even when a stable provider id keeps the regenerated canonical id unchanged', async () => {
    const repository = new InMemoryScheduleRepository();
    const original = programme(
      'raw-one',
      'Stable provider id',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
      {
        id: 'provider-stable-42',
        categories: ['Film'],
      },
    );
    const seeded = await seedUnclassified(repository, [original]);
    const correctedEnd = {
      ...original,
      endAt: '2026-09-23T19:05:00.000Z',
    };
    const correctedCanonical = canonical(
      [correctedEnd],
      '2026-09-23T20:00:00.000Z',
    );

    expect(correctedCanonical.programmes[0]!.id).toBe(
      seeded.programmes[0]!.id,
    );

    const result = await recover(repository, {
      coverage: 'partial',
      programmes: [correctedEnd],
    });

    expect(result.recovery).toMatchObject({
      candidateProgrammeCount: 1,
      matchedProgrammeCount: 0,
      recoveredClassificationCount: 0,
      unmatchedProgrammeCount: 1,
    });
    await expect(
      repository.getClassificationsForProgrammeIds([
        seeded.programmes[0]!.id,
      ]),
    ).resolves.toEqual([]);
  });

  it('keeps same-title repeated broadcasts distinct and recovers only the exact returned repeat', async () => {
    const repository = new InMemoryScheduleRepository();
    const first = programme(
      'raw-one',
      'Zelfde titel',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
      { categories: ['Film'] },
    );
    const second = programme(
      'raw-one',
      'Zelfde titel',
      '2026-09-23T20:00:00.000Z',
      '2026-09-23T21:00:00.000Z',
      { categories: ['Film'] },
    );
    const seeded = await seedUnclassified(repository, [first, second]);

    const result = await recover(repository, {
      coverage: 'partial',
      programmes: [second],
    });

    expect(result.recovery).toMatchObject({
      candidateProgrammeCount: 1,
      matchedProgrammeCount: 1,
      recoveredClassificationCount: 1,
    });
    const classifications =
      await repository.getClassificationsForProgrammeIds(
        seeded.programmes.map(({ id }) => id),
      );
    expect(classifications).toHaveLength(1);
    expect(classifications[0]!.programmeId).toBe(
      seeded.programmes.find(
        ({ startAt }) => startAt === '2026-09-23T20:00:00.000Z',
      )!.id,
    );
  });

  it('deduplicates equivalent provider rows before recovery instead of writing duplicate siblings', async () => {
    const repository = new InMemoryScheduleRepository();
    const row = programme(
      'raw-one',
      'Duplicate film',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
      { categories: ['Film'] },
    );
    const seeded = await seedUnclassified(repository, [row]);

    const result = await recover(repository, {
      coverage: 'partial',
      programmes: [row, { ...row }],
    });

    expect(result.candidateProgrammeCount).toBe(1);
    expect(result.diagnostics.map(({ code }) => code)).toContain(
      'duplicate-provider-programme',
    );
    expect(result.recovery).toMatchObject({
      candidateProgrammeCount: 1,
      matchedProgrammeCount: 1,
      recoveredClassificationCount: 1,
    });
    await expect(
      repository.getClassificationsForProgrammeIds([
        seeded.programmes[0]!.id,
      ]),
    ).resolves.toHaveLength(1);
  });

  it('fails closed for overlapping provider broadcasts while still recovering an unambiguous broadcast on the same channel', async () => {
    const repository = new InMemoryScheduleRepository();
    const first = programme(
      'raw-one',
      'Overlap A',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
      { categories: ['Film'] },
    );
    const second = programme(
      'raw-one',
      'Overlap B',
      '2026-09-23T18:30:00.000Z',
      '2026-09-23T19:30:00.000Z',
      { categories: ['Film'] },
    );
    const safe = programme(
      'raw-one',
      'Unambiguous film',
      '2026-09-23T20:00:00.000Z',
      '2026-09-23T21:00:00.000Z',
      { categories: ['Film'] },
    );
    const seeded = await seedUnclassified(repository, [first, second, safe]);

    const result = await recover(repository, {
      coverage: 'partial',
      programmes: [first, second, safe],
    });

    expect(result.diagnostics.map(({ code }) => code)).toContain(
      'overlapping-programmes',
    );
    expect(result.candidateProgrammeCount).toBe(1);
    expect(result.recovery).toMatchObject({
      candidateProgrammeCount: 1,
      matchedProgrammeCount: 1,
      recoveredClassificationCount: 1,
    });

    const classifications =
      await repository.getClassificationsForProgrammeIds(
        seeded.programmes.map(({ id }) => id),
      );
    expect(classifications).toHaveLength(1);
    expect(classifications[0]!.programmeId).toBe(
      seeded.programmes.find(
        ({ title }) => title === 'Unambiguous film',
      )!.id,
    );
  });

  it('does not recover a channel when normalisation reports an error for that channel', async () => {
    const repository = new InMemoryScheduleRepository();
    const valid = programme(
      'raw-one',
      'Otherwise valid film',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
      { categories: ['Film'] },
    );
    const seeded = await seedUnclassified(repository, [valid]);

    const result = await recover(repository, {
      coverage: 'partial',
      programmes: [
        valid,
        {
          channelId: 'raw-one',
          startAt: '2026-09-23T19:00:00.000Z',
          endAt: '2026-09-23T20:00:00.000Z',
        },
      ],
    });

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          code: 'missing-title',
          channelId: 'channel-1',
        }),
      ]),
    );
    expect(result.candidateProgrammeCount).toBe(0);
    expect(result.recovery.recoveredClassificationCount).toBe(0);
    await expect(
      repository.getClassificationsForProgrammeIds([
        seeded.programmes[0]!.id,
      ]),
    ).resolves.toEqual([]);
  });

  it('ignores a recovery observation older than newer canonical coverage even when the broadcast identity is unchanged', async () => {
    const repository = new InMemoryScheduleRepository();
    const row = programme(
      'raw-one',
      'Stable broadcast',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
      { categories: ['Film'] },
    );
    const seeded = await seedUnclassified(
      repository,
      [row],
      '2026-09-23T20:10:00.000Z',
    );

    const result = await recover(
      repository,
      { coverage: 'partial', programmes: [row] },
      '2026-09-23T20:00:00.000Z',
    );

    expect(result.recovery).toEqual({
      candidateProgrammeCount: 1,
      matchedProgrammeCount: 1,
      recoveredClassificationCount: 0,
      ignoredStaleCount: 1,
      unmatchedProgrammeCount: 0,
    });
    await expect(
      repository.getClassificationsForProgrammeIds([
        seeded.programmes[0]!.id,
      ]),
    ).resolves.toEqual([]);
  });

  it('is idempotent and canonical deletion cannot leave an orphan classification', async () => {
    const repository = new InMemoryScheduleRepository();
    const row = programme(
      'raw-one',
      'Film',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
      { categories: ['Film'] },
    );
    const seeded = await seedUnclassified(repository, [row]);

    await recover(repository, { coverage: 'partial', programmes: [row] });
    await recover(
      repository,
      { coverage: 'partial', programmes: [row] },
      '2026-09-23T20:05:00.000Z',
    );

    await expect(
      repository.getClassificationsForProgrammeIds([
        seeded.programmes[0]!.id,
      ]),
    ).resolves.toHaveLength(1);

    const emptySchedule: GuideSchedule = {
      generatedAt: '2026-09-23T20:10:00.000Z',
      timezone: 'Europe/Amsterdam',
      channels: canonicalChannels,
      programmes: [],
    };
    await repository.replaceWindow({
      from: from.toISOString(),
      to: to.toISOString(),
      channelIds: ['channel-1'],
      schedule: emptySchedule,
      classifications: [],
    });

    await expect(
      repository.getClassificationsForProgrammeIds([
        seeded.programmes[0]!.id,
      ]),
    ).resolves.toEqual([]);
  });

  it('keeps provider evidence out of canonical/public objects and does not alter normal authoritative refresh semantics', async () => {
    const repository = new InMemoryScheduleRepository();
    const row = programme(
      'raw-one',
      'Film',
      '2026-09-23T18:00:00.000Z',
      '2026-09-23T19:00:00.000Z',
      {
        categories: ['Drama', 'Film'],
        episodeNumbers: [{ value: 'S1 E1' }],
        hasDirectorCredit: true,
      },
    );
    const provider = new TestProvider({
      coverage: 'complete',
      programmes: [row],
    });

    const normalRefresh = await ingestProviderSchedule({
      provider,
      repository,
      canonicalChannels,
      channelMappings,
      providerChannelIds: ['raw-one'],
      from,
      to,
      clock: () => new Date('2026-09-23T20:00:00.000Z'),
    });
    expect(normalRefresh.write.status).toBe('stored');

    const stored = await storedSchedule(repository);
    expect(JSON.stringify(stored)).not.toContain('categories');
    expect(JSON.stringify(stored)).not.toContain('episodeNumbers');
    expect(JSON.stringify(stored)).not.toContain('hasDirectorCredit');

    if (!stored) throw new Error('Expected stored schedule');
    const classifications = await repository.getClassificationsForProgrammeIds(
      stored.programmes.map(({ id }) => id),
    );
    expect(JSON.stringify(classifications)).not.toContain('Drama');
    expect(JSON.stringify(classifications)).not.toContain('categories');

    const replaceSpy = vi.spyOn(repository, 'replaceWindow');
    await recover(repository, {
      coverage: 'partial',
      programmes: [row],
    }, '2026-09-23T20:05:00.000Z');
    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
