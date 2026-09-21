import { type ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { guideTelevisionDayStart } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture } from '@/data/fixtures/runtimeGuideFixture';
import { runtimeGuideScheduleFor } from '@/data/runtime/guideScheduleRuntime';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { ChannelIdentity } from './ChannelIdentity';
import type { ProgrammeSelection } from './detailState';
import { EdgeReadabilityOverlay } from './EdgeReadabilityOverlay';
import { GuideChrome } from './GuideChrome';
import { GuideDaySelector } from './GuideDaySelector';
import {
  guideDayIsSelectable,
  guideDayOptions,
  guideTargetForDaySelection,
  guideTargetForNow,
  guideTotaalDayForViewedAnchor,
} from './guideDaySelection';
import {
  guideProgrammeTimeWindow,
  guideProgrammeWindowBucket,
  guideProgrammaticScrollPrealignmentX,
  windowGuideProgrammesByChannel,
} from './guideProgrammeWindow';
import { formatGuideTime, indexGuideProgrammesByChannel } from './guideRenderData';
import { buildTimeTicks, timeToX, timelineWidth } from './geometry';
import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_TYPOGRAPHY,
  minimumTouchTargetForPlatform,
} from './guideVisualMetrics';
import { guideLayoutForFontScale } from './layout';
import { GUIDE_TIME_LABEL_INTERVAL_MINUTES } from './timeAxis';
import { TimeAxisLeftMask } from './TimeAxisLeftMask';
import { TimeAxisTick } from './TimeAxisTick';
import {
  resolveTotaalSchedulePresentation,
  TOTAAL_TYPOGRAPHY,
  TOTAAL_VISUAL_METRICS,
  totaalChannelIdForScheduleOffset,
  totaalChannelIdentityAccessible,
  totaalChromeCondensedForProgress,
  totaalCollapseProgressForScrollOffset,
  totaalCurrentTimeMarkerBodyX,
  totaalNativeOffsetForScheduleOffset,
  totaalPreservedChannelScheduleOffset,
  totaalScheduleOffsetForNativeOffset,
  totaalSafeAreaLayout,
  totaalStableScrollGeometry,
  totaalStableScrollVisuals,
  totaalTimeAxisTickPresentation,
} from './totaal';
import { TotaalProgrammeCell } from './TotaalProgrammeCell';
import { useGuideClock } from './useGuideClock';
import { useSelectedGuideDaySchedule } from './useSelectedGuideDaySchedule';

const TIME_ANCHOR_INSET = 120;
const CURRENT_MARKER_BODY_WIDTH = TOTAAL_VISUAL_METRICS.currentMarkerMinWidth;

