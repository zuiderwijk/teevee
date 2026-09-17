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

import type { Channel, GuideFixture, Programme } from '@/data/domain/epg';
import { guideTelevisionDayStart, GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture } from '@/data/fixtures/runtimeGuideFixture';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { ChannelIdentity } from './ChannelIdentity';
import type { ProgrammeSelection } from './detailState';
import { GuideChrome } from './GuideChrome';
import { guideTargetForPrimetime } from './guideDaySelection';
import {
  clampReferenceTime,
  nearestSlotIndex,
  programmesAroundReference,
  timeSlotsForDay,
} from './nowNext';
import { useGuideClock } from './useGuideClock';

const CONTROL_MAX_FONT_SIZE_MULTIPLIER = 1.2;
const TIME_SLOT_WIDTH = 76;
const CHANNEL_WIDTH = 82;
const SLOT_MS = 30 * 60 * 1000;
const HEADER_CONDENSE_THRESHOLD = 24;

type NowNextGuideViewProps = {
  headerAction?: ReactNode;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

type ChannelRowProps = {
  channel: Channel;
  fixture: GuideFixture;
  referenceMs: number;
  live: boolean;
  nowMs: number;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

function formatTime(timeMs: number) {
  return new Date(timeMs).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: GUIDE_TIME_ZONE,
  });
}

function formatEndTime(programme: Programme) {
  return formatTime(Date.parse(programme.endAt));
}

function formatStartTime(programme: Programme) {
  return formatTime(Date.parse(programme.startAt));
}

