import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';

import {
  GUIDE_ACCESSIBILITY_FONT_SCALE_THRESHOLD,
  GUIDE_VISUAL_METRICS,
  guideChromeExpandedHeight,
} from './guideVisualMetrics';

export const NOW_NEXT_VISUAL_METRICS = {
  utilityContextHeight: 52,
  timeRailHeight: 52,
  functionalStackHeight: 104,
  collapseDistance: 56,
  reduceMotionSwitchOffset: 28,
  timeSlotWidth: 48,
  timeSlotHeight: 48,
  railTickWidth: 1,
  majorRailTickHeight: 10,
  quarterRailTickHeight: 6,
  majorRailTickOpacity: 1,
  quarterRailTickOpacity: 0.78,
  referenceMarkerWidth: 2,
  referenceMarkerHeight: 12,
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
  referenceProgrammeMinHeight: 64,
  referenceToFollowingGap: 0,
  channelBottomPadding: 12,
  followingTimeWidth: 52,
  followingTimeTitleGap: 8,
  followingInlinePaddingY: 4,
  followingStackedGap: 3,
  followingStackedPaddingY: 6,
  followingExtremeWidthThreshold: 180,
  followingExtremeFontScaleThreshold: 2,
  baseRowHeightIos: 216,
  baseRowHeightAndroid: 228,
  bottomClearance: 16,
} as const;

