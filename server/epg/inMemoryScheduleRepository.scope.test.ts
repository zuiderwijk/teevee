import { describe, expect, it } from 'vitest';

import type { Channel, GuideSchedule } from '@/data/domain/epg';

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
  displayName: 'B original',
  sortOrder: 1,
  isActive: true,
};

function emptySchedule(channels: Channel[], generatedAt: string): GuideSchedule {
  return {
    generatedAt,
    timezone: 'Europe/Amsterdam',
    channels,
    programmes: [],
  };
}

describe('InMemoryScheduleRepository channel refresh scope', () => {
  it('does not overwrite metadata for channels outside a partial refresh', async () => {
    const repository = new InMemoryScheduleRepository();

    await repository.replaceWindow({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
      channelIds: ['channel-a', 'channel-b'],
      schedule: emptySchedule([channelA, channelB], '2026-09-14T10:00:00Z'),
    });

    await repository.replaceWindow({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
      channelIds: ['channel-a'],
      schedule: emptySchedule(
        [
          { ...channelA, displayName: 'A refreshed' },
          { ...channelB, displayName: 'B should not leak' },
        ],
        '2026-09-14T10:05:00Z',
      ),
    });

    const result = await repository.getSchedule({
      from: '2026-09-14T18:00:00Z',
      to: '2026-09-14T20:00:00Z',
    });

    expect(result?.channels).toMatchObject([
      { id: 'channel-a', displayName: 'A refreshed' },
      { id: 'channel-b', displayName: 'B original' },
    ]);
  });
});
