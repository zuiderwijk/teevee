import { describe, expect, it } from 'vitest';

import { programmeDetailTemporalState } from './useProgrammeDetailClock';

describe('Programme Detail temporal state', () => {
  const startAt = '2026-09-18T18:00:00.000Z';
  const endAt = '2026-09-18T19:00:00.000Z';
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);

  it('changes reminder and current semantics exactly at start/end boundaries', () => {
    expect(programmeDetailTemporalState(startAt, endAt, startMs - 1)).toEqual({
      reminderAvailable: true,
      current: false,
      nextBoundaryMs: startMs,
    });
    expect(programmeDetailTemporalState(startAt, endAt, startMs)).toEqual({
      reminderAvailable: false,
      current: true,
      nextBoundaryMs: endMs,
    });
    expect(programmeDetailTemporalState(startAt, endAt, endMs)).toEqual({
      reminderAvailable: false,
      current: false,
      nextBoundaryMs: null,
    });
  });

  it('fails closed for invalid programme ranges', () => {
    expect(programmeDetailTemporalState('invalid', endAt, startMs)).toEqual({
      reminderAvailable: false,
      current: false,
      nextBoundaryMs: null,
    });
  });
});
