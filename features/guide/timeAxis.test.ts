import { describe, expect, it } from 'vitest';

import { clippedTimeAxisLabelWidth } from './timeAxis';

describe('clippedTimeAxisLabelWidth', () => {
  const firstTickX = 0;
  const tickSpacing = 90;
  const labelWidth = 72;

  it('does not cover a label while its text starts inside the viewport', () => {
    expect(clippedTimeAxisLabelWidth(5, firstTickX, tickSpacing, labelWidth)).toBe(0);
  });

  it('covers the complete visible remainder once the left label starts clipping', () => {
    expect(clippedTimeAxisLabelWidth(7, firstTickX, tickSpacing, labelWidth)).toBe(71);
    expect(clippedTimeAxisLabelWidth(30, firstTickX, tickSpacing, labelWidth)).toBe(48);
  });

  it('stops covering after the clipped label has fully left the viewport', () => {
    expect(clippedTimeAxisLabelWidth(78, firstTickX, tickSpacing, labelWidth)).toBe(0);
    expect(clippedTimeAxisLabelWidth(85, firstTickX, tickSpacing, labelWidth)).toBe(0);
  });

  it('repeats the same masking geometry for following half-hour labels', () => {
    expect(clippedTimeAxisLabelWidth(97, firstTickX, tickSpacing, labelWidth)).toBe(71);
    expect(clippedTimeAxisLabelWidth(120, firstTickX, tickSpacing, labelWidth)).toBe(48);
  });

  it('keeps exact label-start boundaries fully visible', () => {
    expect(clippedTimeAxisLabelWidth(6, firstTickX, tickSpacing, labelWidth)).toBe(0);
    expect(clippedTimeAxisLabelWidth(96, firstTickX, tickSpacing, labelWidth)).toBe(0);
  });

  it('clamps negative bounce offsets to the real left edge', () => {
    expect(clippedTimeAxisLabelWidth(-20, firstTickX, tickSpacing, labelWidth)).toBe(0);
  });

  it('supports larger text metrics without changing the invariant', () => {
    expect(clippedTimeAxisLabelWidth(8, 0, 126, 108)).toBe(106);
    expect(clippedTimeAxisLabelWidth(114, 0, 126, 108)).toBe(0);
  });
});