const ChannelRow = memo(function ChannelRow({
  channel,
  fixture,
  referenceMs,
  live,
  nowMs,
  onSelectProgramme,
}: ChannelRowProps) {
  const theme = useTeeveeTheme();
  const { referenceProgramme, followingProgrammes } = useMemo(
    () => programmesAroundReference(fixture, channel.id, referenceMs),
    [channel.id, fixture, referenceMs],
  );

  const openProgramme = useCallback(
    (programme: Programme) => onSelectProgramme({ programme, channelName: channel.displayName }),
    [channel.displayName, onSelectProgramme],
  );

  const isActuallyLive =
    live &&
    referenceProgramme !== null &&
    Date.parse(referenceProgramme.startAt) <= nowMs &&
    nowMs < Date.parse(referenceProgramme.endAt);

  return (
    <View style={[styles.channelRow, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.channelIdentity}>
        <ChannelIdentity
          channel={channel}
          textColor={theme.colors.text}
          mutedTextColor={theme.colors.textMuted}
        />
      </View>

      <View style={styles.programmesColumn}>
        {referenceProgramme ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${channel.displayName}, ${referenceProgramme.title}, tot ${formatEndTime(referenceProgramme)}${isActuallyLive ? ', nu bezig' : ''}`}
            accessibilityHint="Opent programmadetails"
            onPress={() => openProgramme(referenceProgramme)}
            style={({ pressed }) => [styles.referenceProgramme, { opacity: pressed ? 0.58 : 1 }]}
          >
            <Text numberOfLines={2} style={[styles.referenceTitle, { color: theme.colors.text }]}>
              {referenceProgramme.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.referenceMeta,
                { color: isActuallyLive ? theme.colors.currentTime : theme.colors.textSecondary },
              ]}
            >
              {isActuallyLive ? `Nu · tot ${formatEndTime(referenceProgramme)}` : `tot ${formatEndTime(referenceProgramme)}`}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.referenceProgramme}>
            <Text style={[styles.gapTitle, { color: theme.colors.textSecondary }]}>Geen programma</Text>
            <Text style={[styles.referenceMeta, { color: theme.colors.textMuted }]}>op dit tijdstip</Text>
          </View>
        )}

        <View style={styles.followingList}>
          {followingProgrammes.map((programme) => (
            <Pressable
              key={programme.id}
              accessibilityRole="button"
              accessibilityLabel={`${channel.displayName}, ${programme.title}, ${formatStartTime(programme)}`}
              accessibilityHint="Opent programmadetails"
              onPress={() => openProgramme(programme)}
              style={({ pressed }) => [styles.followingRow, { opacity: pressed ? 0.58 : 1 }]}
            >
              <Text style={[styles.followingTime, { color: theme.colors.textMuted }]}>
                {formatStartTime(programme)}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.followingTitle, { color: theme.colors.textSecondary }]}
              >
                {programme.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
});

export const NowNextGuideView = memo(function NowNextGuideView({
  onSelectProgramme,
  headerAction,
}: NowNextGuideViewProps) {
  const theme = useTeeveeTheme();
  const { width: windowWidth } = useWindowDimensions();
  const timeRailRef = useRef<ScrollView>(null);
  const nowMs = useGuideClock();
  const currentTelevisionDayStartMs = guideTelevisionDayStart(nowMs);
  const [fixtureDayStartMs, setFixtureDayStartMs] = useState(() =>
    guideTelevisionDayStart(Date.now()),
  );
  const fixture = useMemo(
    () => buildRuntimeGuideFixture(fixtureDayStartMs),
    [fixtureDayStartMs],
  );
  const dayStartMs = fixtureDayStartMs;
  const dayEndMs = useMemo(() => guideTelevisionDayStart(dayStartMs, 1), [dayStartMs]);
  const slots = useMemo(() => timeSlotsForDay(dayStartMs, dayEndMs), [dayEndMs, dayStartMs]);
  const [live, setLive] = useState(true);
  const [pinnedReferenceMs, setPinnedReferenceMs] = useState(() => Date.now());
  const [condensed, setCondensed] = useState(false);
  const referenceMs = live
    ? clampReferenceTime(nowMs, dayStartMs, dayEndMs)
    : clampReferenceTime(pinnedReferenceMs, dayStartMs, dayEndMs);
  const selectedSlotIndex = nearestSlotIndex(slots, referenceMs);
  const railInset = Math.max(0, windowWidth / 2 - TIME_SLOT_WIDTH / 2);

  const centreTime = useCallback(
    (index: number, animated = true) => {
      timeRailRef.current?.scrollTo({ x: Math.max(0, index * TIME_SLOT_WIDTH), animated });
    },
    [],
  );

  const centreReferenceTime = useCallback(
    (timeMs: number, animated = true) => {
      const slotPosition = (clampReferenceTime(timeMs, dayStartMs, dayEndMs) - dayStartMs) / SLOT_MS;
      timeRailRef.current?.scrollTo({ x: Math.max(0, slotPosition * TIME_SLOT_WIDTH), animated });
    },
    [dayEndMs, dayStartMs],
  );

  const setReferenceSlot = useCallback(
    (index: number) => {
      const slot = slots[index];
      if (slot === undefined) return;
      setPinnedReferenceMs(slot);
      setLive(false);
    },
    [slots],
  );

  const chooseSlot = useCallback(
    (index: number, animated = true) => {
      setReferenceSlot(index);
      centreTime(index, animated);
    },
    [centreTime, setReferenceSlot],
  );

  const commitRailOffset = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (slots.length === 0) return;
      const index = Math.max(
        0,
        Math.min(slots.length - 1, Math.round(event.nativeEvent.contentOffset.x / TIME_SLOT_WIDTH)),
      );
      setReferenceSlot(index);
    },
    [setReferenceSlot, slots.length],
  );

  const commitDragWithoutMomentum = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityX = event.nativeEvent.velocity?.x ?? 0;
      if (Math.abs(velocityX) < 0.01) {
        commitRailOffset(event);
      }
    },
    [commitRailOffset],
  );

  const browseFromLive = useCallback(() => {
    if (!live) return;
    setPinnedReferenceMs(referenceMs);
    setLive(false);
  }, [live, referenceMs]);

  const goNow = useCallback(() => {
    const currentNow = Date.now();
    const currentDayStart = guideTelevisionDayStart(currentNow);
    if (currentDayStart !== fixtureDayStartMs) {
      setFixtureDayStartMs(currentDayStart);
      setPinnedReferenceMs(currentNow);
      setLive(true);
      return;
    }
    setPinnedReferenceMs(currentNow);
    setLive(true);
    requestAnimationFrame(() => centreReferenceTime(currentNow, true));
  }, [centreReferenceTime, fixtureDayStartMs]);

  const goPrimetime = useCallback(() => {
    const target = guideTargetForPrimetime(dayStartMs);
    chooseSlot(nearestSlotIndex(slots, target.timeMs));
  }, [chooseSlot, dayStartMs, slots]);

  useEffect(() => {
    if (currentTelevisionDayStartMs === fixtureDayStartMs) return;
    setFixtureDayStartMs(currentTelevisionDayStartMs);
    setPinnedReferenceMs(nowMs);
    setLive(true);
  }, [currentTelevisionDayStartMs, fixtureDayStartMs, nowMs]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (live) centreReferenceTime(referenceMs, false);
      else centreTime(selectedSlotIndex, false);
    });
    return () => cancelAnimationFrame(frame);
  }, [centreReferenceTime, centreTime, live, referenceMs, selectedSlotIndex, slots]);

  const handleChannelScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextCondensed = event.nativeEvent.contentOffset.y > HEADER_CONDENSE_THRESHOLD;
    setCondensed((current) => (current === nextCondensed ? current : nextCondensed));
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <GuideChrome
        condensed={condensed}
        presentationNavigation={headerAction}
      />

      <View
        style={[
          styles.timeRailShell,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <ScrollView
          ref={timeRailRef}
          horizontal
          bounces
          directionalLockEnabled
          decelerationRate="fast"
          snapToInterval={TIME_SLOT_WIDTH}
          snapToAlignment="start"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: railInset }}
          onScrollBeginDrag={browseFromLive}
          onScrollEndDrag={commitDragWithoutMomentum}
          onMomentumScrollEnd={commitRailOffset}
        >
          {slots.map((slot, index) => {
            const selected = index === selectedSlotIndex;
            return (
              <Pressable
                key={slot}
                accessibilityRole="button"
                accessibilityLabel={`Tijd ${formatTime(slot)}`}
                accessibilityState={{ selected }}
                onPress={() => chooseSlot(index)}
                style={styles.timeSlot}
              >
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
                  style={[
                    styles.timeSlotText,
                    {
                      color: theme.colors.textMuted,
                      opacity: selected ? 0 : 1,
                    },
                  ]}
                >
                  {formatTime(slot)}
                </Text>
                <View style={[styles.timeSlotTick, { backgroundColor: theme.colors.border }]} />
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          testID="now-next-reference-badge"
          pointerEvents="none"
          style={styles.referenceMarker}
        >
          <View style={[styles.referenceBadge, { backgroundColor: theme.colors.currentTime }]}> 
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
              style={[
                styles.referenceBadgeText,
                { color: theme.dark ? theme.colors.text : theme.colors.surface },
              ]}
            >
              {formatTime(referenceMs)}
            </Text>
          </View>
          <View style={[styles.referenceTick, { backgroundColor: theme.colors.currentTime }]} />
        </View>
      </View>

      <View
        style={[
          styles.shortcutRow,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {live ? (
          <Pressable
            testID="now-next-primetime-action"
            accessibilityRole="button"
            accessibilityLabel="Ga naar primetime om 20:30"
            onPress={goPrimetime}
            style={[styles.shortcutButton, { borderColor: theme.colors.border }]}
          >
            <Text
              accessible={false}
              maxFontSizeMultiplier={1}
              style={[styles.shortcutIcon, { color: theme.colors.textSecondary }]}
            >
              ☾
            </Text>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.shortcutText, { color: theme.colors.textSecondary }]}
            >
              Primetime
            </Text>
          </Pressable>
        ) : (
          <Pressable
            testID="now-next-now-action"
            accessibilityRole="button"
            accessibilityLabel="Ga naar nu"
            onPress={goNow}
            style={[styles.shortcutButton, { borderColor: theme.colors.border }]}
          >
            <Text
              accessible={false}
              maxFontSizeMultiplier={1}
              style={[styles.shortcutIcon, { color: theme.colors.textSecondary }]}
            >
              ◷
            </Text>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.shortcutText, { color: theme.colors.textSecondary }]}
            >
              Nu
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        testID="now-next-channel-scroll"
        bounces
        alwaysBounceVertical
        directionalLockEnabled
        showsVerticalScrollIndicator
        scrollEventThrottle={32}
        onScroll={handleChannelScroll}
        contentContainerStyle={styles.channelList}
      >
        {fixture.channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            fixture={fixture}
            referenceMs={referenceMs}
            live={live}
            nowMs={nowMs}
            onSelectProgramme={onSelectProgramme}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  timeRailShell: {
    height: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timeSlot: {
    position: 'relative',
    width: TIME_SLOT_WIDTH,
    height: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 9,
  },
  timeSlotText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timeSlotTick: {
    position: 'absolute',
    bottom: 1,
    width: StyleSheet.hairlineWidth,
    height: 11,
  },
  referenceMarker: {
    position: 'absolute',
    left: '50%',
    top: 5,
    width: 56,
    marginLeft: -28,
    alignItems: 'center',
    zIndex: 4,
  },
  referenceBadge: {
    minWidth: 50,
    minHeight: 25,
    paddingHorizontal: 8,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  referenceTick: {
    width: 2,
    height: 9,
    borderRadius: 1,
  },
  shortcutRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 3,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  shortcutButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shortcutIcon: {
    fontSize: 15,
    lineHeight: 17,
  },
  shortcutText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  channelList: {
    paddingBottom: 110,
  },
  channelRow: {
    minHeight: 150,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelIdentity: {
    width: CHANNEL_WIDTH,
    paddingRight: 8,
    alignSelf: 'stretch',
  },
  programmesColumn: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 6,
  },
  referenceProgramme: {
    minHeight: 52,
    justifyContent: 'center',
    paddingRight: 6,
  },
  referenceTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  gapTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  referenceMeta: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  followingList: {
    marginTop: 9,
    gap: 3,
  },
  followingRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  followingTime: {
    width: 48,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  followingTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
});
