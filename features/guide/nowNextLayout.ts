import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';

import { GUIDE_VISUAL_METRICS } from './guideVisualMetrics';

export const NOW_NEXT_VISUAL_METRICS = {
  referenceContextHeight: 52,
  timeRailHeight: 52,
  functionalStackHeight: 104,
  collapseDistance: 56,
  collapseTranslateY: 12,
  reduceMotionSwitchOffset: 28,
  timeSlotWidth: 76,
  timeSlotHeight: 48,
  referenceMarkerWidth: 2,
  referenceMarkerHeight: 8,
  shortcutVisibleHeight: 36,
  shortcutGap: 8,
  shortcutRadius: 18,
  primetimePaddingX: 10,
  nowPaddingX: 12,
  utilityIndicatorWidth: 24,
  utilityIndicatorHeight: 2,
  utilityIndicatorRadius: 1,
  utilityIndicatorBottomInset: 2,
  nowMinWidth: 48,
  channelLeftInset: 20,
  channelIdentityWidth: 64,
  channelProgrammeGap: 16,
  programmeColumnX: 100,
  programmeRightInset: 24,
  channelTopPadding: 8,
  referenceProgrammeMinHeight: 72,
  referenceToFollowingGap: 8,
  channelBottomPadding: 8,
  followingTimeWidth: 52,
  followingTimeTitleGap: 8,
  followingStackedGap: 3,
  followingStackedPaddingY: 6,
  baseRowHeightIos: 228,
  baseRowHeightAndroid: 240,
  bottomClearance: 16,
} as const;

