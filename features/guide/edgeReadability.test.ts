import { describe, expect, it } from 'vitest';

import type { Programme } from '@/data/domain/epg';

import {
  edgeBoundaryBucket,
  edgeBoundaryXs,
  edgeReadableProgramme,
} from './edgeReadability';

const windowStart = Date.parse('2026-09-13T08:00:00Z');
const programme: Programme = {
  id: 'programme-1',
  channelId: 'channel-1',
  title: 'Testprogramma',
  startAt: '2026-09-13T08:00:00Z',
  endAt: '2026-09-13T09:00:00Z',
};
const nextProgramme: Programme = {
  id: 'programme-2',
  channelId: 'channel-1',
  title: 'Volgend programma',
  startAt: '2026-09-13T09:00:00Z',
  endAt: '2026-09-13T09:30:00Z',
};

describe('edgeReadableProgramme', () => {
  it('returns the programme crossing the left viewport edge without changing its frame', () => {
    const result = edgeReadableProgramme([programme], 30, 120, windowStart, 3);

    expect(result).not.toBeNull();
    expect(result?.frame).toEqual({ left: 0, width: 180 });
    expect(result?.hiddenLeft).toBe(30);
    expect(result?.visibleWidth).toBe(120);
    expect(result?.endsInViewport).toBe(false);
  });

  it('reports the true remaining width when the programme end is visible', () => {
    const result = edgeReadableProgramme([programme], 100, 120, windowStart, 3);

    expect(result?.visibleWidth).toBe(80);
    expect(result?.endsInViewport).toBe(true);
  });

  it('returns null before the programme start, at its exact start and after its end', () => {
    expect(edgeReadableProgramme([programme], 0, 120, windowStart, 3)).toBeNull();
    expect(edgeReadableProgramme([programme], 180, 120, windowStart, 3)).toBeNull();
    expect(edgeReadableProgramme([programme], 300, 120, windowStart, 3)).toBeNull();
  });
});

describe('edge boundary switching', () => {
  it('builds sorted real programme start/end boundaries without a synthetic card gap', () => {
    expect(edgeBoundaryXs([programme, nextProgramme], windowStart, 3)).toEqual([0, 180, 270]);
  });

  it('adds only content-degradation crossings that lie inside a real programme frame', () => {
    expect(
      edgeBoundaryXs(
        [programme, nextProgramme],
        windowStart,
        3,
        [64, 126],
      ),
    ).toEqual([0, 54, 116, 180, 206, 270]);
  });

  it('changes buckets only after crossing a boundary, not merely reaching it', () => {
    const boundaries = [0, 180, 270];

    expect(edgeBoundaryBucket(boundaries, 0)).toBe(-1);
    expect(edgeBoundaryBucket(boundaries, 0.1)).toBe(0);
    expect(edgeBoundaryBucket(boundaries, 180)).toBe(0);
    expect(edgeBoundaryBucket(boundaries, 180.1)).toBe(1);
    expect(edgeBoundaryBucket(boundaries, 270)).toBe(1);
    expect(edgeBoundaryBucket(boundaries, 270.1)).toBe(2);
    expect(edgeBoundaryBucket(boundaries, 500)).toBe(2);
  });

  it('clamps invalid or negative viewport positions to the left edge', () => {
    expect(edgeBoundaryBucket([0, 100], -20)).toBe(-1);
    expect(edgeBoundaryBucket([0, 100], Number.NaN)).toBe(-1);
  });
});
