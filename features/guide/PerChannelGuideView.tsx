import { type ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { isProgrammeCurrent, type Channel, type GuideFixture } from '@/data/domain/epg';
import { guideTelevisionDayStart, GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture } from '@/data/fixtures/runtimeGuideFixture';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { ChannelIdentity } from './ChannelIdentity';
import type { ProgrammeSelection } from './detailState';
import { GuideChrome } from './GuideChrome';
import { GuideDaySelector } from './GuideDaySelector';
import {
  guideTargetForDaySelection,
  guideTargetForNow,
  guideTargetForPrimetime,
} from './guideDaySelection';
import {
  adjacentChannelIndex,
  PER_CHANNEL_MINUTE_HEIGHT,
  programmeVerticalFrame,
  programmesForChannelDay,
  scheduleYForTime,
} from './perChannel';
import { useGuideClock } from './useGuideClock';
import { useGuideDaySelection } from './useGuideDaySelection';
import { useSelectedGuideDaySchedule } from './useSelectedGuideDaySchedule';

const CONTROL_MAX_FONT_SIZE_MULTIPLIER = 1.2;
const CHANNEL_ITEM_WIDTH = 78;
const CHANNEL_STRIP_HEIGHT = 64;
const TIME_GUTTER_WIDTH = 62;
const NOW_TOP_INSET = 132;
const HEADER_CONDENSE_THRESHOLD = 24;
const HOUR_MS = 60 * 60 * 1000;

type PerChannelGuideViewProps = {
  guideDataVersion: number;
  headerAction?: ReactNode;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

type SchedulePageProps = {
  channel: Channel;
  fixture: GuideFixture;
  dayStartMs: number;
  dayEndMs: number;
  nowMs: number;
  width: number;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

function formatTime(timeMs: number) {
  return new Date(timeMs).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: GUIDE_TIME_ZONE,
  });
}

function hourTicks(dayStartMs: number, dayEndMs: number) {
  const ticks: number[] = [];
  for (let tick = dayStartMs; tick <= dayEndMs; tick += HOUR_MS) ticks.push(tick);
  return ticks;
}

function clampTime(timeMs: number, fromMs: number, toMs: number) {
  return Math.min(toMs - 1, Math.max(fromMs, timeMs));
}

const SchedulePage = memo(function SchedulePage({
  channel,
  fixture,
  dayStartMs,
  dayEndMs,
  nowMs,
  width,
  onSelectProgramme,
}: SchedulePageProps) {
  const theme = useTeeveeTheme();
  const programmes = useMemo(
    () => programmesForChannelDay(fixture, channel.id, dayStartMs, dayEndMs),
    [channel.id, dayEndMs, dayStartMs, fixture],
  );
  const ticks = useMemo(() => hourTicks(dayStartMs, dayEndMs), [dayEndMs, dayStartMs]);
  const height = ((dayEndMs - dayStartMs) / 60_000) * PER_CHANNEL_MINUTE_HEIGHT;
  const nowInDay = nowMs >= dayStartMs && nowMs < dayEndMs;

  return (
    <View style={{ width, height }}>
      {ticks.map((tick) => (
        <View
          key={tick}
          pointerEvents="none"
          accessible={false}
          style={[
            styles.hourTick,
            {
              top: scheduleYForTime(tick, dayStartMs),
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.hourLabel, { color: theme.colors.textMuted }]}>{formatTime(tick)}</Text>
        </View>
      ))}

      {programmes.map((programme) => {
        const frame = programmeVerticalFrame(programme, dayStartMs, dayEndMs);
        const startMs = Date.parse(programme.startAt);
        const endMs = Date.parse(programme.endAt);
        const current = isProgrammeCurrent(programme, nowMs);
        const compact = frame.height < 58;
        const veryCompact = frame.height < 42;
        const timeText = current ? `Nu bezig · tot ${formatTime(endMs)}` : formatTime(startMs);

        return (
          <Pressable
            key={programme.id}
            testID={`per-channel-programme-${programme.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${channel.displayName}, ${programme.title}, ${formatTime(startMs)} tot ${formatTime(endMs)}${current ? ', nu bezig' : ''}`}
            accessibilityHint="Opent programmadetails"
            onPress={() => onSelectProgramme({ programme, channelName: channel.displayName })}
            style={({ pressed }) => [
              styles.programme,
              {
                top: frame.top,
                height: frame.height,
                left: TIME_GUTTER_WIDTH,
                right: 14,
                borderBottomColor: theme.colors.border,
                borderLeftColor: current ? theme.colors.currentTime : 'transparent',
                backgroundColor: current ? theme.colors.surfaceElevated : 'transparent',
                opacity: pressed ? 0.58 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                veryCompact ? styles.programmeTitleTiny : styles.programmeTitle,
                compact && !veryCompact ? styles.programmeTitleCompact : null,
                { color: theme.colors.text },
              ]}
            >
              {programme.title}
            </Text>
            {!compact ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.programmeTime,
                  { color: current ? theme.colors.currentTime : theme.colors.textMuted },
                ]}
              >
                {timeText}
              </Text>
            ) : null}
          </Pressable>
        );
      })}

      {nowInDay ? (
        <View
          pointerEvents="none"
          style={[
            styles.nowMarker,
            {
              top: scheduleYForTime(nowMs, dayStartMs),
              left: TIME_GUTTER_WIDTH - 5,
              right: 14,
              backgroundColor: theme.colors.currentTime,
            },
          ]}
        >
          <View style={[styles.nowDot, { backgroundColor: theme.colors.currentTime }]} />
        </View>
      ) : null}
    </View>
  );
});

