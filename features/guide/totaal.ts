import type { Channel, GuideFixture, GuideSchedule } from '@/data/domain/epg';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';

import { guideChromeExpandedHeight } from './guideVisualMetrics';

export const TOTAAL_PROGRAMME_READABILITY_THRESHOLDS = [64, 126] as const;

export const TOTAAL_VISUAL_METRICS = {
  dayContextHeight: 52,
  timeAxisHeight: 44,
  persistentStackHeight: 96,
  viewedTimeAnchor: 120,
  collapseDistance: 56,
  reduceMotionSwitchOffset: 28,
  channelLogoMaxWidth: 48,
  channelLogoMaxHeight: 36,
  programmeBoundaryInsetY: 10,
  programmeBoundaryWidth: 1,
  programmeBoundaryOpacity: 0.55,
  axisBaselineHeight: 1,
  axisBaselineOpacity: 0.42,
  majorTickHeight: 10,
  majorTickOpacity: 0.78,
  quarterTickHeight: 6,
  quarterTickOpacity: 0.5,
  currentMarkerBodyHeight: 18,
  currentMarkerMinWidth: 38,
  currentMarkerPaddingX: 5,
  currentMarkerRadius: 5,
  currentMarkerPointerWidth: 6,
  currentMarkerPointerHeight: 4,
  nowVisibleHeight: 36,
  nowMinWidth: 48,
  nowPaddingX: 12,
  nowRadius: 10,
  dateInsetX: 20,
  scheduleBottomClearance: 16,
} as const;

