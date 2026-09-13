import { describe, expect, it } from 'vitest';

import type { Channel } from '@/data/domain/epg';

import { normaliseProviderSchedule } from './normalise';
import type { ChannelMapping, ExternalProgramme } from './provider';

const channels: Channel[] = [
  {
    id: 'channel-2',
    name: 'Twee',
    displayName: 'Twee',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'channel-1',
    name: 'Een',
    displayName: 'Een',
    sortOrder: 0,
    isActive: true,
  },
];

const mappings: ChannelMapping[] = [
  { providerChannelId: 'provider-one', channelId: 'channel-1' },
  { providerChannelId: 'provider-two', channelId: 'channel-2' },
];

function normalise(programmes: ExternalProgramme[], channelMappings = mappings) {
  return normaliseProviderSchedule({
    providerKey: 'development-provider',
    generatedAt: '2026-09-14T00:00:00+02:00',
    canonicalChannels: channels,
    channelMappings,
    programmes,
  });
}

describe('normaliseProviderSchedule', () => {
  it('maps valid provider data into the canonical Teevee schedule', () => {
    const result = normalise([
      {
        id: 'broadcast-42',
        channelId: 'provider-one',
        startAt: '2026-09-14T20:00:00+02:00',
        endAt: '2026-09-14T21:30:00+02:00',
        title: '  Avondprogramma  ',
        subtitle: '  Aflevering 1  ',
        description: '  Beschrijving  ',
        genre: '  Amusement  ',
        isLive: false,
        isRepeat: true,
      },
    ]);

    expect(result.diagnostics).toEqual([]);
    expect(result.schedule.generatedAt).toBe('2026-09-13T22:00:00.000Z');
    expect(result.schedule.channels.map(({ id }) => id)).toEqual(['channel-1', 'channel-2']);
    expect(result.schedule.programmes).toHaveLength(1);
    expect(result.schedule.programmes[0]).toMatchObject({
      channelId: 'channel-1',
      startAt: '2026-09-14T18:00:00.000Z',
      endAt: '2026-09-14T19:30:00.000Z',
      title: 'Avondprogramma',
      subtitle: 'Aflevering 1',
      description: 'Beschrijving',
      genre: 'Amusement',
      isLive: false,
      isRepeat: true,
    });
    expect(result.schedule.programmes[0]?.id).toMatch(/^programme-[a-z0-9]+$/);
  });

  it('keeps canonical ids deterministic when provider ids are stable', () => {
    const programme: ExternalProgramme = {
      id: 'stable-provider-id',
      channelId: 'provider-one',
      startAt: '2026-09-14T20:00:00+02:00',
      endAt: '2026-09-14T21:00:00+02:00',
      title: 'Titel versie 1',
    };

    const first = normalise([programme]).schedule.programmes[0]?.id;
    const corrected = normalise([{ ...programme, title: 'Titel versie 2' }]).schedule.programmes[0]?.id;

    expect(first).toBeDefined();
    expect(corrected).toBe(first);
  });

  it('skips unusable provider records and returns explicit diagnostics', () => {
    const result = normalise([
      {
        id: 'missing-title',
        channelId: 'provider-one',
        startAt: '2026-09-14T18:00:00Z',
        endAt: '2026-09-14T19:00:00Z',
        title: '   ',
      },
      {
        id: 'invalid-start',
        channelId: 'provider-one',
        startAt: 'not-a-date',
        endAt: '2026-09-14T19:00:00Z',
        title: 'Test',
      },
      {
        id: 'invalid-end',
        channelId: 'provider-one',
        startAt: '2026-09-14T18:00:00Z',
        endAt: 'not-a-date',
        title: 'Test',
      },
      {
        id: 'invalid-range',
        channelId: 'provider-one',
        startAt: '2026-09-14T19:00:00Z',
        endAt: '2026-09-14T18:00:00Z',
        title: 'Test',
      },
      {
        id: 'unknown-channel',
        channelId: 'provider-unknown',
        startAt: '2026-09-14T18:00:00Z',
        endAt: '2026-09-14T19:00:00Z',
        title: 'Test',
      },
    ]);

    expect(result.schedule.programmes).toEqual([]);
    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'missing-title',
      'invalid-start',
      'invalid-end',
      'invalid-range',
      'unmapped-provider-channel',
    ]);
  });

  it('suppresses duplicate provider records and reports schedule overlaps without dropping valid data', () => {
    const first: ExternalProgramme = {
      id: 'same-record',
      channelId: 'provider-one',
      startAt: '2026-09-14T18:00:00Z',
      endAt: '2026-09-14T19:30:00Z',
      title: 'Lang programma',
    };
    const result = normalise([
      first,
      { ...first },
      {
        id: 'overlap',
        channelId: 'provider-one',
        startAt: '2026-09-14T19:00:00Z',
        endAt: '2026-09-14T20:00:00Z',
        title: 'Overlap',
      },
    ]);

    expect(result.schedule.programmes).toHaveLength(2);
    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'duplicate-provider-programme',
      'overlapping-programmes',
    ]);
  });

  it('excludes ambiguous or invalid mappings instead of guessing channel identity', () => {
    const result = normalise(
      [
        {
          id: 'ambiguous',
          channelId: 'provider-one',
          startAt: '2026-09-14T18:00:00Z',
          endAt: '2026-09-14T19:00:00Z',
          title: 'Niet importeren',
        },
      ],
      [
        { providerChannelId: 'provider-one', channelId: 'channel-1' },
        { providerChannelId: 'provider-one', channelId: 'channel-2' },
        { providerChannelId: 'missing-canonical', channelId: 'channel-404' },
        { providerChannelId: '   ', channelId: 'channel-1' },
      ],
    );

    expect(result.schedule.programmes).toEqual([]);
    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'duplicate-channel-mapping',
      'unknown-canonical-channel',
      'invalid-channel-mapping',
      'unmapped-provider-channel',
    ]);
  });

  it('treats duplicate canonical ids as an internal configuration error', () => {
    expect(() =>
      normaliseProviderSchedule({
        providerKey: 'development-provider',
        generatedAt: '2026-09-14T00:00:00Z',
        canonicalChannels: [channels[0]!, { ...channels[0]! }],
        channelMappings: [],
        programmes: [],
      }),
    ).toThrow('Duplicate canonical channel id');
  });
});
