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

import { isProgrammeCurrent, programmeProgress } from '@/data/domain/epg';
import { guideTelevisionDayStart, GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import {
  buildRuntimeGuideFixture,
  programmesForRuntimeChannel,
} from '@/data/fixtures/runtimeGuideFixture';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { ChannelIdentity } from './ChannelIdentity';
import type { ProgrammeSelection } from './detailState';
import { EdgeReadabilityOverlay } from './EdgeReadabilityOverlay';
import { GuideDaySelector } from './GuideDaySelector';
import {
  guideTargetForDaySelection,
  guideTargetForNow,
} from './guideDaySelection';
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
import { useGuideDaySelection } from './useGuideDaySelection';
import { useSelectedGuideDaySchedule } from './useSelectedGuideDaySchedule';

const GUIDE_CONTROL_MAX_FONT_SIZE_MULTIPLIER = 1.2;
const TIME_ANCHOR_INSET = 120;
const HEADER_CONDENSE_THRESHOLD = 24;

type GuideViewProps = {
  guideDataVersion: number;
  headerAction?: ReactNode;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

function formatTime(timeMs: number) {
  return new Date(timeMs).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: GUIDE_TIME_ZONE,
  });
}

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
  const { selectedDayStartMs, selectDay } = useGuideDaySelection(nowMs);
  const selectedDay = useSelectedGuideDaySchedule(selectedDayStartMs, guideDataVersion);
  const runtimeFixture = useMemo(
    () => selectedDay.schedule ?? buildRuntimeGuideFixture(selectedDayStartMs),
    [guideDataVersion, selectedDay.schedule, selectedDayStartMs],
  );
  const viewedTimeRef = useRef(Date.now());
  const pendingTargetTimeRef = useRef<number | null>(null);
  const [condensed, setCondensed] = useState(false);

  const windowStart = selectedDayStartMs;
  const windowEnd = useMemo(
    () => guideTelevisionDayStart(selectedDayStartMs, 1),
    [selectedDayStartMs],
  );
  const width = timelineWidth(windowStart, windowEnd, layout.minuteWidth);
  const ticks = useMemo(() => buildTimeTicks(windowStart, windowEnd), [windowStart, windowEnd]);
  const firstTickX = ticks.length > 0 ? timeToX(ticks[0]!, windowStart, layout.minuteWidth) : 0;
  const tickSpacing = GUIDE_TIME_TICK_INTERVAL_MINUTES * layout.minuteWidth;
  const nowX = timeToX(nowMs, windowStart, layout.minuteWidth);
  const nowInWindow = nowMs >= windowStart && nowMs < windowEnd;
  const guideHeight = runtimeFixture.channels.length * layout.rowHeight;
  const programmeViewportWidth = Math.max(0, windowWidth - layout.channelWidth);

  const syncVerticalScroll = useCallback((y: number) => {
    channelRef.current?.scrollTo({ y, animated: false });
  }, []);

  const syncCondensed = useCallback((nextCondensed: boolean) => {
    setCondensed((current) => (current === nextCondensed ? current : nextCondensed));
  }, []);

  useAnimatedReaction(
    () => scrollY.value > HEADER_CONDENSE_THRESHOLD,
    (nextCondensed, previousCondensed) => {
      if (nextCondensed === previousCondensed) return;
      scheduleOnRN(syncCondensed, nextCondensed);
    },
    [scrollY, syncCondensed],
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

  const handleHorizontalMomentumEnd = useCallback(
    (viewportX: number) => {
      viewedTimeRef.current = viewedTimeForX(viewportX);
    },
    [viewedTimeForX],
  );

  const horizontalScrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        // Keep every scroll frame on the UI thread. Bridging every x-position
        // to JS can queue work behind a programme tap immediately after a fling.
        scrollX.value = Math.max(0, event.contentOffset.x);
      },
      onMomentumEnd: (event) => {
        const viewportX = Math.max(0, event.contentOffset.x);
        scheduleOnRN(handleHorizontalMomentumEnd, viewportX);
      },
    },
    [handleHorizontalMomentumEnd, scrollX],
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
      viewedTimeRef.current = target;
      const x = Math.max(
        0,
        timeToX(target, windowStart, layout.minuteWidth) - TIME_ANCHOR_INSET,
      );
      scrollX.value = x;
      horizontalRef.current?.scrollTo({ x, animated });
    },
    [layout.minuteWidth, scrollX, windowEnd, windowStart],
  );

  useEffect(() => {
    const target = pendingTargetTimeRef.current ??
      guideTargetForDaySelection(viewedTimeRef.current, selectedDayStartMs).timeMs;
    pendingTargetTimeRef.current = null;
    const frame = requestAnimationFrame(() => scrollToTime(target, false));
    return () => cancelAnimationFrame(frame);
  }, [scrollToTime, selectedDayStartMs]);

  const changeDay = useCallback(
    (nextDayStartMs: number) => {
      if (nextDayStartMs === selectedDayStartMs) return;
      const target = guideTargetForDaySelection(viewedTimeRef.current, nextDayStartMs);
      pendingTargetTimeRef.current = target.timeMs;
      selectDay(target.dayStartMs);
    },
    [selectDay, selectedDayStartMs],
  );

  const jumpToNow = useCallback(() => {
    const target = guideTargetForNow(Date.now());
    if (target.dayStartMs === selectedDayStartMs) {
      scrollToTime(target.timeMs, true);
      return;
    }
    pendingTargetTimeRef.current = target.timeMs;
    selectDay(target.dayStartMs);
  }, [scrollToTime, selectDay, selectedDayStartMs]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {!condensed ? (
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text accessible={false} style={[styles.eyebrow, { color: theme.colors.textMuted }]}>TEEVEE</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Gids</Text>
          </View>
          {headerAction}
        </View>
      ) : null}

      <View
        style={[
          styles.guideControls,
          condensed ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
        ]}
      >
        <GuideDaySelector
          selectedDayStartMs={selectedDayStartMs}
          nowMs={nowMs}
          loading={selectedDay.loading}
          unavailable={selectedDay.unavailable}
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
              backgroundColor: theme.colors.surface,
              borderRightColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.channelAxisCorner,
              { height: layout.timeAxisHeight, borderBottomColor: theme.colors.border },
            ]}
          >
            <Text numberOfLines={1} style={[styles.axisCornerText, { color: theme.colors.textMuted }]}>ZENDER</Text>
          </View>
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
                  backgroundColor: theme.colors.surface,
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
                    label={formatTime(tick)}
                    labelWidth={layout.tickLabelWidth}
                    labelColor={theme.colors.textMuted}
                    borderColor={theme.colors.border}
                  />
                );
              })}
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
                    {programmesForRuntimeChannel(runtimeFixture, channel.id).map((programme) => {
                      const frame = programmeFrame(programme, windowStart, layout.minuteWidth);
                      const end = frame.left + frame.width;
                      if (end < 0 || frame.left > width) return null;
                      const startMs = Date.parse(programme.startAt);
                      const endMs = Date.parse(programme.endAt);
                      const isCurrent = isProgrammeCurrent(programme, nowMs);
                      const progress = isCurrent ? programmeProgress(programme, nowMs) : 0;
                      const contentMode = programmeContentMode(frame.width);
                      const horizontalPadding = contentMode === 'compact' ? 5 : 8;
                      const programmeTextWidth = Math.max(0, frame.width - horizontalPadding * 2);
                      const titleLines = layout.largeText ? 1 : contentMode === 'comfortable' ? 2 : 1;
                      const showProgrammeTime = !layout.largeText && contentMode !== 'compact';
                      const accessibilityStatus = isCurrent ? ', nu bezig' : '';

                      return (
                        <Pressable
                          key={programme.id}
                          testID={`programme-${programme.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={`${channel.displayName}, ${programme.title}, ${formatTime(startMs)} tot ${formatTime(endMs)}${accessibilityStatus}`}
                          accessibilityHint="Opent programmadetails"
                          onPress={() => onSelectProgramme({ programme, channelName: channel.displayName })}
                          style={({ pressed }) => [
                            styles.programme,
                            contentMode === 'compact' ? styles.programmeCompact : null,
                            layout.largeText ? styles.programmeLargeText : null,
                            {
                              left: frame.left,
                              width: frame.width,
                              backgroundColor: isCurrent ? theme.colors.programmeCurrent : theme.colors.programme,
                              opacity: pressed ? 0.65 : 1,
                            },
                          ]}
                        >
                          {isCurrent && contentMode !== 'compact' ? (
                            <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
                              <View
                                style={[
                                  styles.progressFill,
                                  {
                                    width: `${progress * 100}%`,
                                    backgroundColor: theme.colors.currentTime,
                                  },
                                ]}
                              />
                            </View>
                          ) : null}
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
                                { color: theme.colors.text },
                              ]}
                            >
                              {programme.title}
                            </Text>
                            {showProgrammeTime ? (
                              <Text numberOfLines={1} style={[styles.programmeTime, { color: theme.colors.textMuted }]}
                              >
                                {formatTime(startMs)}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
                {nowInWindow ? (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.currentTimeLine,
                      { left: nowX, backgroundColor: theme.colors.currentTime, height: guideHeight },
                    ]}
                  />
                ) : null}
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
            backgroundColor={theme.colors.surface}
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
            nowMs={nowMs}
            nowX={nowX}
            nowInWindow={nowInWindow}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 8,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitleGroup: { flexShrink: 1 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -1.2 },
  guideControls: {
    minHeight: 56,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  nowBadge: {
    minWidth: 52,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  nowText: { fontSize: 14, fontWeight: '700' },
  guideFrame: { flex: 1, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  channelColumn: { zIndex: 2, borderRightWidth: StyleSheet.hairlineWidth },
  channelAxisCorner: { justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  axisCornerText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  channelCell: { justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  timeAxis: { position: 'relative', borderBottomWidth: StyleSheet.hairlineWidth },
  programmeRow: { position: 'absolute', left: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  programme: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  programmeCompact: { paddingHorizontal: 5, paddingVertical: 6, justifyContent: 'center' },
  programmeLargeText: { justifyContent: 'center' },
  programmeTextContent: { flexShrink: 1 },
  programmeTitle: { fontSize: 12, fontWeight: '600' },
  programmeTitleCompact: { fontSize: 10 },
  programmeTime: { fontSize: 10, marginTop: 4 },
  progressTrack: { height: 2, borderRadius: 1, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%' },
  currentTimeLine: { position: 'absolute', top: 0, width: 2, zIndex: 4 },
  edgeOverlayFrame: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 3,
    overflow: 'hidden',
  },
});
