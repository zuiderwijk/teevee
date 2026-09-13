import { describe, expect, it } from 'vitest';

import type { Programme } from '@/data/domain/epg';

import { edgeReadableProgramme, visibleRowRange } from './edgeReadability';

const windowStart = Date.parse('2026-09-13T08:00:00Z');
const programme: Programme = {
  id: 'programme-1',
  channelId: 'channel-1',
  title: 'Testprogramma',
  startAt: '2026-09-13T08:00:00Z',
  endAt: '2026-09-13T09:00:00Z',
};

describe('edgeReadableProgramme', () => {
  it('returns the programme crossing the left viewport edge without changing its frame', () => {
    const result = edgeReadableProgramme([programme], 30, 120, windowStart, 3);

    expect(result).not.toBeNull();
    expect(result?.frame).toEqual({ left: 0, width: 178 });
    expect(result?.hiddenLeft).toBe(30);
    expect(result?.visibleWidth).toBe(120);
    expect(result?.endsInViewport).toBe(false);
  });

  it('reports the true remaining width when the programme end is visible', () => {
    const result = edgeReadableProgramme([programme], 100, 120, windowStart, 3);

    expect(result?.visibleWidth).toBe(78);
    expect(result?.endsInViewport).toBe(true);
  });

  it('returns null before the programme start, at its exact start and after its end', () => {
    expect(edgeReadableProgramme([programme], 0, 120, windowStart, 3)).toBeNull();
    expect(edgeReadableProgramme([programme], 178, 120, windowStart, 3)).toBeNull();
    expect(edgeReadableProgramme([programme], 300, 120, windowStart, 3)).toBeNull();
  });
});

describe('visibleRowRange', () => {
  it('limits rendering to the visible rows plus small overscan', () => {
    expect(visibleRowRange(160, 240, 80, 48, 1)).toEqual({ first: 1, last: 6 });
  });

  it('clamps to the first and last available row', () => {
    expect(visibleRowRange(0, 160, 80, 3, 1)).toEqual({ first: 0, last: 2 });
    expect(visibleRowRange(800, 160, 80, 3, 1)).toEqual({ first: 2, last: 2 });
  });

  it('returns null for unusable geometry', () => {
    expect(visibleRowRange(0, 0, 80, 48)).toBeNull();
    expect(visibleRowRange(0, 100, 0, 48)).toBeNull();
    expect(visibleRowRange(0, 100, 80, 0)).toBeNull();
  });
});
