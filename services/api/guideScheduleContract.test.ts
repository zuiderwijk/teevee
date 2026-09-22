import { describe, expect, it } from 'vitest';

import {
  parseGuideScheduleApiRequest,
  parseGuideScheduleApiResponse,
} from './guideScheduleContract';

const schedule = {
  generatedAt: '2026-09-14T08:00:00+02:00',
  timezone: 'Europe/Amsterdam',
  channels: [
    {
      id: 'nl-npo-1',
      name: 'NPO 1',
      displayName: 'NPO 1',
      sortOrder: 0,
      isActive: true,
    },
  ],
  programmes: [
    {
      id: 'programme-1',
      channelId: 'nl-npo-1',
      startAt: '2026-09-14T18:00:00+02:00',
      endAt: '2026-09-14T19:00:00+02:00',
      title: 'Nieuws',
    },
  ],
};

describe('parseGuideScheduleApiRequest', () => {
  it('normalises valid timestamps and channel ids', () => {
    expect(
      parseGuideScheduleApiRequest({
        from: '2026-09-14T20:00:00+02:00',
        to: '2026-09-14T22:00:00+02:00',
        channelIds: [' channel-1 ', 'channel-1', 'channel-2'],
      }),
    ).toEqual({
      from: '2026-09-14T18:00:00.000Z',
      to: '2026-09-14T20:00:00.000Z',
      channelIds: ['channel-1', 'channel-2'],
    });
  });

  it('allows a query for all canonical channels when channelIds is omitted', () => {
    expect(
      parseGuideScheduleApiRequest({
        from: '2026-09-14T18:00:00Z',
        to: '2026-09-14T19:00:00Z',
      }),
    ).toEqual({
      from: '2026-09-14T18:00:00.000Z',
      to: '2026-09-14T19:00:00.000Z',
    });
  });

  it('rejects malformed transport input before it reaches the repository', () => {
    expect(() => parseGuideScheduleApiRequest(null)).toThrow('must be an object');
    expect(() =>
      parseGuideScheduleApiRequest({ from: 'not-a-date', to: '2026-09-14T19:00:00Z' }),
    ).toThrow('from must be a valid timestamp');
    expect(() =>
      parseGuideScheduleApiRequest({
        from: '2026-09-14T19:00:00Z',
        to: '2026-09-14T18:00:00Z',
      }),
    ).toThrow('to must be after from');
    expect(() =>
      parseGuideScheduleApiRequest({
        from: '2026-09-14T18:00:00Z',
        to: '2026-09-14T19:00:00Z',
        channelIds: [],
      }),
    ).toThrow('channelIds must be a non-empty array');
    expect(() =>
      parseGuideScheduleApiRequest({
        from: '2026-09-14T18:00:00Z',
        to: '2026-09-14T19:00:00Z',
        channelIds: ['channel-1', '   '],
      }),
    ).toThrow('channelIds must contain non-empty strings');
  });
});

describe('parseGuideScheduleApiResponse', () => {
  it('normalises and validates canonical ok responses', () => {
    expect(parseGuideScheduleApiResponse({ status: 'ok', schedule })).toEqual({
      status: 'ok',
      schedule: {
        ...schedule,
        generatedAt: '2026-09-14T06:00:00.000Z',
        programmes: [
          {
            ...schedule.programmes[0],
            startAt: '2026-09-14T16:00:00.000Z',
            endAt: '2026-09-14T17:00:00.000Z',
          },
        ],
      },
      editorialSignals: [],
    });
  });

  it('validates editorial signals beside a valid schedule', () => {
    expect(
      parseGuideScheduleApiResponse({
        status: 'ok',
        schedule,
        editorialSignals: [
          {
            programmeId: 'programme-1',
            type: 'kijktip',
            source: 'tvgids',
            sourceItemId: 'tip-1',
            sourceUrl: 'https://www.tvgids.nl/tip/race',
            publishedAt: '2026-09-14T10:00:00+02:00',
            matchedBy: 'channel-title-start',
          },
        ],
      }),
    ).toMatchObject({
      status: 'ok',
      editorialSignals: [
        {
          programmeId: 'programme-1',
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: 'tip-1',
          publishedAt: '2026-09-14T08:00:00.000Z',
        },
      ],
    });
  });

  it('rejects malformed serialized editorial enrichment without rejecting the valid schedule', () => {
    const parsed = parseGuideScheduleApiResponse({
      status: 'ok',
      schedule,
      editorialSignals: [
        {
          programmeId: 'unknown-programme',
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: 'tip-1',
          matchedBy: 'channel-title-start',
        },
      ],
    });

    expect(parsed).toMatchObject({
      status: 'ok',
      schedule: { timezone: 'Europe/Amsterdam' },
      editorialSignals: [],
    });
  });

  it('drops structurally malformed serialized editorial signals at the trust boundary', () => {
    const parsed = parseGuideScheduleApiResponse({
      status: 'ok',
      schedule,
      editorialSignals: [
        {
          programmeId: 'programme-1',
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: 'tip-1',
          matchedBy: 'nearest-programme',
        },
      ],
    });

    expect(parsed).toMatchObject({
      status: 'ok',
      editorialSignals: [],
    });
  });

  it('preserves explicit unavailable responses', () => {
    expect(parseGuideScheduleApiResponse({ status: 'unavailable' })).toEqual({
      status: 'unavailable',
    });
  });

  it('rejects malformed canonical responses', () => {
    expect(() => parseGuideScheduleApiResponse({ status: 'broken' })).toThrow('status is invalid');
    expect(() =>
      parseGuideScheduleApiResponse({
        status: 'ok',
        schedule: { ...schedule, timezone: 'UTC' },
      }),
    ).toThrow('timezone must be Europe/Amsterdam');
    expect(() =>
      parseGuideScheduleApiResponse({
        status: 'ok',
        schedule: {
          ...schedule,
          programmes: [{ ...schedule.programmes[0], channelId: 'unknown' }],
        },
      }),
    ).toThrow('unknown channel');
  });
});
