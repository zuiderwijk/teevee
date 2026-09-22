import { describe, expect, it } from 'vitest';

import type { GuideSchedule, Programme } from '../../data/domain/epg';
import { matchTvgidsTipToSchedule, normalizeEditorialTitle } from './matching';
import type { TvgidsTipSourceItem } from './tvgidsTipsFeed';

const START = '2026-09-22T18:30:00.000Z';

function item(overrides: Partial<TvgidsTipSourceItem> = {}): TvgidsTipSourceItem {
  return {
    sourceItemId: 'tip-1',
    title: 'Race Across the World',
    channelName: 'RTL 4',
    startAt: START,
    endAt: '2026-09-22T19:30:00.000Z',
    ...overrides,
  };
}

function programme(id: string, title: string, startAt = START): Programme {
  return {
    id,
    channelId: 'nl-rtl-4',
    startAt,
    endAt: new Date(Date.parse(startAt) + 60 * 60_000).toISOString(),
    title,
  };
}

function schedule(programmes: Programme[]): GuideSchedule {
  return {
    generatedAt: '2026-09-22T17:00:00.000Z',
    timezone: 'Europe/Amsterdam',
    channels: [
      {
        id: 'nl-rtl-4',
        name: 'RTL 4',
        displayName: 'RTL 4',
        sortOrder: 4,
        isActive: true,
      },
    ],
    programmes,
  };
}

describe('Kijktip title normalization', () => {
  it('only normalizes the approved small surface', () => {
    expect(normalizeEditorialTitle('  “Race – Across   the World!”  ')).toBe(
      'race - across the world',
    );
    expect(normalizeEditorialTitle("John’s Show")).toBe("john's show");
    expect(normalizeEditorialTitle('Serie S02E03')).not.toBe(
      normalizeEditorialTitle('Serie'),
    );
  });
});

describe('deterministic TVgids tip matching', () => {
  it('uses Tier A only when a future source supplies a resolvable canonical broadcast identity', () => {
    expect(
      matchTvgidsTipToSchedule(
        item({ title: 'Different editorial title' }),
        'nl-rtl-4',
        schedule([programme('source-programme', 'Canonical title')]),
        'source-programme',
      ),
    ).toMatchObject({
      status: 'matched',
      signal: {
        programmeId: 'source-programme',
        matchedBy: 'source-id',
      },
      titleMismatch: true,
    });
  });

  it.each([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5])(
    'Tier B matches exact normalized title at a %i minute start drift',
    (minutes) => {
      const candidate = programme(
        'programme-b',
        'Race Across the World',
        new Date(Date.parse(START) + minutes * 60_000).toISOString(),
      );
      expect(
        matchTvgidsTipToSchedule(item(), 'nl-rtl-4', schedule([candidate])),
      ).toMatchObject({
        status: 'matched',
        signal: {
          programmeId: 'programme-b',
          matchedBy: 'channel-title-start',
        },
      });
    },
  );

  it('rejects a matching title beyond the five-minute tolerance', () => {
    expect(
      matchTvgidsTipToSchedule(
        item(),
        'nl-rtl-4',
        schedule([
          programme(
            'late',
            'Race Across the World',
            new Date(Date.parse(START) + 6 * 60_000).toISOString(),
          ),
        ]),
      ),
    ).toEqual({
      status: 'unmatched',
      reason: 'start-drift',
      titleMismatch: false,
    });
  });

  it.each([
    ['Invasie', 'Invasion'],
    ['Bestemming X', 'Destination X'],
    ['Altijd in de buurt', 'In de Buurt'],
    ['Studio sport live', 'NOS Studio Sport Live'],
    ['Criminal minds: Evolution', 'Criminal Minds'],
    ['vtwonen weer verliefd op je huis', 'VTWonen: Weer verliefd op je huis'],
    ['UEFA Nations League: Nederland - België', 'UEFA Nations League Soccer'],
    ['Sport - Wielrennen: WK in Montréal', 'UCI Road World Championships'],
  ])(
    'Tier C exact-start fallback keeps empirical mismatch %s ↔ %s constrained',
    (rssTitle, canonicalTitle) => {
      expect(
        matchTvgidsTipToSchedule(
          item({ title: rssTitle }),
          'nl-rtl-4',
          schedule([programme('programme-c', canonicalTitle)]),
        ),
      ).toMatchObject({
        status: 'matched',
        titleMismatch: true,
        signal: {
          programmeId: 'programme-c',
          matchedBy: 'channel-exact-start',
        },
      });
    },
  );

  it('rejects title mismatch plus non-exact start drift', () => {
    expect(
      matchTvgidsTipToSchedule(
        item({ title: 'Invasie' }),
        'nl-rtl-4',
        schedule([
          programme(
            'drift',
            'Invasion',
            new Date(Date.parse(START) + 2 * 60_000).toISOString(),
          ),
        ]),
      ),
    ).toEqual({
      status: 'unmatched',
      reason: 'title-mismatch-start-drift',
      titleMismatch: true,
    });
  });

  it('rejects an ambiguous Tier B candidate set', () => {
    expect(
      matchTvgidsTipToSchedule(
        item(),
        'nl-rtl-4',
        schedule([
          programme('one', 'Race Across the World'),
          programme('two', 'Race Across the World'),
        ]),
      ),
    ).toEqual({
      status: 'ambiguous',
      titleMismatch: false,
    });
  });
});
