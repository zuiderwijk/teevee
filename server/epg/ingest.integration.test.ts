import { describe, expect, it } from 'vitest';

import type { Channel } from '@/data/domain/epg';

import { InMemoryScheduleRepository } from './inMemoryScheduleRepository';
import { ingestProviderSchedule } from './ingest';
import type {
  EpgProvider,
  ExternalProgramme,
  ProviderScheduleBatch,
  ProviderScheduleQuery,
} from './provider';
import { RepositoryGuideScheduleApi } from './scheduleService';

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
const mappings = [
  { providerChannelId: 'raw-one', channelId: 'channel-1' },
  { providerChannelId: 'raw-two', channelId: 'channel-2' },
];
const from = new Date('2026-09-14T18:00:00Z');
const to = new Date('2026-09-14T20:00:00Z');
const clock = () => new Date('2026-09-14T17:55:00Z');

class TestProvider implements EpgProvider {
  readonly key = 'fixture-provider';

  constructor(private readonly batch: ProviderScheduleBatch) {}

  async getChannels() {
    return [
      { id: 'raw-one', name: 'Raw One' },
      { id: 'raw-two', name: 'Raw Two' },
    ];
  }

  async getSchedule(_input: ProviderScheduleQuery): Promise<ProviderScheduleBatch> {
    return this.batch;
  }
}

function programme(
  id: string,
  channelId: string,
  title: string | undefined,
  startAt = '2026-09-14T18:00:00Z',
  endAt = '2026-09-14T19:00:00Z',
): ExternalProgramme {
  return {
    id,
    channelId,
    startAt,
    endAt,
    ...(title === undefined ? {} : { title }),
  };
}

async function ingest(
  repository: InMemoryScheduleRepository,
  batch: ProviderScheduleBatch,
  providerChannelIds = ['raw-one', 'raw-two'],
  ingestClock = clock,
) {
  return ingestProviderSchedule({
    provider: new TestProvider(batch),
    repository,
    canonicalChannels,
    channelMappings: mappings,
    providerChannelIds,
    from,
    to,
    clock: ingestClock,
  });
}