export const NOW_NEXT_TYPOGRAPHY = {
  referenceCaption: {
    fontFamily: TEEVEE_FONT_FAMILIES.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  referenceTime: {
    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
    fontSize: 18,
    lineHeight: 22,
  },
  utility: {
    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  timeSlot: {
    fontFamily: TEEVEE_FONT_FAMILIES.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  timeSlotSelected: {
    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  referenceTitle: {
    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
    fontSize: 18,
    lineHeight: 22,
  },
  referenceMeta: {
    fontFamily: TEEVEE_FONT_FAMILIES.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  followingTime: {
    fontFamily: TEEVEE_FONT_FAMILIES.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  followingTitle: {
    fontFamily: TEEVEE_FONT_FAMILIES.medium,
    fontSize: 15,
    lineHeight: 20,
  },
} as const;

const GUIDE_CHROME_EXPANDED_HEIGHT =
  GUIDE_VISUAL_METRICS.brandTopInset +
  GUIDE_VISUAL_METRICS.brandMarkBoxHeight +
  GUIDE_VISUAL_METRICS.presentationNavHeight;

function normalizedFontScale(fontScale: number) {
  return Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
}

export function nowNextFollowingLayoutMode(fontScale: number) {
  return normalizedFontScale(fontScale) > 1.35 ? 'stacked' : 'horizontal';
}

export function nowNextMinimumTouchTarget(platform: string) {
  return platform === 'android'
    ? GUIDE_VISUAL_METRICS.minimumTouchTarget
    : GUIDE_VISUAL_METRICS.minimumTouchTargetIos;
}

export function nowNextReferenceBlockHeight(fontScale: number) {
  const scale = normalizedFontScale(fontScale);
  const contentSafe = Math.ceil(
    NOW_NEXT_TYPOGRAPHY.referenceTitle.lineHeight * scale * 2 +
      3 +
      NOW_NEXT_TYPOGRAPHY.referenceMeta.lineHeight * scale,
  );
  return Math.max(NOW_NEXT_VISUAL_METRICS.referenceProgrammeMinHeight, contentSafe);
}

export function nowNextFollowingSlotHeight(
  platform: string,
  fontScale: number,
) {
  const scale = normalizedFontScale(fontScale);
  const minimum = nowNextMinimumTouchTarget(platform);
  if (nowNextFollowingLayoutMode(scale) === 'horizontal') return minimum;

  return Math.max(
    minimum,
    Math.ceil(
      NOW_NEXT_TYPOGRAPHY.followingTime.lineHeight * scale +
        NOW_NEXT_VISUAL_METRICS.followingStackedGap +
        NOW_NEXT_TYPOGRAPHY.followingTitle.lineHeight * scale * 2 +
        NOW_NEXT_VISUAL_METRICS.followingStackedPaddingY * 2,
    ),
  );
}

export function nowNextChannelRowLayout(
  platform: string,
  fontScale: number,
) {
  const referenceHeight = nowNextReferenceBlockHeight(fontScale);
  const followingHeight = nowNextFollowingSlotHeight(platform, fontScale);
  const rowHeight =
    NOW_NEXT_VISUAL_METRICS.channelTopPadding +
    referenceHeight +
    NOW_NEXT_VISUAL_METRICS.referenceToFollowingGap +
    followingHeight * 3 +
    NOW_NEXT_VISUAL_METRICS.channelBottomPadding;

  return {
    mode: nowNextFollowingLayoutMode(fontScale),
    referenceHeight,
    followingHeight,
    rowHeight,
  } as const;
}

export function nowNextFollowingTargetRects(
  platform: string,
  fontScale: number,
) {
  const layout = nowNextChannelRowLayout(platform, fontScale);
  const firstTop =
    NOW_NEXT_VISUAL_METRICS.channelTopPadding +
    layout.referenceHeight +
    NOW_NEXT_VISUAL_METRICS.referenceToFollowingGap;

  return [0, 1, 2].map((index) => ({
    index,
    top: firstTop + index * layout.followingHeight,
    bottom: firstTop + (index + 1) * layout.followingHeight,
    height: layout.followingHeight,
  }));
}

export function nowNextProgrammePressBackgroundColor(
  pressed: boolean,
  semanticSurface: string,
) {
  return pressed ? semanticSurface : 'transparent';
}

export function nowNextCollapseProgressForScrollOffset(
  scrollY: number,
  reduceMotion: boolean,
) {
  'worklet';
  const y = Math.max(0, scrollY);
  if (reduceMotion) {
    return y >= NOW_NEXT_VISUAL_METRICS.reduceMotionSwitchOffset ? 1 : 0;
  }
  return Math.min(1, y / NOW_NEXT_VISUAL_METRICS.collapseDistance);
}

export function nowNextChromeCondensedForProgress(progress: number) {
  'worklet';
  return Math.min(1, Math.max(0, progress)) >= 0.5;
}

export const NOW_NEXT_STABLE_SCROLL_GEOMETRY = {
  viewportTop: NOW_NEXT_VISUAL_METRICS.functionalStackHeight,
  contentTopInset: GUIDE_CHROME_EXPANDED_HEIGHT,
  scrollCompensation:
    GUIDE_CHROME_EXPANDED_HEIGHT - NOW_NEXT_VISUAL_METRICS.collapseDistance,
} as const;

export function nowNextStableScrollVisuals(progress: number) {
  'worklet';
  const clamped = Math.min(1, Math.max(0, progress));
  return {
    guideChromeHeight: GUIDE_CHROME_EXPANDED_HEIGHT * (1 - clamped),
    overlayBottom:
      GUIDE_CHROME_EXPANDED_HEIGHT * (1 - clamped) +
      NOW_NEXT_VISUAL_METRICS.functionalStackHeight,
    contentTranslateY:
      -NOW_NEXT_STABLE_SCROLL_GEOMETRY.scrollCompensation * clamped,
  } as const;
}

export function nowNextSafeAreaLayout(topInset: number) {
  const safeTop = Number.isFinite(topInset) ? Math.max(0, topInset) : 0;
  return {
    overlayTop: safeTop,
    channelViewportTop:
      safeTop + NOW_NEXT_STABLE_SCROLL_GEOMETRY.viewportTop,
  } as const;
}
