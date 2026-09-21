import { describe, expect, it } from 'vitest';

import { darkTheme, lightTheme } from '@/theme/tokens';

import {
  NOW_NEXT_STABLE_SCROLL_GEOMETRY,
  NOW_NEXT_TYPOGRAPHY,
  NOW_NEXT_VISUAL_METRICS,
  nowNextChannelRowLayout,
  nowNextChromeCondensedForProgress,
  nowNextCollapseProgressForScrollOffset,
  nowNextFollowingContentPlacement,
  nowNextFollowingLayoutMode,
  nowNextFollowingSlotHeight,
  nowNextFollowingTargetRects,
  nowNextMinimumTouchTarget,
  nowNextProgrammePressBackgroundColor,
  nowNextRailSlotPresentation,
  nowNextReferenceBlockHeight,
  nowNextSafeAreaLayout,
  nowNextStableScrollGeometry,
  nowNextStableScrollVisuals,
  nowNextUtilityContextLayout,
} from './nowNextLayout';

describe('Nu & Straks deterministic channel geometry', () => {
  it('uses canonical equal-height base rows on iOS and Android', () => {
    expect(nowNextChannelRowLayout('ios', 1, 266).rowHeight).toBe(216);
    expect(nowNextChannelRowLayout('android', 1, 266).rowHeight).toBe(228);

    const missingDataRow = nowNextChannelRowLayout('ios', 1, 266);
    const longTitleRow = nowNextChannelRowLayout('ios', 1, 266);
    expect(missingDataRow).toEqual(longTitleRow);
  });

  it('locks the final reference/following density without changing row totals', () => {
    expect(NOW_NEXT_VISUAL_METRICS.referenceProgrammeMinHeight).toBe(64);
    expect(NOW_NEXT_VISUAL_METRICS.referenceToFollowingGap).toBe(0);
    expect(NOW_NEXT_VISUAL_METRICS.channelBottomPadding).toBe(12);
    expect(nowNextChannelRowLayout('ios', 1, 266)).toMatchObject({
      referenceHeight: 64,
      followingHeight: 44,
      rowHeight: 216,
    });
    expect(nowNextChannelRowLayout('android', 1, 266)).toMatchObject({
      referenceHeight: 64,
      followingHeight: 48,
      rowHeight: 228,
    });
  });

  it('locks the canonical horizontal programme and rail geometry', () => {
    expect(
      NOW_NEXT_VISUAL_METRICS.channelLeftInset +
        NOW_NEXT_VISUAL_METRICS.channelIdentityWidth +
        NOW_NEXT_VISUAL_METRICS.channelProgrammeGap,
    ).toBe(NOW_NEXT_VISUAL_METRICS.programmeColumnX);
    expect(NOW_NEXT_VISUAL_METRICS.programmeColumnX).toBe(100);
    expect(NOW_NEXT_VISUAL_METRICS.programmeRightInset).toBe(24);
    expect(NOW_NEXT_VISUAL_METRICS.timeSlotWidth).toBe(48);
    expect(NOW_NEXT_VISUAL_METRICS.timeSlotHeight).toBe(48);
    expect(NOW_NEXT_VISUAL_METRICS.bottomClearance).toBe(16);
  });

  it('renders only whole/half labels and applies the frozen railTick hierarchy', () => {
    expect(nowNextRailSlotPresentation(0)).toEqual({
      showsLabel: true,
      tickHeight: 10,
      tickOpacity: 1,
    });
    expect(nowNextRailSlotPresentation(1)).toEqual({
      showsLabel: false,
      tickHeight: 6,
      tickOpacity: 0.78,
    });
    expect(nowNextRailSlotPresentation(2)).toEqual({
      showsLabel: true,
      tickHeight: 10,
      tickOpacity: 1,
    });
    expect(nowNextRailSlotPresentation(3)).toEqual({
      showsLabel: false,
      tickHeight: 6,
      tickOpacity: 0.78,
    });
    expect(NOW_NEXT_VISUAL_METRICS.railTickWidth).toBe(1);
    expect(NOW_NEXT_VISUAL_METRICS.railBaselineHeight).toBe(1);
    expect(NOW_NEXT_VISUAL_METRICS.railBaselineOpacity).toBe(0.78);
    expect(NOW_NEXT_VISUAL_METRICS.referenceMarkerWidth).toBe(2);
    expect(NOW_NEXT_VISUAL_METRICS.referenceMarkerHeight).toBe(12);
    expect(lightTheme.colors.railTick).toBe('#80807A');
    expect(darkTheme.colors.railTick).toBe('#72726B');
  });

  it('sizes the reference block for two uncapped title lines', () => {
    expect(nowNextReferenceBlockHeight(1)).toBe(64);
    expect(nowNextReferenceBlockHeight(1.35)).toBe(64);
    expect(nowNextReferenceBlockHeight(2)).toBe(88);
  });

  it('uses Instrument Sans static families for all Nu & Straks production typography', () => {
    for (const typography of Object.values(NOW_NEXT_TYPOGRAPHY)) {
      expect(typography.fontFamily).toMatch(/^InstrumentSans_/);
    }
  });

  it('enforces the platform following-programme target minima', () => {
    expect(nowNextMinimumTouchTarget('ios')).toBe(44);
    expect(nowNextMinimumTouchTarget('android')).toBe(48);
    expect(nowNextFollowingSlotHeight('ios', 1, 266)).toBe(44);
    expect(nowNextFollowingSlotHeight('android', 1, 266)).toBe(48);
  });

  it('uses canonical standard-text iOS content offsets 16 / 8 / 0', () => {
    expect(nowNextFollowingContentPlacement('ios', 1, 0)).toEqual({
      justifyContent: 'flex-start',
      topOffset: 16,
    });
    expect(nowNextFollowingContentPlacement('ios', 1, 1)).toEqual({
      justifyContent: 'flex-start',
      topOffset: 8,
    });
    expect(nowNextFollowingContentPlacement('ios', 1, 2)).toEqual({
      justifyContent: 'flex-start',
      topOffset: 0,
    });
  });

  it('uses canonical standard-text Android content offsets 19 / 9 / 0', () => {
    expect(nowNextFollowingContentPlacement('android', 1, 0)).toEqual({
      justifyContent: 'flex-start',
      topOffset: 19,
    });
    expect(nowNextFollowingContentPlacement('android', 1, 1)).toEqual({
      justifyContent: 'flex-start',
      topOffset: 9,
    });
    expect(nowNextFollowingContentPlacement('android', 1, 2)).toEqual({
      justifyContent: 'flex-start',
      topOffset: 0,
    });
  });

  it.each([
    ['ios', 44],
    ['android', 48],
  ] as const)(
    'keeps standard visible content inside each %s target through fontScale 1.35',
    (platform, targetHeight) => {
      for (const scale of [1, 1.35]) {
        for (const slotIndex of [0, 1, 2]) {
          const placement = nowNextFollowingContentPlacement(
            platform,
            scale,
            slotIndex,
          );
          const scaledVisibleHeight =
            NOW_NEXT_VISUAL_METRICS.followingStandardVisibleContentHeight *
            scale;
          expect(placement.topOffset + scaledVisibleHeight).toBeLessThanOrEqual(
            targetHeight,
          );
        }
      }
    },
  );

  it('centres Larger Text following content and applies no standard offset', () => {
    for (const scale of [1.351, 1.8, 2.1]) {
      for (const slotIndex of [0, 1, 2]) {
        expect(nowNextFollowingContentPlacement('ios', scale, slotIndex)).toEqual({
          justifyContent: 'center',
          topOffset: 0,
        });
      }
    }
  });

  it('preserves the physically accepted larger-text following modes', () => {
    expect(nowNextFollowingLayoutMode(1, 160)).toBe('standard');
    expect(nowNextFollowingLayoutMode(1.35, 160)).toBe('standard');
    expect(nowNextFollowingLayoutMode(1.351, 160)).toBe('inline-accessibility');
    expect(nowNextFollowingLayoutMode(1.8, 160)).toBe('inline-accessibility');
    expect(nowNextFollowingLayoutMode(2.01, 180)).toBe('inline-accessibility');
    expect(nowNextFollowingLayoutMode(2.01, 179.9)).toBe('stacked-fallback');
  });

  it('preserves the exact canonical larger-text height formulas', () => {
    expect(nowNextFollowingSlotHeight('ios', 1.8, 220)).toBe(80);
    expect(nowNextFollowingSlotHeight('android', 1.8, 220)).toBe(80);
    expect(nowNextFollowingSlotHeight('ios', 2.1, 179)).toBe(137);
  });

  it.each([
    ['ios', 1, 266],
    ['android', 1, 266],
    ['ios', 1.8, 220],
    ['android', 2.1, 179],
  ] as const)(
    'keeps adjacent following targets non-overlapping on %s at scale %s width %s',
    (platform, scale, width) => {
      const targets = nowNextFollowingTargetRects(platform, scale, width);
      expect(targets).toHaveLength(3);
      for (let index = 1; index < targets.length; index += 1) {
        expect(targets[index - 1]!.bottom).toBe(targets[index]!.top);
      }
    },
  );
});

