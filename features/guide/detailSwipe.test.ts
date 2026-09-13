import { describe, expect, it } from 'vitest';

import { detailDragOffset, shouldDismissDetail } from './detailSwipe';

describe('detail drag offset', () => {
  it('follows downward movement without moving above the open position', () => {
    expect(detailDragOffset(50, 320)).toBe(50);
    expect(detailDragOffset(-30, 320)).toBe(0);
    expect(detailDragOffset(500, 320)).toBe(320);
  });
  it.each([0, -1, NaN, Infinity])('rejects an unavailable or invalid height: %s', (height) => {
    expect(detailDragOffset(100, height)).toBe(0);
    expect(shouldDismissDetail(100, 1200, height)).toBe(false);
  });
  it('rejects non-finite motion values', () => {
    expect(detailDragOffset(NaN, 320)).toBe(0);
    expect(shouldDismissDetail(Infinity, 0, 320)).toBe(false);
    expect(shouldDismissDetail(100, NaN, 320)).toBe(false);
  });
});

describe('detail swipe dismissal decision', () => {
  it('keeps taps and short tentative drags open', () => {
    expect(shouldDismissDetail(0, 0, 320)).toBe(false);
    expect(shouldDismissDetail(40, 0, 320)).toBe(false);
    expect(shouldDismissDetail(23, 2000, 320)).toBe(false);
  });
  it('dismisses after a deliberate drag or a shorter downward flick', () => {
    expect(shouldDismissDetail(79, 0, 320)).toBe(false);
    expect(shouldDismissDetail(80, 0, 320)).toBe(true);
    expect(shouldDismissDetail(24, 899, 320)).toBe(false);
    expect(shouldDismissDetail(24, 900, 320)).toBe(true);
  });
  it('bounds the distance requirement on short and tall sheets', () => {
    expect(shouldDismissDetail(71, 0, 200)).toBe(false);
    expect(shouldDismissDetail(72, 0, 200)).toBe(true);
    expect(shouldDismissDetail(139, 0, 900)).toBe(false);
    expect(shouldDismissDetail(140, 0, 900)).toBe(true);
  });
  it('does not dismiss for upward movement or a deliberate upward reversal', () => {
    expect(shouldDismissDetail(-40, -1200, 320)).toBe(false);
    expect(shouldDismissDetail(120, -500, 320)).toBe(false);
  });
});
