import { describe, expect, it } from 'vitest';

import type { Programme } from '@/data/domain/epg';
import {
  buildTimeTicks,
  programmeContentMode,
  programmeFrame,
  programmeVisibleContent,
  timeToX,
  timelineWidth,
} from './geometry';

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

  it('preserves sub-minute precision for the current-time marker', () => {
    expect(timeToX(start + 45_000, start, 3)).toBeCloseTo(2.25, 8);
  });

  it('maps programme start and duration to a frame', () => {
    expect(programmeFrame(programme, start, 3)).toEqual({ left: 90, width: 180 });
  });

  it('calculates the complete timeline width', () => {
    expect(timelineWidth(start, start + 6 * 60 * 60_000, 3)).toBe(1080);
  });

  it('builds stable 15-minute ticks', () => {
    expect(buildTimeTicks(start, start + 60 * 60_000)).toEqual([
      start,
      start + 15 * 60_000,
      start + 30 * 60_000,
      start + 45 * 60_000,
      start + 60 * 60_000,
    ]);
  });

  it('maps 15/30-minute broadcasts to exact 45/90-pt real-duration frames without a card gap', () => {
    const fifteen: Programme = {
      ...programme,
      id: 'fifteen',
      startAt: '2026-09-11T18:00:00.000Z',
      endAt: '2026-09-11T18:15:00.000Z',
    };
    const thirty: Programme = {
      ...programme,
      id: 'thirty',
      startAt: '2026-09-11T18:00:00.000Z',
      endAt: '2026-09-11T18:30:00.000Z',
    };

    expect(programmeFrame(fifteen, start, 3).width).toBe(45);
    expect(programmeFrame(thirty, start, 3).width).toBe(90);
  });

  it('chooses a deterministic content mode for narrow programme cells', () => {
    expect(programmeContentMode(45)).toBe('compact');
    expect(programmeContentMode(90)).toBe('standard');
    expect(programmeContentMode(180)).toBe('comfortable');
  });

  it('keeps programme geometry fixed while moving text into the visible remainder', () => {
    const frame = { left: 100, width: 180 };

    expect(programmeVisibleContent(frame, 160)).toEqual({
      contentTranslateX: 60,
      visibleWidth: 120,
      canShowStartTime: true,
    });
    expect(frame).toEqual({ left: 100, width: 180 });
  });

  it('hides the start-time label before it can be shown as a clipped fragment', () => {
    const frame = { left: 100, width: 180 };

    expect(programmeVisibleContent(frame, 230)).toEqual({
      contentTranslateX: 130,
      visibleWidth: 50,
      canShowStartTime: false,
    });
  });

  it('does not shift programme content before the viewport reaches the programme', () => {
    expect(programmeVisibleContent({ left: 100, width: 180 }, 80)).toEqual({
      contentTranslateX: 0,
      visibleWidth: 180,
      canShowStartTime: true,
    });
  });

  it('does not collapse text when a stale settled viewport is already past the programme', () => {
    expect(programmeVisibleContent({ left: 100, width: 180 }, 400)).toEqual({
      contentTranslateX: 0,
      visibleWidth: 180,
      canShowStartTime: true,
    });
  });

  it('restores full content at the exact programme end boundary', () => {
    expect(programmeVisibleContent({ left: 100, width: 180 }, 280)).toEqual({
      contentTranslateX: 0,
      visibleWidth: 180,
      canShowStartTime: true,
    });
  });
});
