import { describe, expect, it } from 'vitest';

import { guideDayOffsetForViewport } from './dayNavigation';

describe('guideDayOffsetForViewport', () => {
  it('stays on today before the tomorrow boundary', () => {
    expect(guideDayOffsetForViewport(899.9, 900)).toBe(0);
  });

  it('switches to tomorrow exactly at the boundary and beyond it', () => {
    expect(guideDayOffsetForViewport(900, 900)).toBe(1);
    expect(guideDayOffsetForViewport(1200, 900)).toBe(1);
  });
});
