import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { guideDayStart, GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import {
  buildRuntimeGuideFixture,
  runtimeGuideFixtureNeedsRefresh,
} from '@/data/fixtures/runtimeGuideFixture';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { ChannelIdentity } from './ChannelIdentity';
import type { ProgrammeSelection } from './detailState';
import {
  adjacentChannelIndex,
  PER_CHANNEL_MINUTE_HEIGHT,
  programmeVerticalFrame,
  programmesForChannelDay,
  scheduleYForTime,
  type PerChannelDayOffset,
} from './perChannel';
import { useGuideClock } from './useGuideClock';

const CONTROL_MAX_FONT_SIZE_MULTIPLIER = 1.2;
const CHANNEL_ITEM_WIDTH = 84;
const CHANNEL_STRIP_HEIGHT = 62;
const TIME_GUTTER_WIDTH = 62;
const NOW_TOP_INSET = 132;
const HOUR_MS = 60 * 60 * 1000;

type PerChannelGuideViewProps = {
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

function formatDay(timeMs: number) {
  return new Date(timeMs).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: GUIDE_TIME_ZONE,
  });
}

function hourTicks(dayStartMs: number, dayEndMs: number) {
  const ticks: number[] = [];
  for (let tick = dayStartMs; tick <= dayEndMs; tick += HOUR_MS) ticks.push(tick);
  return ticks;
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
  const previous = channels[adjacentChannelIndex(selectedIndex, -1, channels.length)]!;
  const current = channels[selectedIndex]!;
  const next = channels[adjacentChannelIndex(selectedIndex, 1, channels.length)]!;
  return [previous, current, next];
}

