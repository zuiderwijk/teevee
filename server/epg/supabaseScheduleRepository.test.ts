import { describe, expect, it } from 'vitest';

import type { GuideSchedule } from '@/data/domain/epg';

import { SupabaseScheduleRepository, type ScheduleRpcClient } from './supabaseScheduleRepository';

const schedule: GuideSchedule = {
  generatedAt: '2026-09-14T17:55:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels: [
    {
      id: 'channel-1',
      name: 'Een',
      displayName: 'Een',
      sortOrder: 0,
      isActive: true,
    },
  ],
  programmes: [
    {
      id: 'programme-1',
      channelId: 'channel-1',
      startAt: '2026-09-14T18:00:00.000Z',
      endAt: '2026-09-14T19:00:00.000Z',
      title: 'Nieuws',
    },
  ],
};

class FakeRpcClient implements ScheduleRpcClient {
  readonly calls: Array<{ functionName: string; args: Record<string, unknown> }> = [];

  constructor(private readonly responses: unknown[]) {}

  async rpc<T>(functionName: string, args: Record<string, unknown>) {
    this.calls.push({ functionName, args });
    const response = this.responses.shift();
    return response as { data: T | null; error: { message: string } | null };
  }
}

describe('SupabaseScheduleRepository', () => {
  it('maps canonical replacement writes to the private-store RPC bridge', async () => {
    const client = new FakeRpcClient([
      {
        data: {
          status: 'stored',
          removedProgrammeCount: 2,
          storedProgrammeCount: 1,
        },
        error: null,
      },
    ]);
    const repository = new SupabaseScheduleRepository(client);

    await expect(
      repository.replaceWindow({
        from: '2026-09-14T18:00:00.000Z',
        to: '2026-09-14T20:00:00.000Z',
        channelIds: ['channel-1'],
        schedule,
      }),
    ).resolves.toEqual({
      status: 'stored',
      removedProgrammeCount: 2,
      storedProgrammeCount: 1,
    });

    expect(client.calls).toEqual([
      {
        functionName: 'teevee_replace_schedule_window',
        args: {
          p_from: '2026-09-14T18:00:00.000Z',
          p_to: '2026-09-14T20:00:00.000Z',
          p_generated_at: schedule.generatedAt,
          p_channel_ids: ['channel-1'],
          p_channels: schedule.channels,
          p_programmes: schedule.programmes,
        },
      },
    ]);
  });

  it('preserves ignored-stale without inventing mutations', async () => {
    const client = new FakeRpcClient([
      {
        data: {
          status: 'ignored-stale',
          removedProgrammeCount: 0,
          storedProgrammeCount: 0,
        },
        error: null,
      },
    ]);
    const repository = new SupabaseScheduleRepository(client);

    await expect(
      repository.replaceWindow({
        from: '2026-09-14T18:00:00.000Z',
        to: '2026-09-14T20:00:00.000Z',
        channelIds: ['channel-1'],
        schedule,
      }),
    ).resolves.toEqual({
      status: 'ignored-stale',
      removedProgrammeCount: 0,
      storedProgrammeCount: 0,
    });
  });

  it('maps bounded reads and preserves explicit unavailable', async () => {
    const client = new FakeRpcClient([
      { data: schedule, error: null },
      { data: null, error: null },
    ]);
    const repository = new SupabaseScheduleRepository(client);

    await expect(
      repository.getSchedule({
        from: '2026-09-14T18:00:00.000Z',
        to: '2026-09-14T20:00:00.000Z',
        channelIds: ['channel-1'],
      }),
    ).resolves.toEqual(schedule);
    await expect(
      repository.getSchedule({
        from: '2026-09-15T18:00:00.000Z',
        to: '2026-09-15T20:00:00.000Z',
      }),
    ).resolves.toBeNull();

    expect(client.calls[0]).toEqual({
      functionName: 'teevee_get_schedule',
      args: {
        p_from: '2026-09-14T18:00:00.000Z',
        p_to: '2026-09-14T20:00:00.000Z',
        p_channel_ids: ['channel-1'],
      },
    });
    expect(client.calls[1]).toEqual({
      functionName: 'teevee_get_schedule',
      args: {
        p_from: '2026-09-15T18:00:00.000Z',
        p_to: '2026-09-15T20:00:00.000Z',
        p_channel_ids: null,
      },
    });
  });

  it('surfaces RPC failures and rejects malformed database payloads', async () => {
    const failing = new SupabaseScheduleRepository(
      new FakeRpcClient([{ data: null, error: { message: 'database unavailable' } }]),
    );
    await expect(
      failing.getSchedule({
        from: '2026-09-14T18:00:00.000Z',
        to: '2026-09-14T20:00:00.000Z',
      }),
    ).rejects.toThrow('Supabase get_schedule failed: database unavailable');

    const malformed = new SupabaseScheduleRepository(
      new FakeRpcClient([{ data: { timezone: 'UTC' }, error: null }]),
    );
    await expect(
      malformed.getSchedule({
        from: '2026-09-14T18:00:00.000Z',
        to: '2026-09-14T20:00:00.000Z',
      }),
    ).rejects.toThrow('Supabase get_schedule returned an invalid payload');
  });
});
