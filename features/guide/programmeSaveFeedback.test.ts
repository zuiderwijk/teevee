import { describe, expect, it } from 'vitest';

import type { Programme } from '@/data/domain/epg';

import { programmeSaveFeedback } from './programmeSaveFeedback';

function programme(
  id: string,
  startAt: string,
  endAt: string,
): Programme {
  return {
    id,
    channelId: 'nl-npo-1',
    startAt,
    endAt,
    title: id,
  };
}

describe('Programme Detail Bewaar feedback', () => {
  const nowMs = Date.parse('2026-09-23T12:00:00+02:00');

  it('connects an active-evening save to Jouw gids', () => {
    const item = programme(
      'active-evening',
      '2026-09-23T20:30:00+02:00',
      '2026-09-23T21:30:00+02:00',
    );
    expect(programmeSaveFeedback(item, true, nowMs)).toBe(
      'Bewaard in Jouw gids',
    );
    expect(programmeSaveFeedback(item, false, nowMs)).toBe(
      'Niet meer in Jouw gids',
    );
  });

  it('uses the television-evening weekday for a future after-midnight broadcast', () => {
    const item = programme(
      'future-after-midnight',
      '2026-09-27T01:00:00+02:00',
      '2026-09-27T02:00:00+02:00',
    );
    expect(programmeSaveFeedback(item, true, nowMs)).toBe(
      'Bewaard voor zaterdagavond',
    );
  });

  it('uses neutral feedback when the saved broadcast is not part of an evening window', () => {
    const item = programme(
      'future-daytime',
      '2026-09-25T12:00:00+02:00',
      '2026-09-25T13:00:00+02:00',
    );
    expect(programmeSaveFeedback(item, true, nowMs)).toBe('Programma bewaard');
    expect(programmeSaveFeedback(item, false, nowMs)).toBe('Niet meer bewaard');
  });
});
