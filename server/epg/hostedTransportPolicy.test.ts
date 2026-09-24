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

  it('accepts an idempotency key for Guide-horizon orchestration', () => {
    expect(
      parseHostedRefreshRequest(
        {
          mode: 'guide-horizon',
          requestKey: 'cron:2026-09-24T12',
          providerChannelIds: ['RTL4.nl'],
        },
        providerIds,
      ),
    ).toEqual({
      mode: 'guide-horizon',
      providerChannelIds: ['RTL4.nl'],
      requestKey: 'cron:2026-09-24T12',
    });

    expect(() =>
      parseHostedRefreshRequest(
        { mode: 'guide-horizon', requestKey: 'not allowed / key' },
        providerIds,
      ),
    ).toThrow('requestKey is invalid');
  });

  it('accepts only database-owned work-item identity and rejects caller-owned scope', () => {
    const attemptToken = '123e4567-e89b-42d3-a456-426614174000';
    expect(
      parseHostedRefreshRequest(
        { mode: 'work-item', jobId: 17, attemptToken },
        providerIds,
      ),
    ).toEqual({ mode: 'work-item', jobId: 17, attemptToken });

    expect(() =>
      parseHostedRefreshRequest(
        {
          mode: 'work-item',
          jobId: 17,
          attemptToken,
          providerChannelIds: ['RTL4.nl'],
        },
        providerIds,
      ),
    ).toThrow('scope is database-owned');

    expect(() =>
      parseHostedRefreshRequest(
        { mode: 'work-item', jobId: 0, attemptToken },
        providerIds,
      ),
    ).toThrow('jobId must be a positive integer');

    expect(() =>
      parseHostedRefreshRequest(
        { mode: 'work-item', jobId: 17, attemptToken: 'not-a-uuid' },
        providerIds,
      ),
    ).toThrow('attemptToken must be a UUID');
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
    const parsed = parseHostedRefreshRequest(
      {
        from: '2026-09-14T00:00:00Z',
        to: '2026-09-14T06:00:00Z',
        providerChannelIds: [' RTL4.nl ', 'RTL4.nl'],
      },
      providerIds,
    );
    expect(parsed.mode).toBe('window');
    if (parsed.mode !== 'window') throw new Error('Expected window refresh request');
    expect(parsed.providerChannelIds).toEqual(['RTL4.nl']);

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
      ),
    ).toEqual({
      mode: 'window',
      from: '2026-10-24T22:00:00.000Z',
      to: '2026-10-25T23:00:00.000Z',
      providerChannelIds: ['NPO1.nl', 'RTL4.nl'],
    });

    expect(() =>
      parseHostedRefreshRequest(
        { from: '2026-10-24T22:00:00Z', to: '2026-10-25T23:00:01Z' },
        providerIds,
      ),
    ).toThrow('limited to 25 hours');
  });
});
