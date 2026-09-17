import { Platform } from 'react-native';

import { TEEVEE_FONT_WEIGHTS } from '@/theme/typography';

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
  separatorLeftInset: 20,
  stickyContextHeight: 52,
  stickyContextWrappedHeight: 88,
  collapseDistance: 56,
  collapseTranslateY: 12,
  reduceMotionSwitchOffset: 28,
  viewportReferenceRows: 2,
} as const;

export const GUIDE_TYPOGRAPHY = {
  presentationInactive: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: TEEVEE_FONT_WEIGHTS.regular,
  },
  presentationSelected: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: TEEVEE_FONT_WEIGHTS.semibold,
  },
  channelFallback: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: TEEVEE_FONT_WEIGHTS.bold,
  },
  selectedChannelHeading: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: TEEVEE_FONT_WEIGHTS.bold,
  },
  selectedDate: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: TEEVEE_FONT_WEIGHTS.semibold,
  },
  utility: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: TEEVEE_FONT_WEIGHTS.semibold,
  },
  condensedChannelPrefix: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: TEEVEE_FONT_WEIGHTS.bold,
  },
  condensedDate: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: TEEVEE_FONT_WEIGHTS.semibold,
  },
  programmeTime: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: TEEVEE_FONT_WEIGHTS.regular,
  },
  programmeTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: TEEVEE_FONT_WEIGHTS.medium,
  },
  currentProgrammeTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: TEEVEE_FONT_WEIGHTS.bold,
  },
  currentDescription: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: TEEVEE_FONT_WEIGHTS.regular,
  },
} as const;

export function minimumTouchTargetForPlatform(platform = Platform.OS) {
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
