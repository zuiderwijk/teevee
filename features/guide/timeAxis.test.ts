import { describe, expect, it } from 'vitest';

import {
  centredTimeAxisLabelLeft,
  clippedTimeAxisLabelWidth,
} from './timeAxis';

describe('centred time-axis labels', () => {
  it('centres the label box exactly on its tick', () => {
    expect(centredTimeAxisLabelLeft(48)).toBe(-24);
    expect(centredTimeAxisLabelLeft(72)).toBe(-36);
  });
});

describe('clippedTimeAxisLabelWidth', () => {
  const firstTickX = 0;
  const tickSpacing = 90;
  const labelWidth = 72;

  it('covers the clipped half of a centred label at the timeline left boundary', () => {
    expect(clippedTimeAxisLabelWidth(0, firstTickX, tickSpacing, labelWidth)).toBe(36);
    expect(clippedTimeAxisLabelWidth(35, firstTickX, tickSpacing, labelWidth)).toBe(1);
    expect(clippedTimeAxisLabelWidth(36, firstTickX, tickSpacing, labelWidth)).toBe(0);
  });

  it('keeps whitespace clear before the next centred label reaches the viewport edge', () => {
    expect(clippedTimeAxisLabelWidth(53, firstTickX, tickSpacing, labelWidth)).toBe(0);
    expect(clippedTimeAxisLabelWidth(54, firstTickX, tickSpacing, labelWidth)).toBe(0);
  });

  it('covers the complete visible remainder once a following centred label starts clipping', () => {
    expect(clippedTimeAxisLabelWidth(55, firstTickX, tickSpacing, labelWidth)).toBe(71);
    expect(clippedTimeAxisLabelWidth(90, firstTickX, tickSpacing, labelWidth)).toBe(36);
    expect(clippedTimeAxisLabelWidth(126, firstTickX, tickSpacing, labelWidth)).toBe(0);
  });

  it('clamps negative bounce offsets to the real left-edge centred-label geometry', () => {
    expect(clippedTimeAxisLabelWidth(-20, firstTickX, tickSpacing, labelWidth)).toBe(36);
  });

  it('supports larger centred label boxes without changing the invariant', () => {
    expect(clippedTimeAxisLabelWidth(0, 0, 126, 108)).toBe(54);
    expect(clippedTimeAxisLabelWidth(53, 0, 126, 108)).toBe(1);
    expect(clippedTimeAxisLabelWidth(54, 0, 126, 108)).toBe(0);
    expect(clippedTimeAxisLabelWidth(73, 0, 126, 108)).toBe(107);
  });
});
