import { describe, expect, it } from 'vitest';

import type { Channel } from '@/data/domain/epg';

import { InMemoryScheduleRepository } from './inMemoryScheduleRepository';
import { ingestProviderSchedule } from './ingest';
import type {
  EpgProvider,
  ExternalChannel,
  ProviderScheduleBatch,
  ProviderScheduleQuery,
} from './provider';
import { RepositoryGuideScheduleApi } from './scheduleService';

const channel: Channel = {
  id: 'channel-1',
  name: 'Een',
  displayName: 'Een',
  sortOrder: 0,
  isActive: true,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

class DeferredProvider implements EpgProvider {
  readonly key = 'deferred-provider';

  constructor(private readonly response: Promise<ProviderScheduleBatch>) {}

  async getChannels(): Promise<ExternalChannel[]> {
    return [{ id: 'raw-one', name: 'Raw One' }];
  }

  getSchedule(_input: ProviderScheduleQuery): Promise<ProviderScheduleBatch> {
    return this.response;
  }
}

class ImmediateProvider implements EpgProvider {
  readonly key = 'deferred-provider';

  constructor(private readonly response: ProviderScheduleBatch) {}

  async getChannels(): Promise<ExternalChannel[]> {
    return [{ id: 'raw-one', name: 'Raw One' }];
  }

  async getSchedule(_input: ProviderScheduleQuery): Promise<ProviderScheduleBatch> {
    return this.response;
  }
}

describe('provider refresh concurrency', () => {
  it('keeps a newer request when an older request completes afterwards', async () => {
    const repository = new InMemoryScheduleRepository();
    const oldResponse = deferred<ProviderScheduleBatch>();
    const common = {
      repository,
      canonicalChannels: [channel],
      channelMappings: [{ providerChannelId: 'raw-one', channelId: 'channel-1' }],
      providerChannelIds: ['raw-one'],
      from: new Date('2026-09-14T18:00:00Z'),
      to: new Date('2026-09-14T20:00:00Z'),
    };

    const olderIngest = ingestProviderSchedule({
      ...common,
      provider: new DeferredProvider(oldResponse.promise),
      clock: () => new Date('2026-09-14T17:55:00Z'),
    });

    const newerIngest = await ingestProviderSchedule({
      ...common,
      provider: new ImmediateProvider({
        coverage: 'complete',
        programmes: [
          {
            id: 'newer',
            channelId: 'raw-one',
            startAt: '2026-09-14T18:00:00Z',
            endAt: '2026-09-14T19:00:00Z',
            title: 'Nieuw',
          },
        ],
      }),
      clock: () => new Date('2026-09-14T18:10:00Z'),
    });
    expect(newerIngest.write.status).toBe('stored');

    oldResponse.resolve({
      coverage: 'complete',
      programmes: [
        {
          id: 'older',
          channelId: 'raw-one',
          startAt: '2026-09-14T18:00:00Z',
          endAt: '2026-09-14T19:00:00Z',
          title: 'Oud',
        },
      ],
    });

    const olderResult = await olderIngest;
    expect(olderResult.write.status).toBe('ignored-stale');

    const api = new RepositoryGuideScheduleApi(repository);
    const response = await api.getSchedule({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
    });
    expect(response).toMatchObject({
      status: 'ok',
      schedule: {
        programmes: [{ title: 'Nieuw' }],
      },
    });
  });
});
