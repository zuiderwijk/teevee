import { Platform } from 'react-native';

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
  channelStripInsetX: 20,
  channelItemSize: 48,
  channelItemGap: 12,
  logoMaxWidth: 40,
  logoMaxHeight: 32,
  channelStripHeight: 72,
  channelSelectedRadius: 12,
  stripToHeadingGap: 24,
  headingToUtilitiesGap: 8,
  utilityRowMinHeight: 52,
  utilityVisibleHeight: 36,
  utilityGap: 8,
  utilityToScheduleGap: 12,
  primetimePaddingX: 14,
  nowPaddingX: 12,
  nowMinWidth: 48,
  utilityRadius: 18,
  utilityIconSize: 14,
  utilityIconGap: 7,
  timeGutterWidth: 64,
  timeTextInsetX: 4,
  timeToProgrammeGap: 16,
  programmeColumnX: 100,
  programmeRightInset: 24,
  minuteHeightBase: 1.3,
  programmeContentInsetY: 8,
  programmeCompactInsetY: 4,
  progressHeight: 4,
  progressRadius: 2,
  progressBottomInset: 10,
  progressTextClearance: 6,
  currentProgressMinNormalizedHeight: 56,
  currentDescriptionMinNormalizedHeight: 92,
  normalTitleMinNormalizedHeight: 20,
  normalFullTitleMinNormalizedHeight: 32,
  twoLineTitleMinNormalizedHeight: 48,
  descriptionGap: 3,
  stickyContextHeight: 52,
  stickyContextWrappedHeight: 88,
  collapseDistance: 56,
  collapseTranslateY: 12,
  reduceMotionSwitchOffset: 28,
  scrollTargetInsetY: 132,
} as const;

export const GUIDE_TYPOGRAPHY = {
  presentationInactive: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  presentationSelected: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  channelFallback: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700' as const,
  },
  selectedChannelHeading: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
  },
  selectedDate: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  condensedChannelPrefix: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700' as const,
  },
  condensedDate: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
  },
  utility: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
  },
  programmeStart: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  programmeTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  programmeTitleCompact: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '500' as const,
  },
  currentProgrammeTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
  currentProgrammeTitleCompact: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '700' as const,
  },
  currentDescription: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400' as const,
  },
} as const;

export const COMPACT_CHROME_MAX_FONT_SIZE_MULTIPLIER = 1.2;

export function platformMinimumTouchTarget(): number {
  return Platform.OS === 'ios'
    ? GUIDE_VISUAL_METRICS.touchTargetIos
    : GUIDE_VISUAL_METRICS.touchTargetAndroid;
}
