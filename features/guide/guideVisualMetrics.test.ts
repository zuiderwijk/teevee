import { describe, expect, it } from 'vitest';

import { darkTheme, lightTheme } from '@/theme/tokens';

import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  guideChromeExpandedHeight,
  guidePresentationNavigationMetrics,
} from './guideVisualMetrics';

describe('shared Guide responsive chrome', () => {
  it('keeps 48 pt one-line tabs through 1.35 and uses 64 pt two-line tabs above it', () => {
    expect(guidePresentationNavigationMetrics(1)).toEqual({
      accessibility: false,
      height: 48,
      maxLines: 1,
    });
    expect(guidePresentationNavigationMetrics(1.35)).toEqual({
      accessibility: false,
      height: 48,
      maxLines: 1,
    });
    expect(guidePresentationNavigationMetrics(1.351)).toEqual({
      accessibility: true,
      height: 64,
      maxLines: 2,
    });
    expect(COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER).toBe(1.2);
  });

  it('derives 100 pt standard and 116 pt accessibility GuideChrome heights', () => {
    expect(guideChromeExpandedHeight(1.35)).toBe(100);
    expect(guideChromeExpandedHeight(1.351)).toBe(116);
  });

  it('uses dedicated physical rail-tick semantics without changing global border colours', () => {
    expect(lightTheme.colors.railTick).toBe('#80807A');
    expect(darkTheme.colors.railTick).toBe('#72726B');
    expect(lightTheme.colors.border).toBe('#E4E4E0');
    expect(darkTheme.colors.border).toBe('#30302D');
  });
});
