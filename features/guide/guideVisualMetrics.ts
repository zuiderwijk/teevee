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
  controlPressOpacity: 0.64,
  disabledOpacity: 0.4,
  touchTargetIos: 44,
  touchTargetAndroid: 48,
} as const;

export const PER_CHANNEL_VISUAL_METRICS = {
  channelStripHeight: 72,
  channelStripInsetX: 20,
  channelItemSize: 48,
  channelItemGap: 12,
  channelSelectedRadius: 12,
  logoMaxWidth: 40,
  logoMaxHeight: 32,
  stripToHeadingGap: 24,
  headingToUtilitiesGap: 8,
  utilityRowMinHeight: 52,
  utilityToScheduleGap: 12,
  utilityVisibleHeight: 36,
  utilityRadius: 18,
  utilityGap: 8,
  primetimePaddingX: 14,
  nowPaddingX: 12,
  nowMinWidth: 48,
  utilityIconSize: 14,
  utilityIconGap: 7,
  standardRowHeight: 52,
  currentRowHeight: 120,
  timeGutterWidth: 64,
  timeTextX: 24,
  programmeColumnX: 100,
  programmeRightInset: 24,
  currentContentTopInset: 14,
  currentDescriptionGap: 2,
  progressHeight: 4,
  progressRadius: 2,
  progressBottomInset: 16,
  progressTextClearance: 6,
  separatorLeftInset: 20,
  stickyContextHeight: 52,
  stickyContextWrappedHeight: 88,
  collapseDistance: 56,
  collapseTranslateY: 12,
  reduceMotionSwitchOffset: 28,
  viewportReferenceRows: 2,
} as const;

/**
 * Weight mapping is encoded through static Instrument Sans family variants.
 * Avoid additionally setting fontWeight: Android and iOS then render the same
 * actual 400/500/600/700 font assets instead of synthesising custom weights.
 */
export const GUIDE_TYPOGRAPHY = {
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
  selectedChannelHeading: {
    fontFamily: TEEVEE_FONT_FAMILIES.bold,
    fontSize: 24,
    lineHeight: 30,
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
  condensedChannelPrefix: {
    fontFamily: TEEVEE_FONT_FAMILIES.bold,
    fontSize: 14,
    lineHeight: 18,
  },
  condensedDate: {
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
    fontSize: 18,
    lineHeight: 22,
  },
  currentProgrammeTitle: {
    fontFamily: TEEVEE_FONT_FAMILIES.bold,
    fontSize: 20,
    lineHeight: 24,
  },
  currentDescription: {
    fontFamily: TEEVEE_FONT_FAMILIES.regular,
    fontSize: 15,
    lineHeight: 18,
  },
} as const;

/**
 * Callers at a native boundary should pass Platform.OS. The conservative
 * default is Android's 48 dp minimum so an unresolved platform can never
 * undershoot either platform's touch-target requirement.
 */
export function minimumTouchTargetForPlatform(platform = 'android') {
  return platform === 'android'
    ? GUIDE_VISUAL_METRICS.touchTargetAndroid
    : GUIDE_VISUAL_METRICS.touchTargetIos;
}

export function standardProgrammeRowHeight(fontScale = 1) {
  const contentScale = Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1;
  return Math.round(PER_CHANNEL_VISUAL_METRICS.standardRowHeight * contentScale);
}

export function currentProgrammeRowHeight(fontScale = 1) {
  const contentScale = Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1;
  return Math.round(PER_CHANNEL_VISUAL_METRICS.currentRowHeight * contentScale);
}

export function programmeTitleLineCount(fontScale = 1) {
  return fontScale > 1.35 ? 2 : 1;
}

export function perChannelCollapseProgress(scrollY: number, reduceMotion = false) {
  const y = Math.max(0, Number.isFinite(scrollY) ? scrollY : 0);
  if (reduceMotion) {
    return y >= PER_CHANNEL_VISUAL_METRICS.reduceMotionSwitchOffset ? 1 : 0;
  }
  return Math.min(1, y / PER_CHANNEL_VISUAL_METRICS.collapseDistance);
}
