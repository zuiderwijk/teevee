import { describe, expect, it } from 'vitest';

import type { Channel, GuideSchedule, Programme } from '@/data/domain/epg';

import { InMemoryScheduleRepository } from './inMemoryScheduleRepository';

const channelA: Channel = {
  id: 'channel-a',
  name: 'A',
  displayName: 'A',
  sortOrder: 0,
  isActive: true,
};

const channelB: Channel = {
  id: 'channel-b',
  name: 'B',
  displayName: 'B',
  sortOrder: 1,
  isActive: true,
};

function programme(
  id: string,
  channelId: Channel['id'],
  startAt: string,
  endAt: string,
  title = id,
): Programme {
  return { id, channelId, startAt, endAt, title };
}

function schedule(
  programmes: Programme[],
  generatedAt = '2026-09-14T10:00:00Z',
  channels: Channel[] = [channelB, channelA],
): GuideSchedule {
  return {
    generatedAt,
    timezone: 'Europe/Amsterdam',
    channels,
    programmes,
  };
}

describe('InMemoryScheduleRepository', () => {
  it('distinguishes an empty repository from a valid empty query result', async () => {
    const repository = new InMemoryScheduleRepository();

    await expect(
      repository.getSchedule({ from: '2026-09-14T18:00:00Z', to: '2026-09-14T19:00:00Z' }),
    ).resolves.toBeNull();

    await repository.replaceWindow({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T19:00:00Z',
      channelIds: ['channel-a'],
      schedule: schedule([]),
    });

    await expect(
      repository.getSchedule({ from: '2026-09-14T18:00:00Z', to: '2026-09-14T19:00:00Z' }),
    ).resolves.toMatchObject({
      generatedAt: '2026-09-14T10:00:00.000Z',
      programmes: [],
    });
  });

  it('queries programmes by interval intersection and canonical channel order', async () => {
    const repository = new InMemoryScheduleRepository();
    await repository.replaceWindow({
      from: '2026-09-14T16:00:00Z',
      to: '2026-09-14T22:00:00Z',
      channelIds: ['channel-a', 'channel-b'],
      schedule: schedule([
        programme('a-before', 'channel-a', '2026-09-14T16:00:00Z', '2026-09-14T18:00:00Z'),
        programme('a-cross', 'channel-a', '2026-09-14T17:30:00Z', '2026-09-14T18:30:00Z'),
        programme('a-inside', 'channel-a', '2026-09-14T19:00:00Z', '2026-09-14T20:00:00Z'),
        programme('a-after', 'channel-a', '2026-09-14T20:00:00Z', '2026-09-14T21:00:00Z'),
        programme('b-inside', 'channel-b', '2026-09-14T18:15:00Z', '2026-09-14T18:45:00Z'),
      ]),
    });

    const result = await repository.getSchedule({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
    });

    expect(result?.channels.map(({ id }) => id)).toEqual(['channel-a', 'channel-b']);
    expect(result?.programmes.map(({ id }) => id)).toEqual(['a-cross', 'a-inside', 'b-inside']);
  });

  it('supports channel-bounded queries without leaking other channels', async () => {
    const repository = new InMemoryScheduleRepository();
    await repository.replaceWindow({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
      channelIds: ['channel-a', 'channel-b'],
      schedule: schedule([
        programme('a', 'channel-a', '2026-09-14T18:00:00Z', '2026-09-14T19:00:00Z'),
        programme('b', 'channel-b', '2026-09-14T18:00:00Z', '2026-09-14T19:00:00Z'),
      ]),
    });

    const result = await repository.getSchedule({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
      channelIds: ['channel-b'],
    });

    expect(result?.channels.map(({ id }) => id)).toEqual(['channel-b']);
    expect(result?.programmes.map(({ id }) => id)).toEqual(['b']);
  });

  it('replaces one refreshed window so corrections remove stale rows but preserve neighbours', async () => {
    const repository = new InMemoryScheduleRepository();
    await repository.replaceWindow({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T22:00:00Z',
      channelIds: ['channel-a'],
      schedule: schedule([
        programme('before', 'channel-a', '2026-09-14T18:00:00Z', '2026-09-14T19:00:00Z'),
        programme('stale', 'channel-a', '2026-09-14T19:00:00Z', '2026-09-14T20:00:00Z'),
        programme('after', 'channel-a', '2026-09-14T21:00:00Z', '2026-09-14T22:00:00Z'),
      ]),
    });

    const write = await repository.replaceWindow({
      from: '2026-09-14T19:00:00Z',
      to: '2026-09-14T21:00:00Z',
      channelIds: ['channel-a'],
      schedule: schedule([
        programme('corrected', 'channel-a', '2026-09-14T19:00:00Z', '2026-09-14T20:30:00Z'),
      ], '2026-09-14T10:05:00Z'),
    });

    expect(write).toEqual({ removedProgrammeCount: 1, storedProgrammeCount: 1 });

    const result = await repository.getSchedule({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T22:00:00Z',
    });
    expect(result?.programmes.map(({ id }) => id)).toEqual(['before', 'corrected', 'after']);
  });

  it('keeps unrelated channels intact during a partial-channel refresh', async () => {
    const repository = new InMemoryScheduleRepository();
    await repository.replaceWindow({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
      channelIds: ['channel-a', 'channel-b'],
      schedule: schedule([
        programme('a-old', 'channel-a', '2026-09-14T18:00:00Z', '2026-09-14T19:00:00Z'),
        programme('b-keep', 'channel-b', '2026-09-14T18:00:00Z', '2026-09-14T19:00:00Z'),
      ]),
    });

    await repository.replaceWindow({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
      channelIds: ['channel-a'],
      schedule: schedule([
        programme('a-new', 'channel-a', '2026-09-14T18:00:00Z', '2026-09-14T19:30:00Z'),
      ], '2026-09-14T10:10:00Z'),
    });

    const result = await repository.getSchedule({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
    });
    expect(result?.programmes.map(({ id }) => id)).toEqual(['a-new', 'b-keep']);
  });

  it('never moves repository freshness backwards when an older window is replayed', async () => {
    const repository = new InMemoryScheduleRepository();
    await repository.replaceWindow({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T19:00:00Z',
      channelIds: ['channel-a'],
      schedule: schedule([], '2026-09-14T10:10:00Z'),
    });
    await repository.replaceWindow({
      from: '2026-09-14T17:00:00Z',
      to: '2026-09-14T18:00:00Z',
      channelIds: ['channel-a'],
      schedule: schedule([], '2026-09-14T09:00:00Z'),
    });

    const result = await repository.getSchedule({
      from: '2026-09-14T17:00:00Z',
      to: '2026-09-14T19:00:00Z',
    });
    expect(result?.generatedAt).toBe('2026-09-14T10:10:00.000Z');
  });

  it('fails fast on invalid repository ranges and broken canonical relations', async () => {
    const repository = new InMemoryScheduleRepository();

    await expect(
      repository.getSchedule({ from: '2026-09-14T18:00:00Z', to: '2026-09-14T18:00:00Z' }),
    ).rejects.toThrow('to must be after from');

    await expect(
      repository.replaceWindow({
        from: '2026-09-14T18:00:00Z',
        to: '2026-09-14T19:00:00Z',
        channelIds: ['channel-missing'],
        schedule: schedule([]),
      }),
    ).rejects.toThrow('Replacement channel channel-missing is missing');

    await expect(
      repository.replaceWindow({
        from: '2026-09-14T18:00:00Z',
        to: '2026-09-14T19:00:00Z',
        channelIds: ['channel-a'],
        schedule: schedule([
          programme('broken', 'channel-missing', '2026-09-14T18:00:00Z', '2026-09-14T19:00:00Z'),
        ]),
      }),
    ).rejects.toThrow('references unknown canonical channel');
  });
});
