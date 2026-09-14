import { describe, expect, it, vi } from 'vitest';

import type { GuideSchedule } from '@/data/domain/epg';

import {
  GUIDE_SCHEDULE_ENDPOINT,
  hostedScheduleQueries,
  loadHostedGuideSchedule,
  mergeHostedSchedules,
  parseHostedScheduleResponse,
} from './hostedGuideScheduleClient';

function schedule(
  generatedAt: string,
  programmes: GuideSchedule['programmes'],
): GuideSchedule {
  return {
    generatedAt,
    timezone: 'Europe/Amsterdam',
    channels: [
      {
        id: 'nl-npo-1',
        name: 'NPO 1',
        displayName: 'NPO 1',
        shortName: 'NPO 1',
        sortOrder: 1,
        isActive: true,
      },
    ],
    programmes,
  };
}

const crossingProgramme = {
  id: 'programme-crossing',
  channelId: 'nl-npo-1',
  startAt: '2026-09-14T21:30:00.000Z',
  endAt: '2026-09-14T22:30:00.000Z',
  title: 'Over middernacht',
};

describe('hostedScheduleQueries', () => {
  it('builds two bounded Amsterdam calendar-day requests on a normal day', () => {
    expect(hostedScheduleQueries(Date.parse('2026-09-14T12:00:00Z'))).toEqual([
      {
        from: '2026-09-13T22:00:00.000Z',
        to: '2026-09-14T22:00:00.000Z',
      },
      {
        from: '2026-09-14T22:00:00.000Z',
        to: '2026-09-15T22:00:00.000Z',
      },
    ]);
  });

  it('splits the 25-hour Amsterdam DST day into transport-safe chunks', () => {
    expect(hostedScheduleQueries(Date.parse('2026-10-25T12:00:00Z'))).toEqual([
      {
        from: '2026-10-24T22:00:00.000Z',
        to: '2026-10-25T22:00:00.000Z',
      },
      {
        from: '2026-10-25T22:00:00.000Z',
        to: '2026-10-25T23:00:00.000Z',
      },
      {
        from: '2026-10-25T23:00:00.000Z',
        to: '2026-10-26T23:00:00.000Z',
      },
    ]);
  });
});

describe('parseHostedScheduleResponse', () => {
  it('validates and canonicalises the Teevee schedule response', () => {
    expect(
      parseHostedScheduleResponse({
        status: 'ok',
        schedule: schedule('2026-09-14T02:45:50.99+00:00', [crossingProgramme]),
      }),
    ).toMatchObject({
      status: 'ok',
      schedule: {
        generatedAt: '2026-09-14T02:45:50.990Z',
        timezone: 'Europe/Amsterdam',
      },
    });
    expect(parseHostedScheduleResponse({ status: 'unavailable' })).toEqual({
      status: 'unavailable',
    });
  });

  it('rejects malformed or relationally invalid schedule data', () => {
    expect(() => parseHostedScheduleResponse({ status: 'unknown' })).toThrow('invalid status');
    expect(() =>
      parseHostedScheduleResponse({
        status: 'ok',
        schedule: {
          ...schedule('2026-09-14T02:45:50Z', []),
          programmes: [
            {
              ...crossingProgramme,
              channelId: 'nl-unknown',
            },
          ],
        },
      }),
    ).toThrow('unknown channel');
  });
});

describe('mergeHostedSchedules', () => {
  it('deduplicates programmes crossing chunk boundaries and keeps conservative freshness', () => {
    const first = schedule('2026-09-14T02:45:50Z', [crossingProgramme]);
    const second = schedule('2026-09-14T02:45:53Z', [
      crossingProgramme,
      {
        id: 'programme-next',
        channelId: 'nl-npo-1',
        startAt: '2026-09-14T22:30:00.000Z',
        endAt: '2026-09-14T23:00:00.000Z',
        title: 'Volgende',
      },
    ]);

    const merged = mergeHostedSchedules([first, second]);
    expect(merged.generatedAt).toBe('2026-09-14T02:45:50.000Z');
    expect(merged.channels).toHaveLength(1);
    expect(merged.programmes.map(({ id }) => id)).toEqual([
      'programme-crossing',
      'programme-next',
    ]);
  });
});

describe('loadHostedGuideSchedule', () => {
  it('loads day chunks in parallel and returns one merged canonical schedule', async () => {
    const bodies: unknown[] = [];
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      const request = bodies.at(-1) as { from: string };
      const first = request.from === '2026-09-13T22:00:00.000Z';
      return new Response(
        JSON.stringify({
          status: 'ok',
          schedule: schedule(first ? '2026-09-14T02:45:50Z' : '2026-09-14T02:45:53Z', [
            crossingProgramme,
          ]),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const result = await loadHostedGuideSchedule(Date.parse('2026-09-14T12:00:00Z'), fetcher);
    expect(result?.programmes).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenCalledWith(
      GUIDE_SCHEDULE_ENDPOINT,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(bodies).toEqual([
      {
        from: '2026-09-13T22:00:00.000Z',
        to: '2026-09-14T22:00:00.000Z',
      },
      {
        from: '2026-09-14T22:00:00.000Z',
        to: '2026-09-15T22:00:00.000Z',
      },
    ]);
  });

  it('returns null rather than mixing remote and fallback data when any chunk is unavailable', async () => {
    let call = 0;
    const fetcher = vi.fn(async () => {
      call += 1;
      return new Response(
        JSON.stringify(
          call === 1
            ? { status: 'ok', schedule: schedule('2026-09-14T02:45:50Z', []) }
            : { status: 'unavailable' },
        ),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    await expect(
      loadHostedGuideSchedule(Date.parse('2026-09-14T12:00:00Z'), fetcher),
    ).resolves.toBeNull();
  });
});