function channelsForPager(channels: Channel[], selectedIndex: number): Channel[] {
  if (channels.length === 0) return [];
  const safeSelectedIndex = Math.min(channels.length - 1, Math.max(0, selectedIndex));
  const previous = channels[adjacentChannelIndex(safeSelectedIndex, -1, channels.length)]!;
  const current = channels[safeSelectedIndex]!;
  const next = channels[adjacentChannelIndex(safeSelectedIndex, 1, channels.length)]!;
  return [previous, current, next];
}

export const PerChannelGuideView = memo(function PerChannelGuideView({
  guideDataVersion,
  onSelectProgramme,
  headerAction,
}: PerChannelGuideViewProps) {
  const theme = useTeeveeTheme();
  const { width: windowWidth } = useWindowDimensions();
  const channelStripRef = useRef<ScrollView>(null);
  const pagerRef = useRef<ScrollView>(null);
  const scheduleRef = useRef<ScrollView>(null);
  const nowMs = useGuideClock();
  const { selectedDayStartMs, selectDay } = useGuideDaySelection(nowMs);
  const selectedDay = useSelectedGuideDaySchedule(selectedDayStartMs, guideDataVersion);
  const fixture = useMemo(
    () => selectedDay.schedule ?? buildRuntimeGuideFixture(selectedDayStartMs),
    [guideDataVersion, selectedDay.schedule, selectedDayStartMs],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [condensed, setCondensed] = useState(false);
  const viewedTimeRef = useRef(Date.now());
  const pendingTargetTimeRef = useRef<number | null>(null);
  const userHasScrolledRef = useRef(false);
  const channels = fixture.channels;
  const safeSelectedIndex = Math.min(Math.max(0, selectedIndex), Math.max(0, channels.length - 1));
  const selectedChannel = channels[safeSelectedIndex] ?? channels[0];
  const dayStartMs = selectedDayStartMs;
  const dayEndMs = useMemo(
    () => guideTelevisionDayStart(selectedDayStartMs, 1),
    [selectedDayStartMs],
  );
  const scheduleHeight = ((dayEndMs - dayStartMs) / 60_000) * PER_CHANNEL_MINUTE_HEIGHT;
  const pagerChannels = useMemo(
    () => channelsForPager(channels, safeSelectedIndex),
    [channels, safeSelectedIndex],
  );

  useEffect(() => {
    if (selectedIndex !== safeSelectedIndex) setSelectedIndex(safeSelectedIndex);
  }, [safeSelectedIndex, selectedIndex]);

  const centrePager = useCallback(
    (animated = false) => {
      pagerRef.current?.scrollTo({ x: windowWidth, animated });
    },
    [windowWidth],
  );

  const centreSelectedChannel = useCallback(
    (index: number, animated = true) => {
      const target = index * CHANNEL_ITEM_WIDTH - windowWidth / 2 + CHANNEL_ITEM_WIDTH / 2;
      const max = Math.max(0, channels.length * CHANNEL_ITEM_WIDTH - windowWidth);
      channelStripRef.current?.scrollTo({ x: Math.min(max, Math.max(0, target)), animated });
    },
    [channels.length, windowWidth],
  );

  const selectChannel = useCallback(
    (index: number) => {
      if (!channels[index] || index === safeSelectedIndex) return;
      setSelectedIndex(index);
      centreSelectedChannel(index);
    },
    [centreSelectedChannel, channels, safeSelectedIndex],
  );

  const handlePagerEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (windowWidth <= 0) return;
      const page = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
      if (page === 1) return;
      const delta: -1 | 1 = page < 1 ? -1 : 1;
      const nextIndex = adjacentChannelIndex(safeSelectedIndex, delta, channels.length);
      if (nextIndex !== safeSelectedIndex) {
        setSelectedIndex(nextIndex);
        centreSelectedChannel(nextIndex);
      }
      requestAnimationFrame(() => centrePager(false));
    },
    [centrePager, centreSelectedChannel, channels.length, safeSelectedIndex, windowWidth],
  );

  const scrollToTime = useCallback(
    (timeMs: number, animated: boolean) => {
      const target = clampTime(timeMs, dayStartMs, dayEndMs);
      viewedTimeRef.current = target;
      const y = Math.max(0, scheduleYForTime(target, dayStartMs) - NOW_TOP_INSET);
      scheduleRef.current?.scrollTo({ y, animated });
    },
    [dayEndMs, dayStartMs],
  );

  const handleScheduleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = Math.max(0, event.nativeEvent.contentOffset.y);
      const nextViewedTime = dayStartMs + ((y + NOW_TOP_INSET) / PER_CHANNEL_MINUTE_HEIGHT) * 60_000;
      viewedTimeRef.current = clampTime(nextViewedTime, dayStartMs, dayEndMs);
      if (!userHasScrolledRef.current) return;
      const nextCondensed = y > HEADER_CONDENSE_THRESHOLD;
      setCondensed((current) => (current === nextCondensed ? current : nextCondensed));
    },
    [dayEndMs, dayStartMs],
  );

  const changeDay = useCallback(
    (nextDayStartMs: number) => {
      if (nextDayStartMs === selectedDayStartMs) return;
      const target = guideTargetForDaySelection(viewedTimeRef.current, nextDayStartMs);
      pendingTargetTimeRef.current = target.timeMs;
      selectDay(target.dayStartMs);
    },
    [selectDay, selectedDayStartMs],
  );

  const scrollToNow = useCallback(
    (animated = true) => {
      const target = guideTargetForNow(Date.now());
      if (target.dayStartMs === selectedDayStartMs) {
        scrollToTime(target.timeMs, animated);
        return;
      }
      pendingTargetTimeRef.current = target.timeMs;
      selectDay(target.dayStartMs);
    },
    [scrollToTime, selectDay, selectedDayStartMs],
  );

  const scrollToPrimetime = useCallback(() => {
    const target = guideTargetForPrimetime(selectedDayStartMs);
    scrollToTime(target.timeMs, true);
  }, [scrollToTime, selectedDayStartMs]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => centrePager(false));
    return () => cancelAnimationFrame(frame);
  }, [centrePager, selectedDayStartMs, safeSelectedIndex]);

  useEffect(() => {
    centreSelectedChannel(safeSelectedIndex, false);
  }, [centreSelectedChannel, safeSelectedIndex]);

  useEffect(() => {
    const target = pendingTargetTimeRef.current ??
      guideTargetForDaySelection(viewedTimeRef.current, selectedDayStartMs).timeMs;
    pendingTargetTimeRef.current = null;
    const frame = requestAnimationFrame(() => scrollToTime(target, false));
    return () => cancelAnimationFrame(frame);
  }, [scrollToTime, selectedDayStartMs]);

  if (!selectedChannel) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <GuideChrome
        condensed={condensed}
        presentationNavigation={headerAction}
        heading="Gids"
      />

      <ScrollView
        ref={channelStripRef}
        horizontal
        bounces
        directionalLockEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={[
          styles.channelStrip,
          { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border },
        ]}
        contentContainerStyle={styles.channelStripContent}
      >
        {channels.map((channel, index) => {
          const active = index === safeSelectedIndex;
          return (
            <Pressable
              key={channel.id}
              accessibilityRole="button"
              accessibilityLabel={channel.displayName}
              accessibilityState={{ selected: active }}
              onPress={() => selectChannel(index)}
              style={({ pressed }) => [
                styles.channelButton,
                {
                  width: CHANNEL_ITEM_WIDTH,
                  borderColor: active ? theme.colors.border : 'transparent',
                  backgroundColor: active ? theme.colors.surfaceElevated : 'transparent',
                  opacity: pressed ? 0.6 : active ? 1 : 0.68,
                },
              ]}
            >
              <ChannelIdentity
                channel={channel}
                textColor={theme.colors.text}
                mutedTextColor={theme.colors.textMuted}
                variant="logo-first"
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {!condensed ? (
        <View style={styles.channelContext}>
          <Text
            maxFontSizeMultiplier={1.25}
            style={[styles.channelName, { color: theme.colors.text }]}
          >
            {selectedChannel.displayName}
          </Text>
        </View>
      ) : null}

      <View
        testID={condensed ? 'per-channel-context-condensed' : 'per-channel-context-expanded'}
        style={[
          styles.contextRow,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <GuideDaySelector
          selectedDayStartMs={selectedDayStartMs}
          nowMs={nowMs}
          loading={selectedDay.loading}
          unavailable={selectedDay.unavailable}
          compactPrefix={condensed ? selectedChannel.displayName : undefined}
          onSelectDay={changeDay}
        />
        <View style={styles.utilityActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ga naar primetime om 20:30 op de geselecteerde dag"
            onPress={scrollToPrimetime}
            style={[styles.utilityButton, { borderColor: theme.colors.border }]}
          >
            <Text
              accessible={false}
              maxFontSizeMultiplier={1}
              style={[styles.utilityIcon, { color: theme.colors.textSecondary }]}
            >
              ☾
            </Text>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.utilityButtonText, { color: theme.colors.textSecondary }]}
            >
              Primetime
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ga naar nu"
            onPress={() => scrollToNow(true)}
            style={[styles.utilityButton, styles.nowButton, { borderColor: theme.colors.border }]}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.utilityButtonText, { color: theme.colors.text }]}
            >
              Nu
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scheduleRef}
        testID="per-channel-schedule-scroll"
        bounces
        alwaysBounceVertical
        directionalLockEnabled
        nestedScrollEnabled
        decelerationRate="normal"
        showsVerticalScrollIndicator
        scrollEventThrottle={32}
        onScrollBeginDrag={() => {
          userHasScrolledRef.current = true;
        }}
        onScroll={handleScheduleScroll}
        contentContainerStyle={{ height: scheduleHeight }}
      >
        <ScrollView
          ref={pagerRef}
          testID="per-channel-pager"
          horizontal
          pagingEnabled
          bounces
          directionalLockEnabled
          nestedScrollEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handlePagerEnd}
          style={{ width: windowWidth, height: scheduleHeight }}
          contentOffset={{ x: windowWidth, y: 0 }}
        >
          {pagerChannels.map((channel, pageIndex) => (
            <SchedulePage
              key={`${pageIndex}-${channel.id}-${selectedDayStartMs}`}
              channel={channel}
              fixture={fixture}
              dayStartMs={dayStartMs}
              dayEndMs={dayEndMs}
              nowMs={nowMs}
              width={windowWidth}
              onSelectProgramme={onSelectProgramme}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  channelStrip: {
    flexGrow: 0,
    height: CHANNEL_STRIP_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelStripContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  channelButton: {
    height: 54,
    marginHorizontal: 2,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 3,
  },
  channelContext: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 1,
  },
  channelName: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  contextRow: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 10,
    rowGap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  utilityActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  utilityButton: {
    minHeight: 44,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  nowButton: {
    minWidth: 48,
  },
  utilityIcon: {
    fontSize: 15,
    lineHeight: 16,
  },
  utilityButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  hourTick: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hourLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    width: 42,
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  programme: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  programmeTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  programmeTitleCompact: {
    fontSize: 14,
    lineHeight: 17,
  },
  programmeTitleTiny: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
  },
  programmeTime: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  nowMarker: {
    position: 'absolute',
    height: 1,
  },
  nowDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    left: -3,
    top: -3,
  },
});
