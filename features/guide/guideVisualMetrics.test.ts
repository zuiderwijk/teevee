import { describe, expect, it } from 'vitest';

import { darkTheme, lightTheme } from '@/theme/tokens';

import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_EDITORIAL_TYPOGRAPHY,
  guideChromeExpandedHeight,
  guidePresentationNavigationMetrics,
  perChannelCurrentKijktipGeometry,
  perChannelKijktipLabelOuterWidth,
  perChannelKijktipStackGeometry,
  PER_CHANNEL_VISUAL_METRICS,
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
    expect(lightTheme.colors.onCurrentTime).toBe('#0D0D0D');
    expect(darkTheme.colors.onCurrentTime).toBe('#0D0D0D');
    expect(lightTheme.colors.editorialAccent).toBe('#315A63');
    expect(darkTheme.colors.editorialAccent).toBe('#A9C9CF');
    expect(lightTheme.colors.editorialAccentSurface).toBe('#E4ECEE');
    expect(darkTheme.colors.editorialAccentSurface).toBe('#1C2527');
  });
});


describe('shared Kijktip editorial typography and Per-zender geometry', () => {
  it('uses one uncapped 12/16 Medium editorial typography token', () => {
    expect(GUIDE_EDITORIAL_TYPOGRAPHY.kijktip).toMatchObject({
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0,
    });
    expect(GUIDE_EDITORIAL_TYPOGRAPHY.kijktip.fontFamily).toMatch(
      /^InstrumentSans_/,
    );
  });

  it('freezes Per-zender editorial-label padding, radius and intrinsic width formula', () => {
    expect(PER_CHANNEL_VISUAL_METRICS.kijktipPaddingX).toBe(8);
    expect(PER_CHANNEL_VISUAL_METRICS.kijktipPaddingY).toBe(0);
    expect(PER_CHANNEL_VISUAL_METRICS.kijktipRadius).toBe(6);
    expect(PER_CHANNEL_VISUAL_METRICS.kijktipMinOuterWidth).toBe(56);
    expect(perChannelKijktipLabelOuterWidth(32, 28)).toBe(56);
    expect(perChannelKijktipLabelOuterWidth(52, 40)).toBe(68);
  });

  it.each([
    [1, 7],
    [1.35, 9.7],
    [1.5, 11],
    [2, 15],
  ] as const)(
    'keeps the standard Per-zender Kijktip stack inside the frozen row at S=%s',
    (scale, expectedTop) => {
      const geometry = perChannelKijktipStackGeometry(scale);
      expect(geometry.stackTop).toBeCloseTo(expectedTop, 6);
      expect(geometry.labelTop).toBeCloseTo(
        expectedTop + 20 * scale + 2,
        6,
      );
      expect(geometry.rowHeight).toBe(Math.round(52 * scale));
      expect(geometry.stackHeight).toBeCloseTo(36 * scale + 2, 6);
      expect(geometry.outerHeight).toBeCloseTo(36 * scale + 2, 6);
      expect(geometry.minOuterWidth).toBe(56);
      expect(geometry.paddingX).toBe(8);
      expect(geometry.paddingY).toBe(0);
      expect(geometry.radius).toBe(6);
    },
  );

  it('keeps current-row title/time ownership frozen while placing Kijktip below time', () => {
    expect(perChannelCurrentKijktipGeometry(1)).toEqual({
      timeTop: 14,
      timeLineHeight: 20,
      labelTop: 36,
      labelLineHeight: 16,
      outerHeight: 38,
      minOuterWidth: 56,
      paddingX: 8,
      paddingY: 0,
      radius: 6,
    });
    expect(perChannelCurrentKijktipGeometry(1.5)).toEqual({
      timeTop: 14,
      timeLineHeight: 30,
      labelTop: 46,
      labelLineHeight: 24,
      outerHeight: 56,
      minOuterWidth: 56,
      paddingX: 8,
      paddingY: 0,
      radius: 6,
    });
  });
});