describe('Nu & Straks final shared-shell geometry', () => {
  it('uses one 52-pt utility context and a 104-pt persistent stack at every font scale', () => {
    expect(nowNextUtilityContextLayout()).toEqual({
      height: 52,
      functionalStackHeight: 104,
    });
    expect(NOW_NEXT_VISUAL_METRICS.utilityContextHeight).toBe(52);
    expect(NOW_NEXT_VISUAL_METRICS.timeRailHeight).toBe(52);
    expect(NOW_NEXT_VISUAL_METRICS.functionalStackHeight).toBe(104);
    expect(NOW_NEXT_VISUAL_METRICS).not.toHaveProperty(
      'accessibilityReferenceContextHeight',
    );
    expect(NOW_NEXT_VISUAL_METRICS).not.toHaveProperty(
      'accessibilityFunctionalStackHeight',
    );
  });

  it('keeps native collapse at 56 with 44/60 responsive GuideChrome compensation', () => {
    expect(NOW_NEXT_STABLE_SCROLL_GEOMETRY).toEqual({
      viewportTop: 104,
      contentTopInset: 100,
      scrollCompensation: 44,
    });
    expect(nowNextStableScrollGeometry(1.8)).toEqual({
      viewportTop: 104,
      contentTopInset: 116,
      scrollCompensation: 60,
    });
    expect(NOW_NEXT_VISUAL_METRICS.collapseDistance).toBe(56);
  });

  it('resolves canonical 204/104 standard and 220/104 Larger Text overlay endpoints', () => {
    expect(nowNextStableScrollVisuals(0, 1)).toEqual({
      guideChromeHeight: 100,
      overlayBottom: 204,
      contentTranslateY: 0,
    });
    expect(nowNextStableScrollVisuals(1, 1)).toEqual({
      guideChromeHeight: 0,
      overlayBottom: 104,
      contentTranslateY: -44,
    });
    expect(nowNextStableScrollVisuals(0, 1.8)).toEqual({
      guideChromeHeight: 116,
      overlayBottom: 220,
      contentTranslateY: 0,
    });
    expect(nowNextStableScrollVisuals(1, 1.8)).toEqual({
      guideChromeHeight: 0,
      overlayBottom: 104,
      contentTranslateY: -60,
    });
  });

  it.each([
    [1, 100],
    [1.8, 116],
  ] as const)(
    'keeps the channel anchor aligned throughout collapse at fontScale %s',
    (fontScale, contentTopInset) => {
      for (const y of [0, 14, 28, 42, 56]) {
        const progress = nowNextCollapseProgressForScrollOffset(y, false);
        const visuals = nowNextStableScrollVisuals(progress, fontScale);
        const rowTop =
          104 + contentTopInset - y + visuals.contentTranslateY;
        expect(rowTop).toBeCloseTo(visuals.overlayBottom, 6);
      }
    },
  );

  it('uses the canonical discrete Reduce Motion switch at 28 pt', () => {
    expect(nowNextCollapseProgressForScrollOffset(27.9, true)).toBe(0);
    expect(nowNextCollapseProgressForScrollOffset(28, true)).toBe(1);
    expect(nowNextChromeCondensedForProgress(0.49)).toBe(false);
    expect(nowNextChromeCondensedForProgress(0.5)).toBe(true);
  });

  it('applies the top safe area exactly once with the same 104-pt viewport at all scales', () => {
    expect(nowNextSafeAreaLayout(59, 1)).toEqual({
      overlayTop: 59,
      channelViewportTop: 163,
    });
    expect(nowNextSafeAreaLayout(59, 1.8)).toEqual({
      overlayTop: 59,
      channelViewportTop: 163,
    });
  });
});

describe('Nu & Straks semantic interaction tokens', () => {
  it('uses the semantic surface token as temporary programme press fill in both themes', () => {
    expect(
      nowNextProgrammePressBackgroundColor(true, lightTheme.colors.surface),
    ).toBe(lightTheme.colors.surface);
    expect(
      nowNextProgrammePressBackgroundColor(true, darkTheme.colors.surface),
    ).toBe(darkTheme.colors.surface);
    expect(
      nowNextProgrammePressBackgroundColor(false, darkTheme.colors.surface),
    ).toBe('transparent');
  });
});
