import { describe, expect, it } from 'vitest';

import { darkTheme, lightTheme } from '@/theme/tokens';

import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_EDITORIAL_TYPOGRAPHY,
  guideChromeExpandedHeight,
  guidePresentationNavigationMetrics,
  currentProgrammeRowHeight,
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
    expect(PER_CHANNEL_VISUAL_METRICS.kijktipRadius).toBe(6);
    expect(PER_CHANNEL_VISUAL_METRICS.kijktipMinOuterWidth).toBe(56);
    expect(perChannelKijktipLabelOuterWidth(32, 28)).toBe(56);
    expect(perChannelKijktipLabelOuterWidth(52, 40)).toBe(68);
  });

  it.each([
    [1, 52, 7],
    [1.35, 70, 9.7],
    [1.5, 78, 11],
    [2, 104, 15],
  ] as const)(
    'fills the frozen standard row with calibrated Per-zender Kijktip breathing at S=%s',
    (scale, expectedRowHeight, expectedBreathing) => {
      const geometry = perChannelKijktipStackGeometry(scale);
      expect(geometry.surfaceLeft).toBe(16);
      expect(geometry.contentOriginX).toBe(24);
      expect(geometry.surfaceTop).toBe(0);
      expect(geometry.rowHeight).toBe(expectedRowHeight);
      expect(geometry.outerHeight).toBe(expectedRowHeight);
      expect(geometry.verticalBreathing).toBeCloseTo(expectedBreathing, 6);
      expect(geometry.timeTop).toBeCloseTo(expectedBreathing, 6);
      expect(geometry.timeLineHeight).toBeCloseTo(20 * scale, 6);
      expect(geometry.labelTop).toBeCloseTo(
        expectedBreathing + 20 * scale + 2,
        6,
      );
      expect(geometry.labelLineHeight).toBeCloseTo(16 * scale, 6);
      expect(geometry.contentHeight).toBeCloseTo(36 * scale + 2, 6);
      expect(
        geometry.verticalBreathing * 2 + geometry.contentHeight,
      ).toBeCloseTo(expectedRowHeight, 6);
      expect(geometry.minOuterWidth).toBe(56);
      expect(geometry.paddingX).toBe(8);
      expect(geometry.radius).toBe(6);
    },
  );

  it('uses S1 7/20/2/16/7 inside the exact 52-pt standard surface', () => {
    expect(perChannelKijktipStackGeometry(1)).toMatchObject({
      rowHeight: 52,
      surfaceLeft: 16,
      contentOriginX: 24,
      surfaceTop: 0,
      verticalBreathing: 7,
      timeTop: 7,
      timeLineHeight: 20,
      labelTop: 29,
      labelLineHeight: 16,
      contentHeight: 38,
      outerHeight: 52,
    });
  });

  it('anchors the current surface at the existing current-content origin without moving current content', () => {
    expect(perChannelCurrentKijktipGeometry(1)).toEqual({
      surfaceLeft: 16,
      contentOriginX: 24,
      surfaceTop: 14,
      verticalBreathing: 7,
      timeTop: 21,
      timeLineHeight: 20,
      labelTop: 43,
      labelLineHeight: 16,
      contentHeight: 38,
      outerHeight: 52,
      surfaceBottom: 66,
      minOuterWidth: 56,
      paddingX: 8,
      radius: 6,
    });
    expect(perChannelCurrentKijktipGeometry(1.5)).toEqual({
      surfaceLeft: 16,
      contentOriginX: 24,
      surfaceTop: 14,
      verticalBreathing: 11,
      timeTop: 25,
      timeLineHeight: 30,
      labelTop: 57,
      labelLineHeight: 24,
      contentHeight: 56,
      outerHeight: 78,
      surfaceBottom: 92,
      minOuterWidth: 56,
      paddingX: 8,
      radius: 6,
    });
  });

  it.each([1, 1.35, 1.5, 2] as const)(
    'keeps the current Kijktip surface inside the existing current-row authority at S=%s',
    (scale) => {
      const geometry = perChannelCurrentKijktipGeometry(scale);
      expect(geometry.surfaceBottom).toBeLessThanOrEqual(
        currentProgrammeRowHeight(scale),
      );
    },
  );
});