export const NOW_NEXT_TYPOGRAPHY = {
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

function normalizedFontScale(fontScale: number) {
  return Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
}

function normalizedProgrammeWidth(programmeWidth: number) {
  if (programmeWidth === Number.POSITIVE_INFINITY) return programmeWidth;
  return Number.isFinite(programmeWidth) ? Math.max(0, programmeWidth) : 0;
}

export function nowNextUsesAccessibilityLayout(fontScale: number) {
  return normalizedFontScale(fontScale) > GUIDE_ACCESSIBILITY_FONT_SCALE_THRESHOLD;
}

export function nowNextUtilityContextLayout() {
  return {
    height: NOW_NEXT_VISUAL_METRICS.utilityContextHeight,
    functionalStackHeight: NOW_NEXT_VISUAL_METRICS.functionalStackHeight,
  } as const;
}

export type NowNextFollowingLayoutMode =
  | 'standard'
  | 'inline-accessibility'
  | 'stacked-fallback';

export function nowNextFollowingLayoutMode(
  fontScale: number,
  programmeWidth = Number.POSITIVE_INFINITY,
): NowNextFollowingLayoutMode {
  const scale = normalizedFontScale(fontScale);
  if (scale <= GUIDE_ACCESSIBILITY_FONT_SCALE_THRESHOLD) return 'standard';

  const width = normalizedProgrammeWidth(programmeWidth);
  if (
    scale > NOW_NEXT_VISUAL_METRICS.followingExtremeFontScaleThreshold &&
    width < NOW_NEXT_VISUAL_METRICS.followingExtremeWidthThreshold
  ) {
    return 'stacked-fallback';
  }

  return 'inline-accessibility';
}

export function nowNextMinimumTouchTarget(platform: string) {
  return platform === 'android'
    ? GUIDE_VISUAL_METRICS.minimumTouchTarget
    : GUIDE_VISUAL_METRICS.minimumTouchTargetIos;
}

export function nowNextReferenceBlockHeight(fontScale: number) {
  const scale = normalizedFontScale(fontScale);
  const contentSafe = Math.ceil(
    NOW_NEXT_TYPOGRAPHY.referenceTitle.lineHeight * scale * 2,
  );
  return Math.max(NOW_NEXT_VISUAL_METRICS.referenceProgrammeMinHeight, contentSafe);
}

export function nowNextRailSlotPresentation(index: number) {
  const major = Math.max(0, Math.trunc(index)) % 2 === 0;
  return {
    showsLabel: major,
    tickHeight: major
      ? NOW_NEXT_VISUAL_METRICS.majorRailTickHeight
      : NOW_NEXT_VISUAL_METRICS.quarterRailTickHeight,
    tickOpacity: major
      ? NOW_NEXT_VISUAL_METRICS.majorRailTickOpacity
      : NOW_NEXT_VISUAL_METRICS.quarterRailTickOpacity,
  } as const;
}

export function nowNextFollowingSlotHeight(
  platform: string,
  fontScale: number,
  programmeWidth = Number.POSITIVE_INFINITY,
) {
  const scale = normalizedFontScale(fontScale);
  const minimum = nowNextMinimumTouchTarget(platform);
  const mode = nowNextFollowingLayoutMode(scale, programmeWidth);

  if (mode === 'standard') return minimum;

  if (mode === 'inline-accessibility') {
    return Math.max(minimum, Math.ceil(40 * scale + 8));
  }

  return Math.max(
    minimum,
    Math.ceil(
      18 * scale +
        NOW_NEXT_VISUAL_METRICS.followingStackedGap +
        40 * scale +
        NOW_NEXT_VISUAL_METRICS.followingStackedPaddingY * 2,
    ),
  );
}

export function nowNextChannelRowLayout(
  platform: string,
  fontScale: number,
  programmeWidth = Number.POSITIVE_INFINITY,
) {
  const referenceHeight = nowNextReferenceBlockHeight(fontScale);
  const followingHeight = nowNextFollowingSlotHeight(
    platform,
    fontScale,
    programmeWidth,
  );
  const rowHeight =
    NOW_NEXT_VISUAL_METRICS.channelTopPadding +
    referenceHeight +
    NOW_NEXT_VISUAL_METRICS.referenceToFollowingGap +
    followingHeight * 3 +
    NOW_NEXT_VISUAL_METRICS.channelBottomPadding;

  return {
    mode: nowNextFollowingLayoutMode(fontScale, programmeWidth),
    referenceHeight,
    followingHeight,
    rowHeight,
  } as const;
}

export function nowNextFollowingTargetRects(
  platform: string,
  fontScale: number,
  programmeWidth = Number.POSITIVE_INFINITY,
) {
  const layout = nowNextChannelRowLayout(platform, fontScale, programmeWidth);
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

export function nowNextStableScrollGeometry(fontScale: number) {
  const contentTopInset = guideChromeExpandedHeight(fontScale);
  return {
    viewportTop: NOW_NEXT_VISUAL_METRICS.functionalStackHeight,
    contentTopInset,
    scrollCompensation:
      contentTopInset - NOW_NEXT_VISUAL_METRICS.collapseDistance,
  } as const;
}

export const NOW_NEXT_STABLE_SCROLL_GEOMETRY = nowNextStableScrollGeometry(1);

export function nowNextStableScrollVisuals(
  progress: number,
  fontScale = 1,
) {
  'worklet';
  const clamped = Math.min(1, Math.max(0, progress));
  const accessibility =
    Number.isFinite(fontScale) &&
    Math.max(1, fontScale) > GUIDE_ACCESSIBILITY_FONT_SCALE_THRESHOLD;
  const guideChromeExpanded =
    GUIDE_VISUAL_METRICS.brandTopInset +
    GUIDE_VISUAL_METRICS.brandMarkBoxHeight +
    (accessibility
      ? GUIDE_VISUAL_METRICS.presentationNavAccessibilityHeight
      : GUIDE_VISUAL_METRICS.presentationNavHeight);
  const functionalStackHeight = NOW_NEXT_VISUAL_METRICS.functionalStackHeight;
  const scrollCompensation =
    guideChromeExpanded - NOW_NEXT_VISUAL_METRICS.collapseDistance;

  return {
    guideChromeHeight: guideChromeExpanded * (1 - clamped),
    overlayBottom:
      guideChromeExpanded * (1 - clamped) + functionalStackHeight,
    contentTranslateY:
      clamped === 0 ? 0 : -scrollCompensation * clamped,
  } as const;
}

export function nowNextSafeAreaLayout(topInset: number, fontScale = 1) {
  const safeTop = Number.isFinite(topInset) ? Math.max(0, topInset) : 0;
  return {
    overlayTop: safeTop,
    channelViewportTop:
      safeTop + nowNextStableScrollGeometry(fontScale).viewportTop,
  } as const;
}