type GuideViewProps = {
  guideDataVersion: number;
  presentationNavigation: ReactNode;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

function clampTime(timeMs: number, fromMs: number, toMs: number) {
  return Math.min(toMs - 1, Math.max(fromMs, timeMs));
}

export const GuideView = memo(function GuideView({
  guideDataVersion,
  presentationNavigation,
  onSelectProgramme,
}: GuideViewProps) {
  const theme = useTeeveeTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { fontScale, width: windowWidth } = useWindowDimensions();
  const effectiveFontScale =
    Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  const minimumTouchTarget = minimumTouchTargetForPlatform(Platform.OS);
  const reduceMotion = useReducedMotion();
  const layout = useMemo(
    () => guideLayoutForFontScale(effectiveFontScale),
    [effectiveFontScale],
  );

  const horizontalRef = useAnimatedRef<Animated.ScrollView>();
  const axisRef = useAnimatedRef<Animated.ScrollView>();
  const verticalRef = useRef<ScrollView>(null);
  const viewedChannelIdRef = useRef<string | null>(null);
  const previousChannelIdsRef = useRef<readonly string[]>([]);
  const previousRowHeightRef = useRef(layout.rowHeight);
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const collapseProgress = useSharedValue(0);
  const nowMs = useGuideClock();
  const viewedTimeRef = useRef(nowMs);
  const [visibleDayStartMs, setVisibleDayStartMs] = useState(() =>
    guideTotaalDayForViewedAnchor(nowMs),
  );
  const [windowStartDayMs, setWindowStartDayMs] = useState(visibleDayStartMs);
  const followingDayStartMs = guideTelevisionDayStart(windowStartDayMs, 1);
  const includeFollowingDay = guideDayIsSelectable(followingDayStartMs, nowMs);
  const selectedWindow = useSelectedGuideDaySchedule(
    windowStartDayMs,
    guideDataVersion,
    undefined,
    includeFollowingDay,
    guideTelevisionDayStart(nowMs),
  );

  const currentRuntimeSchedule = useMemo(
    () => runtimeGuideScheduleFor(nowMs),
    [guideDataVersion, nowMs],
  );
  const establishedChannelsRef = useRef(
    currentRuntimeSchedule?.channels.length ? currentRuntimeSchedule.channels : null,
  );
  const establishedChannels =
    selectedWindow.schedule?.channels.length
      ? selectedWindow.schedule.channels
      : currentRuntimeSchedule?.channels.length
        ? currentRuntimeSchedule.channels
        : establishedChannelsRef.current;

  useEffect(() => {
    const nextChannels =
      selectedWindow.schedule?.channels.length
        ? selectedWindow.schedule.channels
        : currentRuntimeSchedule?.channels.length
          ? currentRuntimeSchedule.channels
          : null;
    if (nextChannels) establishedChannelsRef.current = nextChannels;
  }, [currentRuntimeSchedule, selectedWindow.schedule]);

  const fixtureFallback = useMemo(
    () =>
      establishedChannels?.length
        ? null
        : buildRuntimeGuideFixture(windowStartDayMs),
    [establishedChannels, windowStartDayMs],
  );
  const schedulePresentation = useMemo(
    () =>
      resolveTotaalSchedulePresentation(
        selectedWindow.schedule,
        establishedChannels,
        fixtureFallback,
      ),
    [establishedChannels, fixtureFallback, selectedWindow.schedule],
  );
  const runtimeFixture = useMemo(
    () =>
      schedulePresentation.schedule ?? {
        generatedAt: 'retained-channel-catalogue',
        timezone: 'Europe/Amsterdam' as const,
        channels: schedulePresentation.channels,
        programmes: [],
      },
    [schedulePresentation.channels, schedulePresentation.schedule],
  );
  const programmesByChannel = useMemo(
    () => indexGuideProgrammesByChannel(runtimeFixture),
    [runtimeFixture],
  );

  const pendingTargetTimeRef = useRef<number | null>(null);
  const [condensed, setCondensed] = useState(false);
  const [programmeWindowBucket, setProgrammeWindowBucket] = useState(0);

  const windowStart = windowStartDayMs;
  const windowEnd = useMemo(
    () => guideTelevisionDayStart(windowStartDayMs, includeFollowingDay ? 2 : 1),
    [includeFollowingDay, windowStartDayMs],
  );
  const width = timelineWidth(windowStart, windowEnd, layout.minuteWidth);
  const ticks = useMemo(
    () => buildTimeTicks(windowStart, windowEnd),
    [windowStart, windowEnd],
  );
  const firstLabelTick = ticks.find((tick) => totaalTimeAxisTickPresentation(tick).major);
  const firstTickX =
    firstLabelTick !== undefined
      ? timeToX(firstLabelTick, windowStart, layout.minuteWidth)
      : 0;
  const labelSpacing = GUIDE_TIME_LABEL_INTERVAL_MINUTES * layout.minuteWidth;
  const nowX = timeToX(nowMs, windowStart, layout.minuteWidth);
  const nowInWindow = nowMs >= windowStart && nowMs < windowEnd;
  const guideHeight = runtimeFixture.channels.length * layout.rowHeight;
  const programmeViewportWidth = Math.max(0, windowWidth - layout.channelWidth);
  const programmeTimeWindow = useMemo(
    () =>
      guideProgrammeTimeWindow({
        bucket: programmeWindowBucket,
        viewportWidth: programmeViewportWidth,
        timelineWidth: width,
        windowStartMs: windowStart,
        windowEndMs: windowEnd,
        minuteWidth: layout.minuteWidth,
      }),
    [
      layout.minuteWidth,
      programmeViewportWidth,
      programmeWindowBucket,
      width,
      windowEnd,
      windowStart,
    ],
  );
  const windowedProgrammesByChannel = useMemo(
    () =>
      windowGuideProgrammesByChannel(
        programmesByChannel,
        programmeTimeWindow.fromMs,
        programmeTimeWindow.toMs,
      ),
    [programmesByChannel, programmeTimeWindow.fromMs, programmeTimeWindow.toMs],
  );
  const followingDayBoundaryX = timeToX(
    followingDayStartMs,
    windowStart,
    layout.minuteWidth,
  );
  const stableScrollGeometry = totaalStableScrollGeometry(effectiveFontScale);
  const safeAreaLayout = totaalSafeAreaLayout(safeAreaInsets.top, effectiveFontScale);
  const scheduleStatus =
    schedulePresentation.schedule === null
      ? selectedWindow.unavailable
        ? 'unavailable'
        : 'loading'
      : null;
  const scheduleStatusLabel =
    scheduleStatus === 'unavailable'
      ? 'Geen gidsgegevens beschikbaar voor deze dag.'
      : 'Gids laden…';

  const syncCondensed = useCallback((nextCondensed: boolean) => {
    setCondensed((current) => (current === nextCondensed ? current : nextCondensed));
  }, []);

  const syncProgrammeWindowBucket = useCallback((nextBucket: number) => {
    setProgrammeWindowBucket((current) => (current === nextBucket ? current : nextBucket));
  }, []);

  const syncProgrammeWindowForViewportX = useCallback(
    (viewportX: number) => {
      syncProgrammeWindowBucket(
        guideProgrammeWindowBucket(viewportX, programmeViewportWidth),
      );
    },
    [programmeViewportWidth, syncProgrammeWindowBucket],
  );

  const syncProgrammeWindowForTarget = useCallback(
    (timeMs: number, targetWindowStartMs: number) => {
      const viewportX = Math.max(
        0,
        timeToX(timeMs, targetWindowStartMs, layout.minuteWidth) - TIME_ANCHOR_INSET,
      );
      syncProgrammeWindowForViewportX(viewportX);
    },
    [layout.minuteWidth, syncProgrammeWindowForViewportX],
  );

  const commitViewedTime = useCallback((viewedTimeMs: number) => {
    viewedTimeRef.current = viewedTimeMs;
    const nextVisibleDayStartMs = guideTotaalDayForViewedAnchor(viewedTimeMs);
    setVisibleDayStartMs((current) =>
      current === nextVisibleDayStartMs ? current : nextVisibleDayStartMs,
    );
  }, []);

  useAnimatedReaction(
    () => totaalChromeCondensedForProgress(collapseProgress.value),
    (nextCondensed, previousCondensed) => {
      if (nextCondensed === previousCondensed) return;
      scheduleOnRN(syncCondensed, nextCondensed);
    },
    [collapseProgress, syncCondensed],
  );

  useAnimatedReaction(
    () =>
      programmeViewportWidth > 0
        ? Math.floor(Math.max(0, scrollX.value) / programmeViewportWidth)
        : 0,
    (nextBucket, previousBucket) => {
      if (nextBucket === previousBucket) return;
      scheduleOnRN(syncProgrammeWindowBucket, nextBucket);
    },
    [programmeViewportWidth, scrollX, syncProgrammeWindowBucket],
  );

  const viewedTimeForX = useCallback(
    (viewportX: number) =>
      clampTime(
        windowStart +
          ((Math.max(0, viewportX) + TIME_ANCHOR_INSET) / layout.minuteWidth) * 60_000,
        windowStart,
        windowEnd,
      ),
    [layout.minuteWidth, windowEnd, windowStart],
  );

  const syncHorizontalAnchor = useCallback(
    (viewportX: number) => {
      commitViewedTime(viewedTimeForX(viewportX));
    },
    [commitViewedTime, viewedTimeForX],
  );

  useAnimatedReaction(
    () => includeFollowingDay && scrollX.value + TIME_ANCHOR_INSET >= followingDayBoundaryX,
    (inFollowingDay, previouslyInFollowingDay) => {
      if (
        previouslyInFollowingDay === null ||
        inFollowingDay === previouslyInFollowingDay
      ) {
        return;
      }
      scheduleOnRN(syncHorizontalAnchor, scrollX.value);
    },
    [followingDayBoundaryX, includeFollowingDay, scrollX, syncHorizontalAnchor],
  );

  const horizontalScrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const viewportX = Math.max(0, event.contentOffset.x);
        scrollX.value = viewportX;
        scrollTo(axisRef, viewportX, 0, false);
      },
      onEndDrag: (event) => {
        const viewportX = Math.max(0, event.contentOffset.x);
        scheduleOnRN(syncHorizontalAnchor, viewportX);
      },
      onMomentumEnd: (event) => {
        const viewportX = Math.max(0, event.contentOffset.x);
        scheduleOnRN(syncHorizontalAnchor, viewportX);
      },
    },
    [axisRef, scrollX, syncHorizontalAnchor],
  );

  const axisScrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const viewportX = Math.max(0, event.contentOffset.x);
        scrollX.value = viewportX;
        scrollTo(horizontalRef, viewportX, 0, false);
      },
      onEndDrag: (event) => {
        const viewportX = Math.max(0, event.contentOffset.x);
        scheduleOnRN(syncHorizontalAnchor, viewportX);
      },
      onMomentumEnd: (event) => {
        const viewportX = Math.max(0, event.contentOffset.x);
        scheduleOnRN(syncHorizontalAnchor, viewportX);
      },
    },
    [horizontalRef, scrollX, syncHorizontalAnchor],
  );

  const syncViewedChannel = useCallback(
    (nativeY: number, progress: number) => {
      if (runtimeFixture.channels.length === 0) return;
      const scheduleOffset = totaalScheduleOffsetForNativeOffset(nativeY, progress);
      viewedChannelIdRef.current = totaalChannelIdForScheduleOffset(
        runtimeFixture.channels.map(({ id }) => id),
        layout.rowHeight,
        scheduleOffset,
      );
    },
    [layout.rowHeight, runtimeFixture.channels],
  );

  const verticalScrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const y = Math.max(0, event.contentOffset.y);
        scrollY.value = y;
        collapseProgress.value = totaalCollapseProgressForScrollOffset(y, reduceMotion);
      },
      onEndDrag: (event) => {
        scheduleOnRN(
          syncViewedChannel,
          Math.max(0, event.contentOffset.y),
          collapseProgress.value,
        );
      },
      onMomentumEnd: (event) => {
        scheduleOnRN(
          syncViewedChannel,
          Math.max(0, event.contentOffset.y),
          collapseProgress.value,
        );
      },
    },
    [reduceMotion, scrollY, syncViewedChannel],
  );

  const scheduleContentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: totaalStableScrollVisuals(
          collapseProgress.value,
          effectiveFontScale,
        ).contentTranslateY,
      },
    ],
  }));

  const channelContentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          stableScrollGeometry.contentTopInset -
          scrollY.value +
          totaalStableScrollVisuals(
            collapseProgress.value,
            effectiveFontScale,
          ).contentTranslateY,
      },
    ],
  }));

  const statusStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          stableScrollGeometry.contentTopInset -
          scrollY.value +
          totaalStableScrollVisuals(
            collapseProgress.value,
            effectiveFontScale,
          ).contentTranslateY +
          20,
      },
    ],
  }));

  const currentMarkerBodyStyle = useAnimatedStyle(() => {
    const pointerX = nowX - scrollX.value;
    const visible =
      nowInWindow && pointerX >= 0 && pointerX <= programmeViewportWidth;
    const left = totaalCurrentTimeMarkerBodyX(
      pointerX,
      programmeViewportWidth,
      CURRENT_MARKER_BODY_WIDTH,
    );
    return {
      opacity: visible ? 1 : 0,
      transform: [{ translateX: left }],
    };
  }, [nowInWindow, nowX, programmeViewportWidth]);

  const currentMarkerPointerStyle = useAnimatedStyle(() => {
    const pointerX = nowX - scrollX.value;
    const visible =
      nowInWindow && pointerX >= 0 && pointerX <= programmeViewportWidth;
    return {
      opacity: visible ? 1 : 0,
      transform: [
        {
          translateX:
            pointerX - TOTAAL_VISUAL_METRICS.currentMarkerPointerWidth / 2,
        },
      ],
    };
  }, [nowInWindow, nowX, programmeViewportWidth]);

  const scrollToTime = useCallback(
    (timeMs: number, animated: boolean) => {
      const target = clampTime(timeMs, windowStart, windowEnd);
      commitViewedTime(target);
      const x = Math.max(
        0,
        timeToX(target, windowStart, layout.minuteWidth) - TIME_ANCHOR_INSET,
      );
      const prealignmentX = guideProgrammaticScrollPrealignmentX(x, animated);
      if (prealignmentX !== null) {
        syncProgrammeWindowForViewportX(prealignmentX);
        scrollX.value = prealignmentX;
      }
      horizontalRef.current?.scrollTo({ x, animated });
      axisRef.current?.scrollTo({ x, animated });
    },
    [
      axisRef,
      commitViewedTime,
      layout.minuteWidth,
      scrollX,
      syncProgrammeWindowForViewportX,
      windowEnd,
      windowStart,
    ],
  );

  useEffect(() => {
    if (guideDayIsSelectable(windowStartDayMs, nowMs)) return;

    const options = guideDayOptions(nowMs);
    const firstDayStartMs = options[0]!.fromMs;
    const lastDayStartMs = options.at(-1)!.fromMs;
    const replacementDayStartMs =
      windowStartDayMs < firstDayStartMs
        ? firstDayStartMs
        : windowStartDayMs > lastDayStartMs
          ? lastDayStartMs
          : guideTelevisionDayStart(nowMs);
    const target = guideTargetForDaySelection(
      viewedTimeRef.current,
      replacementDayStartMs,
    );
    pendingTargetTimeRef.current = target.timeMs;
    syncProgrammeWindowForTarget(target.timeMs, replacementDayStartMs);
    commitViewedTime(target.timeMs);
    setWindowStartDayMs(replacementDayStartMs);
  }, [
    commitViewedTime,
    nowMs,
    syncProgrammeWindowForTarget,
    windowStartDayMs,
  ]);

  useEffect(() => {
    const target =
      pendingTargetTimeRef.current ??
      guideTargetForDaySelection(viewedTimeRef.current, windowStartDayMs).timeMs;
    pendingTargetTimeRef.current = null;
    const frame = requestAnimationFrame(() => scrollToTime(target, false));
    return () => cancelAnimationFrame(frame);
  }, [scrollToTime, windowStartDayMs]);

  const changeDay = useCallback(
    (nextDayStartMs: number) => {
      if (
        nextDayStartMs === visibleDayStartMs &&
        nextDayStartMs === windowStartDayMs
      ) {
        return;
      }
      const target = guideTargetForDaySelection(
        viewedTimeRef.current,
        nextDayStartMs,
      );
      pendingTargetTimeRef.current = target.timeMs;
      syncProgrammeWindowForTarget(target.timeMs, target.dayStartMs);
      commitViewedTime(target.timeMs);
      setWindowStartDayMs(target.dayStartMs);
    },
    [
      commitViewedTime,
      syncProgrammeWindowForTarget,
      visibleDayStartMs,
      windowStartDayMs,
    ],
  );

  useEffect(() => {
    const nextChannelIds = runtimeFixture.channels.map(({ id }) => id);
    if (nextChannelIds.length === 0) {
      previousChannelIdsRef.current = nextChannelIds;
      previousRowHeightRef.current = layout.rowHeight;
      return;
    }

    const currentScheduleOffset = totaalScheduleOffsetForNativeOffset(
      scrollY.value,
      collapseProgress.value,
    );
    const previousChannelIds =
      previousChannelIdsRef.current.length > 0
        ? previousChannelIdsRef.current
        : nextChannelIds;
    const previousRowHeight = previousRowHeightRef.current;
    const rememberedId =
      viewedChannelIdRef.current ??
      totaalChannelIdForScheduleOffset(
        previousChannelIds,
        previousRowHeight,
        currentScheduleOffset,
      ) ??
      nextChannelIds[0] ??
      null;
    viewedChannelIdRef.current = rememberedId;

    const nextScheduleOffset = totaalPreservedChannelScheduleOffset({
      previousChannelIds,
      nextChannelIds,
      channelId: rememberedId,
      previousRowHeight,
      nextRowHeight: layout.rowHeight,
      currentScheduleOffset,
    });
    previousChannelIdsRef.current = nextChannelIds;
    previousRowHeightRef.current = layout.rowHeight;

    if (Math.abs(nextScheduleOffset - currentScheduleOffset) < 0.5) return;

    const nativeY = totaalNativeOffsetForScheduleOffset(
      nextScheduleOffset,
      collapseProgress.value,
    );
    scrollY.value = nativeY;
    const frame = requestAnimationFrame(() => {
      verticalRef.current?.scrollTo({ y: nativeY, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [
    collapseProgress,
    layout.rowHeight,
    runtimeFixture.channels,
    scrollY,
  ]);

  const jumpToNow = useCallback(() => {
    const target = guideTargetForNow(Date.now());
    if (target.timeMs >= windowStart && target.timeMs < windowEnd) {
      scrollToTime(target.timeMs, !reduceMotion);
      return;
    }
    pendingTargetTimeRef.current = target.timeMs;
    syncProgrammeWindowForTarget(target.timeMs, target.dayStartMs);
    commitViewedTime(target.timeMs);
    setWindowStartDayMs(target.dayStartMs);
  }, [
    commitViewedTime,
    reduceMotion,
    scrollToTime,
    syncProgrammeWindowForTarget,
    windowEnd,
    windowStart,
  ]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View
        pointerEvents="box-none"
        style={[
          styles.guideOverlay,
          {
            top: safeAreaLayout.overlayTop,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <GuideChrome
          condensed={condensed}
          presentationNavigation={presentationNavigation}
          collapseProgress={collapseProgress}
        />

        <View
          testID="totaal-day-context"
          style={[styles.dayContext, { backgroundColor: theme.colors.background }]}
        >
          <GuideDaySelector
            selectedDayStartMs={visibleDayStartMs}
            nowMs={nowMs}
            loading={selectedWindow.loading}
            unavailable={selectedWindow.unavailable}
            labelVariant="per-channel"
            onSelectDay={changeDay}
          />

          <Pressable
            testID="totaal-now"
            accessibilityRole="button"
            accessibilityLabel="Ga naar nu"
            onPress={jumpToNow}
            style={[
              styles.nowTouchTarget,
              {
                minWidth: minimumTouchTarget,
                minHeight: minimumTouchTarget,
              },
            ]}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.nowVisible,
                  {
                    backgroundColor: pressed
                      ? theme.colors.surfaceElevated
                      : 'transparent',
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
                  style={[styles.nowText, { color: theme.colors.text }]}
                >
                  Nu
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View
          testID="totaal-time-axis-shell"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.axisRow, { backgroundColor: theme.colors.background }]}
        >
          <View
            testID="totaal-axis-corner"
            style={[
              styles.axisCorner,
              {
                width: layout.channelWidth,
                borderRightColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.axisBaseline,
                {
                  backgroundColor: theme.colors.railTick,
                  opacity: TOTAAL_VISUAL_METRICS.axisBaselineOpacity,
                },
              ]}
            />
          </View>

          <View style={[styles.axisViewport, { width: programmeViewportWidth }]}>
            <Animated.ScrollView
              ref={axisRef}
              testID="totaal-time-axis-scroll"
              horizontal
              bounces
              directionalLockEnabled
              decelerationRate="normal"
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={axisScrollHandler}
            >
              <View style={[styles.axisTrack, { width }]}>
              <View
                style={[
                  styles.axisBaseline,
                  {
                    backgroundColor: theme.colors.railTick,
                    opacity: TOTAAL_VISUAL_METRICS.axisBaselineOpacity,
                  },
                ]}
              />
              {ticks.map((tick) => {
                const left = timeToX(tick, windowStart, layout.minuteWidth);
                const tickPresentation = totaalTimeAxisTickPresentation(tick);
                return (
                  <TimeAxisTick
                    key={tick}
                    left={left}
                    label={formatGuideTime(tick)}
                    labelWidth={layout.tickLabelWidth}
                    labelColor={theme.colors.textMuted}
                    tickColor={theme.colors.railTick}
                    major={tickPresentation.major}
                    tickHeight={tickPresentation.tickHeight}
                    tickOpacity={tickPresentation.tickOpacity}
                  />
                );
              })}
              </View>
            </Animated.ScrollView>

            {ticks.length > 0 ? (
              <TimeAxisLeftMask
                height={layout.timeAxisHeight}
                firstTickX={firstTickX}
                tickSpacing={labelSpacing}
                labelWidth={layout.tickLabelWidth}
                backgroundColor={theme.colors.background}
                scrollX={scrollX}
              />
            ) : null}

            {nowInWindow ? (
              <>
                <Animated.View
                  testID="totaal-current-time-marker"
                  pointerEvents="none"
                  style={[
                    styles.currentMarkerBody,
                    { backgroundColor: theme.colors.currentTime },
                    currentMarkerBodyStyle,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
                    style={[
                      styles.currentMarkerText,
                      { color: theme.colors.onCurrentTime },
                    ]}
                  >
                    {formatGuideTime(nowMs)}
                  </Text>
                </Animated.View>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.currentMarkerPointer,
                    { borderTopColor: theme.colors.currentTime },
                    currentMarkerPointerStyle,
                  ]}
                />
              </>
            ) : null}
          </View>
        </View>
      </View>

      <View
        testID="totaal-schedule-viewport"
        style={[
          styles.scheduleViewport,
          {
            top: safeAreaLayout.scheduleViewportTop,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.channelColumn,
            {
              width: layout.channelWidth,
              borderRightColor: theme.colors.border,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.channelContent,
              { height: stableScrollGeometry.contentTopInset + guideHeight },
              channelContentStyle,
            ]}
          >
            {runtimeFixture.channels.map((channel, rowIndex) => {
              const programmeActionCount =
                programmesByChannel.get(channel.id)?.length ?? 0;
              return (
                <View
                  key={channel.id}
                  style={[
                    styles.channelCell,
                    {
                      top: rowIndex * layout.rowHeight,
                      height: layout.rowHeight,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <ChannelIdentity
                    channel={channel}
                    textColor={theme.colors.text}
                    mutedTextColor={theme.colors.textSecondary}
                    variant="totaal"
                    accessible={totaalChannelIdentityAccessible(programmeActionCount)}
                  />
                </View>
              );
            })}
          </Animated.View>
        </View>

        <Animated.ScrollView
          testID="guide-time-scroll"
          ref={horizontalRef}
          horizontal
          bounces
          directionalLockEnabled
          decelerationRate="normal"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={horizontalScrollHandler}
          style={[
            styles.programmeHorizontalViewport,
            { left: layout.channelWidth },
          ]}
        >
          <Animated.ScrollView
            ref={verticalRef}
            testID="guide-channel-scroll"
            bounces
            alwaysBounceVertical
            directionalLockEnabled
            nestedScrollEnabled
            decelerationRate="normal"
            showsVerticalScrollIndicator
            scrollEventThrottle={16}
            onScroll={verticalScrollHandler}
            style={{ width }}
            contentContainerStyle={{
              minHeight: stableScrollGeometry.contentTopInset + guideHeight,
            }}
          >
            <Animated.View
              style={[
                styles.scheduleContent,
                {
                  width,
                  minHeight: stableScrollGeometry.contentTopInset + guideHeight,
                  paddingTop: stableScrollGeometry.contentTopInset,
                },
                scheduleContentStyle,
              ]}
            >
              <View style={{ width, height: guideHeight }}>
                {runtimeFixture.channels.map((channel, rowIndex) => (
                  <View
                    key={channel.id}
                    style={[
                      styles.programmeRow,
                      {
                        top: rowIndex * layout.rowHeight,
                        height: layout.rowHeight,
                        width,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    {(windowedProgrammesByChannel.get(channel.id) ?? []).map(
                      (programme) => (
                        <TotaalProgrammeCell
                          key={programme.id}
                          channel={channel}
                          programme={programme}
                          nowMs={nowMs}
                          windowStartMs={windowStart}
                          minuteWidth={layout.minuteWidth}
                          onSelectProgramme={onSelectProgramme}
                        />
                      ),
                    )}
                  </View>
                ))}
              </View>
            </Animated.View>
          </Animated.ScrollView>
        </Animated.ScrollView>

        <View
          pointerEvents="none"
          style={[
            styles.edgeOverlayFrame,
            { left: layout.channelWidth },
          ]}
        >
          <EdgeReadabilityOverlay
            fixture={runtimeFixture}
            layout={layout}
            windowStart={windowStart}
            viewportWidth={programmeViewportWidth}
            nowMs={nowMs}
            scrollX={scrollX}
            scrollY={scrollY}
            contentTopInset={stableScrollGeometry.contentTopInset}
            collapseProgress={collapseProgress}
            fontScale={effectiveFontScale}
          />
        </View>

        {scheduleStatus ? (
          <Animated.View
            testID={`totaal-programme-state-${scheduleStatus}`}
            accessible
            accessibilityRole="text"
            accessibilityLabel={scheduleStatusLabel}
            accessibilityLiveRegion="polite"
            style={[
              styles.scheduleStatus,
              {
                left: layout.channelWidth,
                backgroundColor: theme.colors.background,
              },
              statusStyle,
            ]}
          >
            <Text
              style={[
                styles.scheduleStatusText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {scheduleStatusLabel}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  guideOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 5,
  },
  dayContext: {
    height: TOTAAL_VISUAL_METRICS.dayContextHeight,
    paddingHorizontal: TOTAAL_VISUAL_METRICS.dateInsetX,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nowTouchTarget: {
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowVisible: {
    height: TOTAAL_VISUAL_METRICS.nowVisibleHeight,
    minWidth: TOTAAL_VISUAL_METRICS.nowMinWidth,
    paddingHorizontal: TOTAAL_VISUAL_METRICS.nowPaddingX,
    borderRadius: TOTAAL_VISUAL_METRICS.nowRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowText: {
    ...GUIDE_TYPOGRAPHY.utility,
    letterSpacing: 0,
  },
  axisRow: {
    height: TOTAAL_VISUAL_METRICS.timeAxisHeight,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  axisCorner: {
    height: TOTAAL_VISUAL_METRICS.timeAxisHeight,
    borderRightWidth: 1,
    position: 'relative',
  },
  axisViewport: {
    height: TOTAAL_VISUAL_METRICS.timeAxisHeight,
    position: 'relative',
    overflow: 'hidden',
  },
  axisTrack: {
    height: TOTAAL_VISUAL_METRICS.timeAxisHeight,
    position: 'relative',
  },
  axisBaseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TOTAAL_VISUAL_METRICS.axisBaselineHeight,
  },
  currentMarkerBody: {
    position: 'absolute',
    bottom: TOTAAL_VISUAL_METRICS.currentMarkerPointerHeight,
    width: CURRENT_MARKER_BODY_WIDTH,
    height: TOTAAL_VISUAL_METRICS.currentMarkerBodyHeight,
    paddingHorizontal: TOTAAL_VISUAL_METRICS.currentMarkerPaddingX,
    borderRadius: TOTAAL_VISUAL_METRICS.currentMarkerRadius,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  currentMarkerText: {
    ...TOTAAL_TYPOGRAPHY.currentMarker,
    letterSpacing: 0,
  },
  currentMarkerPointer: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: TOTAAL_VISUAL_METRICS.currentMarkerPointerWidth / 2,
    borderRightWidth: TOTAAL_VISUAL_METRICS.currentMarkerPointerWidth / 2,
    borderTopWidth: TOTAAL_VISUAL_METRICS.currentMarkerPointerHeight,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 6,
  },
  scheduleViewport: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  channelColumn: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 3,
    overflow: 'hidden',
    borderRightWidth: 1,
  },
  channelContent: {
    position: 'relative',
    width: '100%',
  },
  channelCell: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  programmeHorizontalViewport: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
  },
  scheduleContent: {
    position: 'relative',
  },
  programmeRow: {
    position: 'absolute',
    left: 0,
    borderBottomWidth: 1,
  },
  edgeOverlayFrame: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    overflow: 'hidden',
  },
  scheduleStatus: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 5,
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  scheduleStatusText: {
    ...TOTAAL_TYPOGRAPHY.programmeSecondary,
  },
});
