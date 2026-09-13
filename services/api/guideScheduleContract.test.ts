import { describe, expect, it } from 'vitest';

import { parseGuideScheduleApiRequest } from './guideScheduleContract';

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
