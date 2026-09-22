import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';

export const COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER = 1.2;
export const GUIDE_ACCESSIBILITY_FONT_SCALE_THRESHOLD = 1.35;

export const GUIDE_VISUAL_METRICS = {
  screenInsetX: 20,
  brandTopInset: 8,
  brandMarkBoxWidth: 56,
  brandMarkBoxHeight: 44,
  presentationNavHeight: 48,
  presentationNavAccessibilityHeight: 64,
  chromeCollapseTranslateY: 12,
  presentationIndicatorWidth: 88,
  presentationIndicatorHeight: 2.5,
  presentationIndicatorRadius: 1.25,
  controlPressOpacity: 0.72,
  disabledOpacity: 0.4,
  minimumTouchTarget: 48,
  minimumTouchTargetIos: 44,
} as const;

export const PER_CHANNEL_VISUAL_METRICS = {
  channelStripHeight: 72,
  channelStripCondensedHeight: 60,
  channelStripInsetX: 20,
  channelItemSize: 48,
  channelItemGap: 12,
  channelSelectedRadius: 12,
  logoMaxWidth: 40,
  logoMaxHeight: 32,
  stripToUtilitiesGap: 4,
  utilityRowMinHeight: 52,
  utilityToScheduleGap: 24,
  utilityVisibleHeight: 36,
  utilityRadius: 18,
  utilityGap: 8,
  utilityPressedOpacity: 0.72,
  utilityIndicatorWidth: 24,
  utilityIndicatorHeight: 2,
  utilityIndicatorRadius: 1,
  utilityIndicatorBottomInset: 2,
  primetimePaddingX: 10,
  nowPaddingX: 12,
  nowMinWidth: 48,
  utilityIconSize: 14,
  utilityIconGap: 7,
  standardRowHeight: 52,
  currentRowHeight: 176,
  timeGutterWidth: 64,
  timeTextX: 24,
  programmeColumnX: 100,
  programmeRightInset: 24,
  currentContentTopInset: 14,
  currentDescriptionGap: 10,
  currentDescriptionToProgressMinGap: 20,
  currentDescriptionMaxLines: 4,
  progressHeight: 4,
  progressRadius: 2,
  progressBottomInset: 16,
  separatorLeftInset: 20,
  stickyContextHeight: 52,
  collapseDistance: 56,
  reduceMotionSwitchOffset: 28,
  viewportReferenceRows: 2,
  kijktipTimeGap: 2,
  kijktipPaddingX: 8,
  kijktipRadius: 6,
  kijktipMinOuterWidth: 56,
} as const;

