import { type ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { isProgrammeCurrent } from '@/data/domain/epg';
import { guideTelevisionDayStart } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture } from '@/data/fixtures/runtimeGuideFixture';
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
import {
  formatGuideTime,
  indexGuideProgrammesByChannel,
} from './guideRenderData';
import {
  buildTimeTicks,
  programmeContentMode,
  programmeFrame,
  timeToX,
  timelineWidth,
} from './geometry';
import { guideLayoutForFontScale } from './layout';
import { GUIDE_TIME_TICK_INTERVAL_MINUTES } from './timeAxis';
import { TimeAxisLeftMask } from './TimeAxisLeftMask';
import { TimeAxisTick } from './TimeAxisTick';
import { useGuideClock } from './useGuideClock';
import { useSelectedGuideDaySchedule } from './useSelectedGuideDaySchedule';

const GUIDE_CONTROL_MAX_FONT_SIZE_MULTIPLIER = 1.2;
const TIME_ANCHOR_INSET = 120;
const HEADER_CONDENSE_THRESHOLD = 24;

type GuideViewProps = {
  guideDataVersion: number;
  headerAction?: ReactNode;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

function clampTime(timeMs: number, fromMs: number, toMs: number) {
  return Math.min(toMs - 1, Math.max(fromMs, timeMs));
}

// Modal visibility lives outside this memo boundary. Keep the same mounted
// ScrollViews and stable selection callback when opening or closing a detail.
export const GuideView = memo(function GuideView({
  guideDataVersion,
  onSelectProgramme,
  headerAction,
}: GuideViewProps) {
  const theme = useTeeveeTheme();
  const { fontScale, width: windowWidth } = useWindowDimensions();
  const layout = useMemo(() => guideLayoutForFontScale(fontScale), [fontScale]);
  const horizontalRef = useRef<ScrollView>(null);
  const channelRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
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
  );
  const runtimeFixture = useMemo(
    () => selectedWindow.schedule ?? buildRuntimeGuideFixture(windowStartDayMs),
    [guideDataVersion, selectedWindow.schedule, windowStartDayMs],
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
  const ticks = useMemo(() => buildTimeTicks(windowStart, windowEnd), [windowStart, windowEnd]);
  const firstTickX = ticks.length > 0 ? timeToX(ticks[0]!, windowStart, layout.minuteWidth) : 0;
  const tickSpacing = GUIDE_TIME_TICK_INTERVAL_MINUTES * layout.minuteWidth;
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

  const syncVerticalScroll = useCallback((y: number) => {
    channelRef.current?.scrollTo({ y, animated: false });
  }, []);

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
    () => scrollY.value > HEADER_CONDENSE_THRESHOLD,
    (nextCondensed, previousCondensed) => {
      if (nextCondensed === previousCondensed) return;
      scheduleOnRN(syncCondensed, nextCondensed);
    },
    [scrollY, syncCondensed],
  );

  useAnimatedReaction(
    () =>
      programmeViewportWidth > 0
        ? Math.floor(Math.max(0, scrollX.value) / programmeViewportWidth)
        : 0,
    (nextBucket, previousBucket) => {
      if (nextBucket === previousBucket) return;
      // Keep horizontal scroll frames on the UI thread. React only receives a coarse
      // update after crossing a full viewport-width bucket; overscan covers the gap.
      scheduleOnRN(syncProgrammeWindowBucket, nextBucket);
    },
    [programmeViewportWidth, scrollX, syncProgrammeWindowBucket],
  );

  const viewedTimeForX = useCallback(
    (viewportX: number) =>
      clampTime(
        windowStart + ((Math.max(0, viewportX) + TIME_ANCHOR_INSET) / layout.minuteWidth) * 60_000,
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
      if (previouslyInFollowingDay === null || inFollowingDay === previouslyInFollowingDay) return;
      scheduleOnRN(syncHorizontalAnchor, scrollX.value);
    },
    [followingDayBoundaryX, includeFollowingDay, scrollX, syncHorizontalAnchor],
  );

  const horizontalScrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        scrollX.value = Math.max(0, event.contentOffset.x);
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
    [scrollX, syncHorizontalAnchor],
  );

  const verticalScrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const y = event.contentOffset.y;
        scrollY.value = y;
        scheduleOnRN(syncVerticalScroll, y);
      },
    },
    [scrollY, syncVerticalScroll],
  );

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
    },
    [
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
    const replacementDayStartMs = windowStartDayMs < firstDayStartMs
      ? firstDayStartMs
      : windowStartDayMs > lastDayStartMs
        ? lastDayStartMs
        : guideTelevisionDayStart(nowMs);
    const target = guideTargetForDaySelection(viewedTimeRef.current, replacementDayStartMs);
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
    const target = pendingTargetTimeRef.current ??
      guideTargetForDaySelection(viewedTimeRef.current, windowStartDayMs).timeMs;
    pendingTargetTimeRef.current = null;
    const frame = requestAnimationFrame(() => scrollToTime(target, false));
    return () => cancelAnimationFrame(frame);
  }, [scrollToTime, windowStartDayMs]);

  const changeDay = useCallback(
    (nextDayStartMs: number) => {
      if (nextDayStartMs === visibleDayStartMs && nextDayStartMs === windowStartDayMs) return;
      const target = guideTargetForDaySelection(viewedTimeRef.current, nextDayStartMs);
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

  const jumpToNow = useCallback(() => {
    const target = guideTargetForNow(Date.now());
    if (target.timeMs >= windowStart && target.timeMs < windowEnd) {
      scrollToTime(target.timeMs, true);
      return;
    }
    pendingTargetTimeRef.current = target.timeMs;
    syncProgrammeWindowForTarget(target.timeMs, target.dayStartMs);
    commitViewedTime(target.timeMs);
    setWindowStartDayMs(target.dayStartMs);
  }, [
    commitViewedTime,
    scrollToTime,
    syncProgrammeWindowForTarget,
    windowEnd,
    windowStart,
  ]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <GuideChrome
        condensed={condensed}
        presentationNavigation={headerAction}
      />

      <View
        style={[
          styles.guideControls,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <GuideDaySelector
          selectedDayStartMs={visibleDayStartMs}
          nowMs={nowMs}
          loading={selectedWindow.loading}
          unavailable={selectedWindow.unavailable}
          onSelectDay={changeDay}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ga naar nu"
          onPress={jumpToNow}
          style={[styles.nowBadge, { borderColor: theme.colors.border }]}
        >
          <Text
            maxFontSizeMultiplier={GUIDE_CONTROL_MAX_FONT_SIZE_MULTIPLIER}
            style={[styles.nowText, { color: theme.colors.text }]}
          >
            Nu
          </Text>
        </Pressable>
      </View>

      <View style={[styles.guideFrame, { borderColor: theme.colors.border }]}>
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.channelColumn,
            {
              width: layout.channelWidth,
              backgroundColor: theme.colors.background,
              borderRightColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.channelAxisCorner,
              { height: layout.timeAxisHeight, borderBottomColor: theme.colors.border },
            ]}
          />
          <ScrollView ref={channelRef} showsVerticalScrollIndicator={false} scrollEnabled={false}>
            {runtimeFixture.channels.map((channel) => (
              <View
                key={channel.id}
                style={[
                  styles.channelCell,
                  { height: layout.rowHeight, borderBottomColor: theme.colors.border },
                ]}
              >
                <ChannelIdentity
                  channel={channel}
                  textColor={theme.colors.text}
                  mutedTextColor={theme.colors.textMuted}
                  variant="logo-first"
                />
              </View>
            ))}
          </ScrollView>
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
        >
          <View style={{ width }}>
            <View
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.timeAxis,
                {
                  height: layout.timeAxisHeight,
                  backgroundColor: theme.colors.background,
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              {ticks.map((tick) => {
                const left = timeToX(tick, windowStart, layout.minuteWidth);
                return (
                  <TimeAxisTick
                    key={tick}
                    left={left}
                    label={formatGuideTime(tick)}
                    labelWidth={layout.tickLabelWidth}
                    labelColor={theme.colors.textMuted}
                    borderColor={theme.colors.border}
                  />
                );
              })}
              {nowInWindow ? (
                <View
                  pointerEvents="none"
                  style={[styles.currentTimeMarker, { left: nowX }]}
                >
                  <View style={[styles.currentTimeBadge, { backgroundColor: theme.colors.currentTime }]}>
                    <Text
                      numberOfLines={1}
                      maxFontSizeMultiplier={GUIDE_CONTROL_MAX_FONT_SIZE_MULTIPLIER}
                      style={[
                        styles.currentTimeText,
                        { color: theme.dark ? theme.colors.text : theme.colors.surface },
                      ]}
                    >
                      {formatGuideTime(nowMs)}
                    </Text>
                  </View>
                  <View style={[styles.currentTimeTick, { backgroundColor: theme.colors.currentTime }]} />
                </View>
              ) : null}
            </View>

            <Animated.ScrollView
              testID="guide-channel-scroll"
              bounces
              alwaysBounceVertical
              directionalLockEnabled
              decelerationRate="normal"
              showsVerticalScrollIndicator
              scrollEventThrottle={16}
              onScroll={verticalScrollHandler}
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
                    {(windowedProgrammesByChannel.get(channel.id) ?? []).map((programme) => {
                      const frame = programmeFrame(programme, windowStart, layout.minuteWidth);
                      const startMs = Date.parse(programme.startAt);
                      const endMs = Date.parse(programme.endAt);
                      const isCurrent = isProgrammeCurrent(programme, nowMs);
                      const contentMode = programmeContentMode(frame.width);
                      const horizontalPadding = contentMode === 'compact' ? 5 : 8;
                      const programmeTextWidth = Math.max(0, frame.width - horizontalPadding * 2);
                      const titleLines = layout.largeText || contentMode === 'comfortable' ? 2 : 1;
                      const showProgrammeTime = contentMode !== 'compact';
                      const accessibilityStatus = isCurrent ? ', nu bezig' : '';
                      const timeCopy = isCurrent
                        ? `tot ${formatGuideTime(endMs)}`
                        : formatGuideTime(startMs);

                      return (
                        <Pressable
                          key={programme.id}
                          testID={`programme-${programme.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={`${channel.displayName}, ${programme.title}, ${formatGuideTime(startMs)} tot ${formatGuideTime(endMs)}${accessibilityStatus}`}
                          accessibilityHint="Opent programmadetails"
                          onPress={() => onSelectProgramme({ programme, channelName: channel.displayName })}
                          style={({ pressed }) => [
                            styles.programme,
                            contentMode === 'compact' ? styles.programmeCompact : null,
                            {
                              left: frame.left,
                              width: frame.width,
                              paddingHorizontal: horizontalPadding,
                              borderRightColor: theme.colors.border,
                              backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.programmeTextContent,
                              { width: programmeTextWidth },
                            ]}
                          >
                            <Text
                              numberOfLines={titleLines}
                              ellipsizeMode="tail"
                              style={[
                                styles.programmeTitle,
                                contentMode === 'compact' ? styles.programmeTitleCompact : null,
                                isCurrent ? styles.programmeTitleCurrent : null,
                                { color: theme.colors.text },
                              ]}
                            >
                              {programme.title}
                            </Text>
                            {showProgrammeTime ? (
                              <Text
                                numberOfLines={1}
                                style={[styles.programmeTime, { color: theme.colors.textMuted }]}
                              >
                                {timeCopy}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </Animated.ScrollView>
          </View>
        </Animated.ScrollView>

        {ticks.length > 0 ? (
          <TimeAxisLeftMask
            left={layout.channelWidth}
            height={layout.timeAxisHeight}
            firstTickX={firstTickX}
            tickSpacing={tickSpacing}
            labelWidth={layout.tickLabelWidth}
            backgroundColor={theme.colors.background}
            borderBottomColor={theme.colors.border}
            scrollX={scrollX}
          />
        ) : null}

        <View
          pointerEvents="none"
          style={[
            styles.edgeOverlayFrame,
            {
              left: layout.channelWidth,
              top: layout.timeAxisHeight,
            },
          ]}
        >
          <EdgeReadabilityOverlay
            fixture={runtimeFixture}
            layout={layout}
            windowStart={windowStart}
            viewportWidth={programmeViewportWidth}
            scrollX={scrollX}
            scrollY={scrollY}
          />
        </View>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  guideControls: {
    minHeight: 52,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nowBadge: {
    minWidth: 48,
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  nowText: { fontSize: 13, lineHeight: 17, fontWeight: '700' },
  guideFrame: { flex: 1, flexDirection: 'row' },
  channelColumn: { zIndex: 2, borderRightWidth: StyleSheet.hairlineWidth },
  channelAxisCorner: { borderBottomWidth: StyleSheet.hairlineWidth },
  channelCell: { justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  timeAxis: { position: 'relative', borderBottomWidth: StyleSheet.hairlineWidth },
  currentTimeMarker: {
    position: 'absolute',
    bottom: 0,
    width: 1,
    alignItems: 'center',
    zIndex: 5,
  },
  currentTimeBadge: {
    minWidth: 56,
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -5 }],
  },
  currentTimeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  currentTimeTick: {
    width: 2,
    height: 8,
    borderRadius: 1,
  },
  programmeRow: { position: 'absolute', left: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  programme: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    paddingVertical: 9,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  programmeCompact: {
    paddingVertical: 7,
  },
  programmeTextContent: {
    flexShrink: 1,
  },
  programmeTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  programmeTitleCurrent: {
    fontWeight: '600',
  },
  programmeTitleCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  programmeTime: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  edgeOverlayFrame: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 3,
    overflow: 'hidden',
  },
});
