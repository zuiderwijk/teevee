import { describe, expect, it } from 'vitest';

import { darkTheme, lightTheme } from '@/theme/tokens';

import {
  NOW_NEXT_STABLE_SCROLL_GEOMETRY,
  NOW_NEXT_VISUAL_METRICS,
  nowNextChannelRowLayout,
  nowNextChromeCondensedForProgress,
  nowNextCollapseProgressForScrollOffset,
  nowNextFollowingLayoutMode,
  nowNextFollowingTargetRects,
  nowNextMinimumTouchTarget,
  nowNextProgrammePressBackgroundColor,
  nowNextSafeAreaLayout,
  nowNextStableScrollVisuals,
} from './nowNextLayout';

describe('Nu & Straks deterministic channel geometry', () => {
  it('uses canonical equal-height base rows on iOS and Android', () => {
    expect(nowNextChannelRowLayout('ios', 1).rowHeight).toBe(228);
    expect(nowNextChannelRowLayout('android', 1).rowHeight).toBe(240);

    const missingDataRow = nowNextChannelRowLayout('ios', 1);
    const longTitleRow = nowNextChannelRowLayout('ios', 1);
    expect(missingDataRow).toEqual(longTitleRow);
  });

  it('enforces the platform following-programme target minima', () => {
    expect(nowNextMinimumTouchTarget('ios')).toBe(44);
    expect(nowNextMinimumTouchTarget('android')).toBe(48);
    expect(nowNextChannelRowLayout('ios', 1).followingHeight).toBeGreaterThanOrEqual(44);
    expect(nowNextChannelRowLayout('android', 1).followingHeight).toBeGreaterThanOrEqual(48);
  });

  it.each([
    ['ios', 1],
    ['android', 1],
    ['ios', 1.35],
    ['android', 1.8],
  ] as const)('keeps adjacent following targets non-overlapping on %s at %s', (platform, scale) => {
    const targets = nowNextFollowingTargetRects(platform, scale);
    expect(targets).toHaveLength(3);
    for (let index = 1; index < targets.length; index += 1) {
      expect(targets[index - 1]!.bottom).toBeLessThanOrEqual(targets[index]!.top);
    }
  });

  it('uses horizontal following content through 1.35 and stacked content above it', () => {
    expect(nowNextFollowingLayoutMode(1)).toBe('horizontal');
    expect(nowNextFollowingLayoutMode(1.35)).toBe('horizontal');
    expect(nowNextFollowingLayoutMode(1.351)).toBe('stacked');
    expect(nowNextChannelRowLayout('ios', 1.8).rowHeight).toBeGreaterThan(228);
  });
});

describe('Nu & Straks shared-shell geometry', () => {
  it('keeps the persistent reference context plus time rail exactly 104 pt', () => {
    expect(NOW_NEXT_VISUAL_METRICS.referenceContextHeight).toBe(52);
    expect(NOW_NEXT_VISUAL_METRICS.timeRailHeight).toBe(52);
    expect(NOW_NEXT_VISUAL_METRICS.functionalStackHeight).toBe(104);
  });

  it('uses 56 pt native collapse with 44 pt visual compensation', () => {
    expect(NOW_NEXT_STABLE_SCROLL_GEOMETRY.contentTopInset).toBe(100);
    expect(NOW_NEXT_STABLE_SCROLL_GEOMETRY.scrollCompensation).toBe(44);

    expect(nowNextStableScrollVisuals(0)).toEqual({
      guideChromeHeight: 100,
      overlayBottom: 204,
      contentTranslateY: 0,
    });
    expect(nowNextStableScrollVisuals(1)).toEqual({
      guideChromeHeight: 0,
      overlayBottom: 104,
      contentTranslateY: -44,
    });
  });

  it('keeps the channel anchor aligned throughout normal-motion collapse', () => {
    for (const y of [0, 14, 28, 42, 56]) {
      const progress = nowNextCollapseProgressForScrollOffset(y, false);
      const visuals = nowNextStableScrollVisuals(progress);
      const rowTop =
        NOW_NEXT_STABLE_SCROLL_GEOMETRY.viewportTop +
        NOW_NEXT_STABLE_SCROLL_GEOMETRY.contentTopInset -
        y +
        visuals.contentTranslateY;
      expect(rowTop).toBeCloseTo(visuals.overlayBottom, 6);
    }
  });

  it('uses the canonical discrete Reduce Motion switch at 28 pt', () => {
    expect(nowNextCollapseProgressForScrollOffset(27.9, true)).toBe(0);
    expect(nowNextCollapseProgressForScrollOffset(28, true)).toBe(1);
    expect(nowNextChromeCondensedForProgress(0.49)).toBe(false);
    expect(nowNextChromeCondensedForProgress(0.5)).toBe(true);
  });

  it('applies the top safe area exactly once above the persistent functional viewport', () => {
    expect(nowNextSafeAreaLayout(59)).toEqual({
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