async function titles(repository: InMemoryScheduleRepository) {
  const api = new RepositoryGuideScheduleApi(repository);
  const result = await api.getSchedule({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return result.status === 'ok' ? result.schedule.programmes.map((item) => item.title) : [];
}

describe('provider -> normalisation -> repository -> schedule API', () => {
  it('stores complete provider data and returns only canonical Teevee fields', async () => {
    const repository = new InMemoryScheduleRepository();

    const ingestion = await ingest(repository, {
      coverage: 'complete',
      programmes: [
        programme('provider-1', 'raw-one', 'Nieuws'),
        programme('provider-2', 'raw-two', 'Sport', '2026-09-14T18:30:00Z', '2026-09-14T19:30:00Z'),
      ],
    });

    expect(ingestion.write).toMatchObject({
      status: 'stored',
      channelIds: ['channel-1', 'channel-2'],
      result: { status: 'stored', removedProgrammeCount: 0, storedProgrammeCount: 2 },
    });
    expect(ingestion.diagnostics).toEqual([]);

    const api = new RepositoryGuideScheduleApi(repository);
    const response = await api.getSchedule({
      from: from.toISOString(),
      to: to.toISOString(),
    });

    expect(response.status).toBe('ok');
    if (response.status !== 'ok') throw new Error('Expected canonical schedule');
    expect(response.schedule.channels.map(({ id }) => id)).toEqual(['channel-1', 'channel-2']);
    expect(response.schedule.programmes.map(({ channelId, title, id }) => ({ channelId, title, id }))).toEqual([
      { channelId: 'channel-1', title: 'Nieuws', id: expect.stringMatching(/^programme-/) },
      { channelId: 'channel-2', title: 'Sport', id: expect.stringMatching(/^programme-/) },
    ]);
    expect(JSON.stringify(response)).not.toContain('raw-one');
    expect(JSON.stringify(response)).not.toContain('provider-1');
  });

  it('does not replace stored canonical data with a partial provider batch', async () => {
    const repository = new InMemoryScheduleRepository();
    await ingest(repository, {
      coverage: 'complete',
      programmes: [programme('old', 'raw-one', 'Bestaand')],
    }, ['raw-one']);

    const ingestion = await ingest(repository, {
      coverage: 'partial',
      programmes: [programme('new', 'raw-one', 'Onvolledig')],
    }, ['raw-one']);

    expect(ingestion.write).toEqual({
      status: 'skipped',
      channelIds: ['channel-1'],
      reason: 'partial-provider-coverage',
    });
    await expect(titles(repository)).resolves.toEqual(['Bestaand']);
  });

  it('updates safe channels while retaining a channel with malformed provider data', async () => {
    const repository = new InMemoryScheduleRepository();
    await ingest(repository, {
      coverage: 'complete',
      programmes: [
        programme('old-one', 'raw-one', 'Een oud'),
        programme('old-two', 'raw-two', 'Twee oud'),
      ],
    });

    const ingestion = await ingest(repository, {
      coverage: 'complete',
      programmes: [
        programme('broken-one', 'raw-one', undefined),
        programme('new-two', 'raw-two', 'Twee nieuw'),
      ],
    });

    expect(ingestion.diagnostics).toContainEqual(
      expect.objectContaining({ severity: 'error', code: 'missing-title', channelId: 'channel-1' }),
    );
    expect(ingestion.write).toMatchObject({ status: 'stored', channelIds: ['channel-2'] });
    await expect(titles(repository)).resolves.toEqual(['Een oud', 'Twee nieuw']);
  });

  it('allows an authoritative empty window to clear stale data for a safe channel', async () => {
    const repository = new InMemoryScheduleRepository();
    await ingest(repository, {
      coverage: 'complete',
      programmes: [programme('old', 'raw-one', 'Verdwijnt')],
    }, ['raw-one']);

    const ingestion = await ingest(repository, { coverage: 'complete', programmes: [] }, ['raw-one']);

    expect(ingestion.write).toMatchObject({
      status: 'stored',
      channelIds: ['channel-1'],
      result: { status: 'stored', removedProgrammeCount: 1, storedProgrammeCount: 0 },
    });
    await expect(titles(repository)).resolves.toEqual([]);
  });

  it('skips destructive replacement when returned data cannot be attributed to a provider channel', async () => {
    const repository = new InMemoryScheduleRepository();
    await ingest(repository, {
      coverage: 'complete',
      programmes: [programme('old', 'raw-one', 'Bewaard')],
    }, ['raw-one']);

    const ingestion = await ingest(
      repository,
      {
        coverage: 'complete',
        programmes: [
          {
            id: 'unattributed',
            startAt: '2026-09-14T18:00:00Z',
            endAt: '2026-09-14T19:00:00Z',
            title: 'Onbetrouwbaar',
          },
        ],
      },
      ['raw-one'],
    );

    expect(ingestion.write).toEqual({
      status: 'skipped',
      channelIds: ['channel-1'],
      reason: 'unattributed-provider-record',
    });
    await expect(titles(repository)).resolves.toEqual(['Bewaard']);
  });

  it('surfaces stale ingest rejection and keeps the newer canonical schedule intact', async () => {
    const repository = new InMemoryScheduleRepository();
    const newerClock = () => new Date('2026-09-14T18:10:00Z');
    const olderClock = () => new Date('2026-09-14T17:55:00Z');

    await ingest(
      repository,
      { coverage: 'complete', programmes: [programme('newer', 'raw-one', 'Nieuw')] },
      ['raw-one'],
      newerClock,
    );

    const stale = await ingest(
      repository,
      { coverage: 'complete', programmes: [programme('older', 'raw-one', 'Oud')] },
      ['raw-one'],
      olderClock,
    );

    expect(stale.write).toEqual({
      status: 'ignored-stale',
      channelIds: ['channel-1'],
      result: {
        status: 'ignored-stale',
        removedProgrammeCount: 0,
        storedProgrammeCount: 0,
      },
    });
    await expect(titles(repository)).resolves.toEqual(['Nieuw']);
  });

  it('reports unavailable before the canonical repository has any schedule', async () => {
    const api = new RepositoryGuideScheduleApi(new InMemoryScheduleRepository());
    await expect(
      api.getSchedule({ from: from.toISOString(), to: to.toISOString() }),
    ).resolves.toEqual({ status: 'unavailable' });
  });
});