export const TOTAAL_TYPOGRAPHY = {
  axisLabel: {
    fontFamily: TEEVEE_FONT_FAMILIES.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  currentMarker: {
    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
    fontSize: 10,
    lineHeight: 12,
  },
  programmeTitle: {
    fontFamily: TEEVEE_FONT_FAMILIES.medium,
    fontSize: 15,
    lineHeight: 19,
  },
  currentProgrammeTitle: {
    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
    fontSize: 15,
    lineHeight: 19,
  },
  programmeSecondary: {
    fontFamily: TEEVEE_FONT_FAMILIES.regular,
    fontSize: 13,
    lineHeight: 18,
  },
} as const;

export type TotaalProgrammeContentPresentation = {
  paddingX: 6 | 8 | 10;
  titleLines: 1 | 2;
  showSecondary: boolean;
  mode: 'compact' | 'standard' | 'comfortable';
};

function normaliseScale(fontScale: number) {
  return Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
}

export function totaalProgrammeContentPresentation(
  visibleRemainingWidth: number,
): TotaalProgrammeContentPresentation {
  const width = Number.isFinite(visibleRemainingWidth)
    ? Math.max(0, visibleRemainingWidth)
    : 0;

  if (width < 64) {
    return {
      paddingX: 6,
      titleLines: 1,
      showSecondary: false,
      mode: 'compact',
    };
  }

  if (width < 126) {
    return {
      paddingX: 8,
      titleLines: 1,
      showSecondary: width >= 52,
      mode: 'standard',
    };
  }

  return {
    paddingX: 10,
    titleLines: 2,
    showSecondary: width >= 52,
    mode: 'comfortable',
  };
}

export function totaalCollapseProgressForScrollOffset(
  scrollY: number,
  reduceMotion: boolean,
) {
  'worklet';
  const y = Math.max(0, scrollY);
  if (reduceMotion) {
    return y >= TOTAAL_VISUAL_METRICS.reduceMotionSwitchOffset ? 1 : 0;
  }
  return Math.min(1, y / TOTAAL_VISUAL_METRICS.collapseDistance);
}

export function totaalChromeCondensedForProgress(progress: number) {
  'worklet';
  return Math.min(1, Math.max(0, progress)) >= 0.5;
}

export function totaalStableScrollGeometry(fontScale = 1) {
  const contentTopInset = guideChromeExpandedHeight(normaliseScale(fontScale));
  return {
    viewportTop: TOTAAL_VISUAL_METRICS.persistentStackHeight,
    contentTopInset,
    scrollCompensation:
      contentTopInset - TOTAAL_VISUAL_METRICS.collapseDistance,
  } as const;
}

export function totaalStableScrollVisuals(
  progress: number,
  fontScale = 1,
  nativeScrollY = 0,
  reduceMotion = false,
) {
  'worklet';
  const clamped = Math.min(1, Math.max(0, progress));
  const expandedChromeHeight = guideChromeExpandedHeight(fontScale);
  const scrollCompensation =
    expandedChromeHeight - TOTAAL_VISUAL_METRICS.collapseDistance;
  const safeNativeScrollY = Number.isFinite(nativeScrollY)
    ? Math.max(0, nativeScrollY)
    : 0;

  const contentTranslateY = reduceMotion
    ? clamped < 1
      ? safeNativeScrollY
      : -(expandedChromeHeight - TOTAAL_VISUAL_METRICS.reduceMotionSwitchOffset)
    : clamped === 0
      ? 0
      : -scrollCompensation * clamped;

  return {
    overlayBottom:
      expandedChromeHeight * (1 - clamped) +
      TOTAAL_VISUAL_METRICS.persistentStackHeight,
    contentTranslateY,
  } as const;
}

export function totaalComposedContentTop(
  nativeScrollY: number,
  fontScale: number,
  reduceMotion: boolean,
) {
  const safeNativeScrollY = Number.isFinite(nativeScrollY)
    ? Math.max(0, nativeScrollY)
    : 0;
  const progress = totaalCollapseProgressForScrollOffset(
    safeNativeScrollY,
    reduceMotion,
  );
  const geometry = totaalStableScrollGeometry(fontScale);
  return (
    geometry.contentTopInset -
    safeNativeScrollY +
    totaalStableScrollVisuals(
      progress,
      fontScale,
      safeNativeScrollY,
      reduceMotion,
    ).contentTranslateY
  );
}

export function totaalVerticalContentExtent(
  contentTopInset: number,
  guideHeight: number,
) {
  const safeContentTopInset = Number.isFinite(contentTopInset)
    ? Math.max(0, contentTopInset)
    : 0;
  const safeGuideHeight = Number.isFinite(guideHeight)
    ? Math.max(0, guideHeight)
    : 0;
  return (
    safeContentTopInset +
    safeGuideHeight +
    TOTAAL_VISUAL_METRICS.scheduleBottomClearance
  );
}

export function totaalSafeAreaLayout(topInset: number, fontScale = 1) {
  const safeTop = Number.isFinite(topInset) ? Math.max(0, topInset) : 0;
  return {
    overlayTop: safeTop,
    scheduleViewportTop:
      safeTop + totaalStableScrollGeometry(fontScale).viewportTop,
  } as const;
}

export function totaalTimeAxisTickPresentation(timeMs: number) {
  const minute = new Date(timeMs).getUTCMinutes();
  const major = minute === 0 || minute === 30;
  return {
    major,
    tickHeight: major
      ? TOTAAL_VISUAL_METRICS.majorTickHeight
      : TOTAAL_VISUAL_METRICS.quarterTickHeight,
    tickOpacity: major
      ? TOTAAL_VISUAL_METRICS.majorTickOpacity
      : TOTAAL_VISUAL_METRICS.quarterTickOpacity,
  } as const;
}

export function totaalCurrentTimeMarkerBodyX(
  pointerX: number,
  viewportWidth: number,
  bodyWidth: number,
) {
  const safeViewport = Number.isFinite(viewportWidth) ? Math.max(0, viewportWidth) : 0;
  const safeBody = Number.isFinite(bodyWidth)
    ? Math.max(TOTAAL_VISUAL_METRICS.currentMarkerMinWidth, bodyWidth)
    : TOTAAL_VISUAL_METRICS.currentMarkerMinWidth;
  const centred = (Number.isFinite(pointerX) ? pointerX : 0) - safeBody / 2;
  return Math.min(Math.max(0, safeViewport - safeBody), Math.max(0, centred));
}

export function totaalProgrammeSecondaryLabel(
  current: boolean,
  startLabel: string,
  endLabel: string,
) {
  return current ? `tot ${endLabel}` : startLabel;
}

export function totaalChannelIdentityAccessible(programmeActionCount: number) {
  return !Number.isFinite(programmeActionCount) || programmeActionCount <= 0;
}

export function totaalProgrammePressBackgroundColor(
  pressed: boolean,
  surfaceElevated: string,
) {
  return pressed ? surfaceElevated : 'transparent';
}

export function totaalChannelIdForScheduleOffset(
  channelIds: readonly string[],
  rowHeight: number,
  scheduleOffset: number,
) {
  if (channelIds.length === 0 || !Number.isFinite(rowHeight) || rowHeight <= 0) {
    return null;
  }
  const safeOffset = Number.isFinite(scheduleOffset) ? Math.max(0, scheduleOffset) : 0;
  const index = Math.min(
    channelIds.length - 1,
    Math.max(0, Math.floor(safeOffset / rowHeight)),
  );
  return channelIds[index] ?? null;
}

export function totaalPreservedChannelScheduleOffset({
  previousChannelIds,
  nextChannelIds,
  channelId,
  previousRowHeight,
  nextRowHeight,
  currentScheduleOffset,
}: {
  previousChannelIds: readonly string[];
  nextChannelIds: readonly string[];
  channelId: string | null;
  previousRowHeight: number;
  nextRowHeight: number;
  currentScheduleOffset: number;
}) {
  if (nextChannelIds.length === 0 || nextRowHeight <= 0) return 0;

  const safePreviousRowHeight =
    Number.isFinite(previousRowHeight) && previousRowHeight > 0
      ? previousRowHeight
      : nextRowHeight;
  const safeCurrentOffset = Number.isFinite(currentScheduleOffset)
    ? Math.max(0, currentScheduleOffset)
    : 0;
  const fallbackPreviousIndex =
    previousChannelIds.length > 0
      ? Math.min(
          previousChannelIds.length - 1,
          Math.max(0, Math.floor(safeCurrentOffset / safePreviousRowHeight)),
        )
      : 0;
  const semanticId =
    channelId ?? previousChannelIds[fallbackPreviousIndex] ?? nextChannelIds[0] ?? null;
  const previousIndex =
    semanticId === null
      ? fallbackPreviousIndex
      : Math.max(
          0,
          previousChannelIds.indexOf(semanticId) >= 0
            ? previousChannelIds.indexOf(semanticId)
            : fallbackPreviousIndex,
        );
  const nextIndexForId =
    semanticId === null ? -1 : nextChannelIds.indexOf(semanticId);
  const nextIndex =
    nextIndexForId >= 0
      ? nextIndexForId
      : Math.min(nextChannelIds.length - 1, previousIndex);
  const intraRowOffset = Math.max(
    0,
    safeCurrentOffset - previousIndex * safePreviousRowHeight,
  );

  return (
    nextIndex * nextRowHeight +
    Math.min(intraRowOffset, Math.max(0, nextRowHeight - 1))
  );
}

export function totaalNativeOffsetForScheduleOffset(
  scheduleOffset: number,
  collapseProgress: number,
  reduceMotion = false,
) {
  'worklet';
  const clamped = Math.min(1, Math.max(0, collapseProgress));
  const nativeCollapseContribution = reduceMotion
    ? clamped >= 1
      ? TOTAAL_VISUAL_METRICS.reduceMotionSwitchOffset
      : 0
    : TOTAAL_VISUAL_METRICS.collapseDistance * clamped;
  return Math.max(0, Math.max(0, scheduleOffset) + nativeCollapseContribution);
}

export function totaalScheduleOffsetForNativeOffset(
  nativeOffset: number,
  collapseProgress: number,
  reduceMotion = false,
) {
  'worklet';
  const safeNativeOffset = Math.max(0, nativeOffset);
  const clamped = Math.min(1, Math.max(0, collapseProgress));
  if (reduceMotion) {
    if (clamped < 1) return 0;
    return Math.max(
      0,
      safeNativeOffset - TOTAAL_VISUAL_METRICS.reduceMotionSwitchOffset,
    );
  }
  return Math.max(
    0,
    safeNativeOffset - TOTAAL_VISUAL_METRICS.collapseDistance * clamped,
  );
}

export type TotaalSchedulePresentation = {
  channels: Channel[];
  schedule: GuideSchedule | null;
  source: 'selected-schedule' | 'established-channels' | 'fixture';
};

export function resolveTotaalSchedulePresentation(
  selectedSchedule: GuideSchedule | null,
  establishedChannels: Channel[] | null,
  fixtureSchedule: GuideFixture | null,
): TotaalSchedulePresentation {
  if (selectedSchedule) {
    return {
      channels: selectedSchedule.channels,
      schedule: selectedSchedule,
      source: 'selected-schedule',
    };
  }

  if (establishedChannels && establishedChannels.length > 0) {
    return {
      channels: establishedChannels,
      schedule: null,
      source: 'established-channels',
    };
  }

  return {
    channels: fixtureSchedule?.channels ?? [],
    schedule: fixtureSchedule,
    source: 'fixture',
  };
}