export const PerChannelGuideView = memo(function PerChannelGuideView({
  onSelectProgramme,
}: PerChannelGuideViewProps) {
  const theme = useTeeveeTheme();
  const { width: windowWidth } = useWindowDimensions();
  const channelStripRef = useRef<ScrollView>(null);
  const pagerRef = useRef<ScrollView>(null);
  const scheduleRef = useRef<ScrollView>(null);
  const [fixtureAnchorMs, setFixtureAnchorMs] = useState(() => Date.now());
  const fixture = useMemo(() => buildRuntimeGuideFixture(fixtureAnchorMs), [fixtureAnchorMs]);
  const nowMs = useGuideClock();
  const [dayOffset, setDayOffset] = useState<PerChannelDayOffset>(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const channels = fixture.channels;
  const selectedChannel = channels[selectedIndex] ?? channels[0];
  const dayStartMs = guideDayStart(fixtureAnchorMs, dayOffset);
  const dayEndMs = guideDayStart(fixtureAnchorMs, dayOffset + 1);
  const scheduleHeight = ((dayEndMs - dayStartMs) / 60_000) * PER_CHANNEL_MINUTE_HEIGHT;
  const pagerChannels = useMemo(
    () => channelsForPager(channels, selectedIndex),
    [channels, selectedIndex],
  );

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
      if (!channels[index] || index === selectedIndex) return;
      setSelectedIndex(index);
      centreSelectedChannel(index);
    },
    [centreSelectedChannel, channels, selectedIndex],
  );

  const handlePagerEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (windowWidth <= 0) return;
      const page = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
      if (page === 1) return;
      const delta: -1 | 1 = page < 1 ? -1 : 1;
      const nextIndex = adjacentChannelIndex(selectedIndex, delta, channels.length);
      if (nextIndex !== selectedIndex) {
        setSelectedIndex(nextIndex);
        centreSelectedChannel(nextIndex);
      }
      requestAnimationFrame(() => centrePager(false));
    },
    [centrePager, centreSelectedChannel, channels.length, selectedIndex, windowWidth],
  );

  const scrollToNow = useCallback(
    (animated = true) => {
      const currentNow = Date.now();
      if (runtimeGuideFixtureNeedsRefresh(fixture, currentNow)) {
        setDayOffset(0);
        setFixtureAnchorMs(currentNow);
        return;
      }
      setDayOffset(0);
      const todayStart = guideDayStart(fixtureAnchorMs, 0);
      const y = Math.max(0, scheduleYForTime(currentNow, todayStart) - NOW_TOP_INSET);
      scheduleRef.current?.scrollTo({ y, animated });
    },
    [fixture, fixtureAnchorMs],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => centrePager(false));
    return () => cancelAnimationFrame(frame);
  }, [centrePager, dayOffset, selectedIndex]);

  useEffect(() => {
    centreSelectedChannel(selectedIndex, false);
  }, [centreSelectedChannel, selectedIndex]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => scrollToNow(false));
    return () => cancelAnimationFrame(frame);
  }, [fixtureAnchorMs, scrollToNow]);

  useEffect(() => {
    if (!runtimeGuideFixtureNeedsRefresh(fixture, nowMs)) return;
    setDayOffset(0);
    setFixtureAnchorMs(nowMs);
  }, [fixture, nowMs]);

  if (!selectedChannel) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text accessible={false} style={[styles.eyebrow, { color: theme.colors.textMuted }]}>TEEVEE</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Gids</Text>
        </View>
        <View style={styles.presentationLabel}>
          <View style={[styles.presentationDot, { backgroundColor: theme.colors.currentTime }]} />
          <Text style={[styles.presentationText, { color: theme.colors.textSecondary }]}>Per zender</Text>
        </View>
      </View>

      <ScrollView
        ref={channelStripRef}
        horizontal
        bounces
        directionalLockEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={[styles.channelStrip, { borderBottomColor: theme.colors.border }]}
        contentContainerStyle={styles.channelStripContent}
      >
        {channels.map((channel, index) => {
          const active = index === selectedIndex;
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
                  opacity: pressed ? 0.6 : active ? 1 : 0.62,
                },
              ]}
            >
              <ChannelIdentity
                channel={channel}
                textColor={theme.colors.text}
                mutedTextColor={theme.colors.textMuted}
              />
              {active ? <View style={[styles.channelActive, { backgroundColor: theme.colors.currentTime }]} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.contextRow}>
        <View style={styles.dayControls}>
          {([0, 1] as const).map((offset) => {
            const active = dayOffset === offset;
            return (
              <Pressable
                key={offset}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setDayOffset(offset)}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: active ? theme.colors.accent : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
                  style={[
                    styles.dayButtonText,
                    { color: active ? theme.colors.background : theme.colors.textSecondary },
                  ]}
                >
                  {offset === 0 ? 'Vandaag' : 'Morgen'}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ga naar nu"
            onPress={() => scrollToNow(true)}
            style={[styles.nowButton, { borderColor: theme.colors.border }]}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.nowButtonText, { color: theme.colors.text }]}
            >
              Nu
            </Text>
          </Pressable>
        </View>
        <Text numberOfLines={1} style={[styles.dateLabel, { color: theme.colors.textMuted }]}>
          {formatDay(dayStartMs)}
        </Text>
      </View>

      <View style={styles.channelContext}>
        <Text numberOfLines={1} style={[styles.channelName, { color: theme.colors.text }]}>
          {selectedChannel.displayName}
        </Text>
        <Text style={[styles.swipeHint, { color: theme.colors.textMuted }]}>
          Veeg horizontaal voor een andere zender
        </Text>
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
              key={`${pageIndex}-${channel.id}-${dayOffset}`}
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
  header: {
    minHeight: 78,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    marginTop: 2,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  presentationLabel: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingBottom: 3,
  },
  presentationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presentationText: {
    fontSize: 13,
    fontWeight: '700',
  },
  channelStrip: {
    flexGrow: 0,
    height: CHANNEL_STRIP_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelStripContent: {
    paddingHorizontal: 8,
  },
  channelButton: {
    height: CHANNEL_STRIP_HEIGHT,
    position: 'relative',
    paddingHorizontal: 3,
  },
  channelActive: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  contextRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 7,
    gap: 7,
  },
  dayControls: {
    flexDirection: 'row',
    gap: 7,
  },
  dayButton: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nowButton: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  channelContext: {
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 15,
    gap: 3,
  },
  channelName: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  swipeHint: {
    fontSize: 11,
    fontWeight: '500',
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
