import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';

export const COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER = 1.2;

export const GUIDE_VISUAL_METRICS = {
  screenInsetX: 20,
  brandTopInset: 8,
  brandMarkBoxWidth: 56,
  brandMarkBoxHeight: 44,
  presentationNavHeight: 48,
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
  collapseTranslateY: 12,
  reduceMotionSwitchOffset: 28,
  viewportReferenceRows: 2,
} as const;

// Each weight uses its own static Instrument Sans family name. Do not add a
// `fontWeight` alongside these families; that can trigger platform-specific
// synthetic weight selection even though the intended static face is loaded.
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

export function minimumTouchTargetForPlatform(platform: string) {
  return platform === 'android'
    ? GUIDE_VISUAL_METRICS.minimumTouchTarget
    : GUIDE_VISUAL_METRICS.minimumTouchTargetIos;
}

export function standardProgrammeRowHeight(fontScale = 1) {
  const contentScale = Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1;
  return Math.round(PER_CHANNEL_VISUAL_METRICS.standardRowHeight * contentScale);
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
