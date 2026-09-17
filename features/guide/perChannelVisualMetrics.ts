import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_TYPOGRAPHY,
  GUIDE_VISUAL_METRICS,
  minimumTouchTargetForPlatform,
  PER_CHANNEL_VISUAL_METRICS as CANONICAL_PER_CHANNEL_VISUAL_METRICS,
} from './guideVisualMetrics';

/**
 * Transitional naming facade for PerChannelGuideView. Values come exclusively
 * from guideVisualMetrics so there is one numeric/token source of truth. New
 * Guide code should import guideVisualMetrics directly.
 */
export { COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER, minimumTouchTargetForPlatform };

export const PER_CHANNEL_VISUAL_METRICS = {
  ...CANONICAL_PER_CHANNEL_VISUAL_METRICS,
  screenInsetX: GUIDE_VISUAL_METRICS.screenInsetX,
  timeX: CANONICAL_PER_CHANNEL_VISUAL_METRICS.timeTextX,
  programmeX: CANONICAL_PER_CHANNEL_VISUAL_METRICS.programmeColumnX,
  separatorLeft: CANONICAL_PER_CHANNEL_VISUAL_METRICS.separatorLeftInset,
  controlPressedOpacity: GUIDE_VISUAL_METRICS.controlPressOpacity,
} as const;

export const PER_CHANNEL_TYPOGRAPHY = {
  channelFallback: GUIDE_TYPOGRAPHY.channelFallback,
  selectedChannelHeading: GUIDE_TYPOGRAPHY.selectedChannelHeading,
  daySelector: GUIDE_TYPOGRAPHY.selectedDate,
  compactChannelPrefix: GUIDE_TYPOGRAPHY.condensedChannelPrefix,
  compactDate: GUIDE_TYPOGRAPHY.condensedDate,
  utility: GUIDE_TYPOGRAPHY.utility,
  programmeTime: GUIDE_TYPOGRAPHY.programmeTime,
  programmeTitle: GUIDE_TYPOGRAPHY.programmeTitle,
  currentProgrammeTitle: GUIDE_TYPOGRAPHY.currentProgrammeTitle,
  currentDescription: GUIDE_TYPOGRAPHY.currentDescription,
  presentationInactive: GUIDE_TYPOGRAPHY.presentationInactive,
  presentationSelected: GUIDE_TYPOGRAPHY.presentationSelected,
  brand: GUIDE_TYPOGRAPHY.brandMark,
} as const;
