import { describe, expect, it } from 'vitest';

import {
  parseHostedGuideScheduleRequest,
  parseHostedRefreshRequest,
} from './hostedTransportPolicy';

const canonicalIds = ['nl-npo-1', 'nl-rtl-4'] as const;
const providerIds = ['NPO1.nl', 'RTL4.nl'] as const;

describe('parseHostedGuideScheduleRequest', () => {
  it('defaults to the explicitly allowed canonical channel scope', () => {
    expect(
      parseHostedGuideScheduleRequest(
        {
          from: '2026-09-14T00:00:00+02:00',
          to: '2026-09-14T12:00:00+02:00',
        },
        canonicalIds,
      ),
    ).toEqual({
      from: '2026-09-13T22:00:00.000Z',
      to: '2026-09-14T10:00:00.000Z',
      channelIds: ['nl-npo-1', 'nl-rtl-4'],
    });
  });

  it('keeps an explicit safe subset and rejects unsupported channels', () => {
    expect(
      parseHostedGuideScheduleRequest(
        {
          from: '2026-09-14T00:00:00Z',
          to: '2026-09-15T00:00:00Z',
          channelIds: [' nl-rtl-4 ', 'nl-rtl-4'],
        },
        canonicalIds,
      ).channelIds,
    ).toEqual(['nl-rtl-4']);

    expect(() =>
      parseHostedGuideScheduleRequest(
        {
          from: '2026-09-14T00:00:00Z',
          to: '2026-09-14T01:00:00Z',
          channelIds: ['nl-unknown'],
        },
        canonicalIds,
      ),
    ).toThrow('Unsupported channelIds value');
  });

  it('allows a 25-hour Amsterdam winter-time guide day and rejects anything larger', () => {
    expect(
      parseHostedGuideScheduleRequest(
        {
          from: '2026-10-24T22:00:00Z',
          to: '2026-10-25T23:00:00Z',
        },
        canonicalIds,
      ),
    ).toEqual({
      from: '2026-10-24T22:00:00.000Z',
      to: '2026-10-25T23:00:00.000Z',
      channelIds: ['nl-npo-1', 'nl-rtl-4'],
    });

    expect(() =>
      parseHostedGuideScheduleRequest(
        {
          from: '2026-10-24T22:00:00Z',
          to: '2026-10-25T23:00:01Z',
        },
        canonicalIds,
      ),
    ).toThrow('limited to 25 hours');
  });
});

describe('parseHostedRefreshRequest', () => {
  it('accepts server-derived Guide-horizon refresh without caller-owned time windows', () => {
    expect(
      parseHostedRefreshRequest(
        { mode: 'guide-horizon', providerChannelIds: [' RTL4.nl ', 'RTL4.nl'] },
        providerIds,
      ),
    ).toEqual({
      mode: 'guide-horizon',
      providerChannelIds: ['RTL4.nl'],
    });

    expect(() =>
      parseHostedRefreshRequest(
        {
          mode: 'guide-horizon',
          from: '2026-09-21T04:00:00Z',
          to: '2026-09-22T04:00:00Z',
        },
        providerIds,
      ),
    ).toThrow('derives its own television-day windows');
  });

  it('defaults to the allow-listed provider scope and canonicalises timestamps', () => {
    expect(
      parseHostedRefreshRequest(
        {
          from: '2026-09-14T00:00:00+02:00',
          to: '2026-09-15T00:00:00+02:00',
        },
        providerIds,
      ),
    ).toEqual({
      mode: 'window',
      from: '2026-09-13T22:00:00.000Z',
      to: '2026-09-14T22:00:00.000Z',
      providerChannelIds: ['NPO1.nl', 'RTL4.nl'],
    });
  });

  it('deduplicates safe provider subsets and rejects unknown provider ids', () => {
    expect(
      parseHostedRefreshRequest(
        {
          from: '2026-09-14T00:00:00Z',
          to: '2026-09-14T06:00:00Z',
          providerChannelIds: [' RTL4.nl ', 'RTL4.nl'],
        },
        providerIds,
      ).providerChannelIds,
    ).toEqual(['RTL4.nl']);

    expect(() =>
      parseHostedRefreshRequest(
        {
          from: '2026-09-14T00:00:00Z',
          to: '2026-09-14T06:00:00Z',
          providerChannelIds: ['Unknown.nl'],
        },
        providerIds,
      ),
    ).toThrow('Unsupported providerChannelIds value');
  });

  it('rejects invalid refresh ranges and allows at most 25 hours', () => {
    expect(() =>
      parseHostedRefreshRequest(
        { from: '2026-09-14T01:00:00Z', to: '2026-09-14T00:00:00Z' },
        providerIds,
      ),
    ).toThrow('to must be after from');

    expect(
      parseHostedRefreshRequest(
        { from: '2026-10-24T22:00:00Z', to: '2026-10-25T23:00:00Z' },
        providerIds,
      ).to,
    ).toBe('2026-10-25T23:00:00.000Z');

    expect(() =>
      parseHostedRefreshRequest(
        { from: '2026-10-24T22:00:00Z', to: '2026-10-25T23:00:01Z' },
        providerIds,
      ),
    ).toThrow('limited to 25 hours');
  });
});