// Each weight uses its own static Instrument Sans family name. Do not add a
// `fontWeight` alongside these families; that can trigger platform-specific
// synthetic weight selection even though the intended static face is loaded.
export const GUIDE_EDITORIAL_TYPOGRAPHY = {
  kijktip: {
    fontFamily: TEEVEE_FONT_FAMILIES.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
} as const;

export const GUIDE_TYPOGRAPHY = {
  brandMark: {
    fontFamily: TEEVEE_FONT_FAMILIES.bold,
    fontSize: 31,
    lineHeight: 34,
  },
  presentationInactive: {
    fontFamily: TEEVEE_FONT_FAMILIES.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  presentationSelected: {
    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  channelFallback: {
    fontFamily: TEEVEE_FONT_FAMILIES.bold,
    fontSize: 12,
    lineHeight: 14,
  },
  selectedDate: {
    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  utility: {
    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  programmeTime: {
    fontFamily: TEEVEE_FONT_FAMILIES.regular,
    fontSize: 16,
    lineHeight: 20,
  },
  programmeTitle: {
    fontFamily: TEEVEE_FONT_FAMILIES.medium,
    fontSize: 17,
    lineHeight: 21,
  },
  currentProgrammeTitle: {
    fontFamily: TEEVEE_FONT_FAMILIES.bold,
    fontSize: 19,
    lineHeight: 23,
  },
  currentDescription: {
    fontFamily: TEEVEE_FONT_FAMILIES.regular,
    fontSize: 15,
    lineHeight: 22,
  },
} as const;


export function guideUsesAccessibilityChrome(fontScale: number) {
  'worklet';
  const scale =
    Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  return scale > GUIDE_ACCESSIBILITY_FONT_SCALE_THRESHOLD;
}

export function guidePresentationNavigationMetrics(fontScale: number) {
  'worklet';
  const accessibility = guideUsesAccessibilityChrome(fontScale);
  return {
    accessibility,
    height: accessibility
      ? GUIDE_VISUAL_METRICS.presentationNavAccessibilityHeight
      : GUIDE_VISUAL_METRICS.presentationNavHeight,
    maxLines: accessibility ? 2 : 1,
  } as const;
}

export function guideChromeExpandedHeight(fontScale: number) {
  'worklet';
  return (
    GUIDE_VISUAL_METRICS.brandTopInset +
    GUIDE_VISUAL_METRICS.brandMarkBoxHeight +
    guidePresentationNavigationMetrics(fontScale).height
  );
}

export function minimumTouchTargetForPlatform(platform: string) {
  return platform === 'android'
    ? GUIDE_VISUAL_METRICS.minimumTouchTarget
    : GUIDE_VISUAL_METRICS.minimumTouchTargetIos;
}

export function standardProgrammeRowHeight(fontScale = 1) {
  const contentScale = Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1;
  return Math.round(PER_CHANNEL_VISUAL_METRICS.standardRowHeight * contentScale);
}

export function perChannelKijktipLabelOuterWidth(
  intrinsicTimeWidth: number,
  intrinsicKijktipWidth: number,
) {
  const timeWidth = Number.isFinite(intrinsicTimeWidth)
    ? Math.max(0, intrinsicTimeWidth)
    : 0;
  const kijktipWidth = Number.isFinite(intrinsicKijktipWidth)
    ? Math.max(0, intrinsicKijktipWidth)
    : 0;
  return Math.max(
    PER_CHANNEL_VISUAL_METRICS.kijktipMinOuterWidth,
    Math.max(timeWidth, kijktipWidth) +
      PER_CHANNEL_VISUAL_METRICS.kijktipPaddingX * 2,
  );
}

export function perChannelKijktipStackGeometry(fontScale = 1) {
  const contentScale =
    Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  const rowHeight = standardProgrammeRowHeight(contentScale);
  const timeLineHeight = GUIDE_TYPOGRAPHY.programmeTime.lineHeight * contentScale;
  const labelLineHeight =
    GUIDE_EDITORIAL_TYPOGRAPHY.kijktip.lineHeight * contentScale;
  const contentHeight =
    timeLineHeight +
    PER_CHANNEL_VISUAL_METRICS.kijktipTimeGap +
    labelLineHeight;
  const verticalBreathing = Math.max(0, (rowHeight - contentHeight) / 2);
  const surfaceLeft =
    PER_CHANNEL_VISUAL_METRICS.timeTextX -
    PER_CHANNEL_VISUAL_METRICS.kijktipPaddingX;

  return {
    rowHeight,
    surfaceLeft,
    contentOriginX: PER_CHANNEL_VISUAL_METRICS.timeTextX,
    surfaceTop: 0,
    verticalBreathing,
    stackTop: verticalBreathing,
    timeTop: verticalBreathing,
    timeLineHeight,
    labelTop:
      verticalBreathing +
      timeLineHeight +
      PER_CHANNEL_VISUAL_METRICS.kijktipTimeGap,
    labelLineHeight,
    contentHeight,
    stackHeight: contentHeight,
    outerHeight: rowHeight,
    minOuterWidth: PER_CHANNEL_VISUAL_METRICS.kijktipMinOuterWidth,
    paddingX: PER_CHANNEL_VISUAL_METRICS.kijktipPaddingX,
    radius: PER_CHANNEL_VISUAL_METRICS.kijktipRadius,
  } as const;
}

export function perChannelCurrentKijktipGeometry(fontScale = 1) {
  const standardGeometry = perChannelKijktipStackGeometry(fontScale);
  const surfaceTop = PER_CHANNEL_VISUAL_METRICS.currentContentTopInset;
  const timeTop = surfaceTop + standardGeometry.verticalBreathing;

  return {
    surfaceLeft: standardGeometry.surfaceLeft,
    contentOriginX: standardGeometry.contentOriginX,
    surfaceTop,
    verticalBreathing: standardGeometry.verticalBreathing,
    timeTop,
    timeLineHeight: standardGeometry.timeLineHeight,
    labelTop:
      timeTop +
      standardGeometry.timeLineHeight +
      PER_CHANNEL_VISUAL_METRICS.kijktipTimeGap,
    labelLineHeight: standardGeometry.labelLineHeight,
    contentHeight: standardGeometry.contentHeight,
    outerHeight: standardGeometry.rowHeight,
    surfaceBottom: surfaceTop + standardGeometry.rowHeight,
    minOuterWidth: PER_CHANNEL_VISUAL_METRICS.kijktipMinOuterWidth,
    paddingX: PER_CHANNEL_VISUAL_METRICS.kijktipPaddingX,
    radius: PER_CHANNEL_VISUAL_METRICS.kijktipRadius,
  } as const;
}

export function currentProgrammeTitleLineCount(fontScale = 1) {
  const contentScale = Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1;
  return contentScale > 1.35 ? 2 : 1;
}

export function currentProgrammeRowHeight(fontScale = 1) {
  const contentScale = Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1;
  const titleLines = currentProgrammeTitleLineCount(contentScale);
  const baseHeight = Math.round(PER_CHANNEL_VISUAL_METRICS.currentRowHeight * contentScale);
  const contentSafeHeight = Math.ceil(
    PER_CHANNEL_VISUAL_METRICS.currentContentTopInset +
      GUIDE_TYPOGRAPHY.currentProgrammeTitle.lineHeight * contentScale * titleLines +
      PER_CHANNEL_VISUAL_METRICS.currentDescriptionGap +
      GUIDE_TYPOGRAPHY.currentDescription.lineHeight * contentScale * 4 +
      PER_CHANNEL_VISUAL_METRICS.currentDescriptionToProgressMinGap +
      PER_CHANNEL_VISUAL_METRICS.progressHeight +
      PER_CHANNEL_VISUAL_METRICS.progressBottomInset,
  );
  return Math.max(baseHeight, contentSafeHeight);
}

export function programmeTitleLineCount(fontScale = 1) {
  return fontScale > 1.35 ? 2 : 1;
}
