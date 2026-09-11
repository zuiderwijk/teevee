import { describe, expect, it } from 'vitest';

import type { Programme } from '@/data/domain/epg';
import { buildTimeTicks, programmeContentMode, programmeFrame, timeToX, timelineWidth } from './geometry';

const start = Date.parse('2026-09-11T18:00:00.000Z');

const programme: Programme = {
  id: 'geometry-test',
  channelId: 'channel-1',
  startAt: '2026-09-11T18:30:00.000Z',
  endAt: '2026-09-11T19:30:00.000Z',
  title: 'Geometry test',
};

describe('Guide timeline geometry', () => {
  it('maps time deterministically to horizontal pixels', () => {
    expect(timeToX(start + 30 * 60_000, start, 3)).toBe(90);
  });

  it('maps programme start and duration to a frame', () => {
    expect(programmeFrame(programme, start, 3)).toEqual({ left: 90, width: 178 });
  });

  it('calculates the complete timeline width', () => {
    expect(timelineWidth(start, start + 6 * 60 * 60_000, 3)).toBe(1080);
  });

  it('builds stable half-hour ticks', () => {
    expect(buildTimeTicks(start, start + 90 * 60_000)).toEqual([
      start,
      start + 30 * 60_000,
      start + 60 * 60_000,
      start + 90 * 60_000,
    ]);
  });

  it('chooses a deterministic content mode for narrow programme cells', () => {
    expect(programmeContentMode(45)).toBe('compact');
    expect(programmeContentMode(90)).toBe('standard');
    expect(programmeContentMode(180)).toBe('comfortable');
  });
});
