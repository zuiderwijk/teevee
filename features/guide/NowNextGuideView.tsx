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

import type { Channel, GuideFixture, Programme } from '@/data/domain/epg';
import { guideDayStart, GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import {
  buildRuntimeGuideFixture,
  runtimeGuideFixtureNeedsRefresh,
} from '@/data/fixtures/runtimeGuideFixture';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { ChannelIdentity } from './ChannelIdentity';
import type { ProgrammeSelection } from './detailState';
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
const PRIMETIME_LABEL = '20:30';

type NowNextGuideViewProps = {
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
}: NowNextGuideViewProps) {
  const theme = useTeeveeTheme();
  const { width: windowWidth } = useWindowDimensions();
  const timeRailRef = useRef<ScrollView>(null);
  const [fixtureAnchorMs, setFixtureAnchorMs] = useState(() => Date.now());
  const fixture = useMemo(() => buildRuntimeGuideFixture(fixtureAnchorMs), [fixtureAnchorMs]);
  const nowMs = useGuideClock();
  const dayStartMs = guideDayStart(fixtureAnchorMs, 0);
  const dayEndMs = guideDayStart(fixtureAnchorMs, 1);
  const slots = useMemo(() => timeSlotsForDay(dayStartMs, dayEndMs), [dayEndMs, dayStartMs]);
  const [live, setLive] = useState(true);
  const [pinnedReferenceMs, setPinnedReferenceMs] = useState(() => Date.now());
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
      // The native rail has already snapped here. Update semantic state only;
      // never issue another scrollTo from a rail-originated commit.
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
    if (runtimeGuideFixtureNeedsRefresh(fixture, currentNow)) {
      setFixtureAnchorMs(currentNow);
      setPinnedReferenceMs(currentNow);
      setLive(true);
      return;
    }
    setPinnedReferenceMs(currentNow);
    setLive(true);
    const index = nearestSlotIndex(slots, currentNow);
    requestAnimationFrame(() => centreTime(index, true));
  }, [centreTime, fixture, slots]);

  const goPrimetime = useCallback(() => {
    const primetimeIndex = slots.findIndex((slot) => formatTime(slot) === PRIMETIME_LABEL);
    const index = primetimeIndex >= 0
      ? primetimeIndex
      : nearestSlotIndex(slots, dayStartMs + 20.5 * 60 * 60 * 1000);
    chooseSlot(index);
  }, [chooseSlot, dayStartMs, slots]);

  // Centre once when the day/slot set changes. Normal rail interaction must remain
  // fully native until momentum and snap have settled.
  useEffect(() => {
    const index = nearestSlotIndex(slots, Date.now());
    const frame = requestAnimationFrame(() => centreTime(index, false));
    return () => cancelAnimationFrame(frame);
  }, [centreTime, slots]);

  useEffect(() => {
    if (!runtimeGuideFixtureNeedsRefresh(fixture, nowMs)) return;
    setFixtureAnchorMs(nowMs);
    setPinnedReferenceMs(nowMs);
    setLive(true);
  }, [fixture, nowMs]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text accessible={false} style={[styles.eyebrow, { color: theme.colors.textMuted }]}>TEEVEE</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Gids</Text>
        </View>
        <View style={styles.presentationLabel}>
          <View style={[styles.presentationDot, { backgroundColor: theme.colors.currentTime }]} />
          <Text style={[styles.presentationText, { color: theme.colors.textSecondary }]}>Nu & Straks</Text>
        </View>
      </View>

      <View style={styles.referenceControls}>
        <View>
          <Text style={[styles.referenceCaption, { color: theme.colors.textMuted }]}>Referentietijd</Text>
          <Text style={[styles.referenceTime, { color: theme.colors.text }]}>
            {live ? `Nu · ${formatTime(referenceMs)}` : formatTime(referenceMs)}
          </Text>
        </View>
        <View style={styles.shortcutRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ga naar primetime"
            onPress={goPrimetime}
            style={[
              styles.shortcutButton,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.shortcutText, { color: theme.colors.textSecondary }]}
            >
              Primetime
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ga naar nu"
            accessibilityState={{ selected: live }}
            onPress={goNow}
            style={[
              styles.shortcutButton,
              {
                borderColor: live ? theme.colors.accent : theme.colors.border,
                backgroundColor: live ? theme.colors.accent : theme.colors.surface,
              },
            ]}
          >
            <Text
              maxFontSizeMultiplier={CONTROL_MAX_FONT_SIZE_MULTIPLIER}
              style={[
                styles.shortcutText,
                { color: live ? theme.colors.background : theme.colors.textSecondary },
              ]}
            >
              Nu
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.timeRailShell, { borderBottomColor: theme.colors.border }]}>
        <View
          pointerEvents="none"
          style={[styles.referenceMarker, { backgroundColor: theme.colors.currentTime }]}
        />
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
                      color: selected ? theme.colors.text : theme.colors.textMuted,
                      fontWeight: selected ? '700' : '600',
                    },
                  ]}
                >
                  {formatTime(slot)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        testID="now-next-channel-scroll"
        bounces
        alwaysBounceVertical
        directionalLockEnabled
        showsVerticalScrollIndicator
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 2,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  presentationLabel: {
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  presentationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presentationText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  referenceControls: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  referenceCaption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  referenceTime: {
    marginTop: 2,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shortcutButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  timeRailShell: {
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  referenceMarker: {
    position: 'absolute',
    left: '50%',
    bottom: 0,
    width: 2,
    height: 8,
    zIndex: 2,
    borderRadius: 1,
  },
  timeSlot: {
    width: TIME_SLOT_WIDTH,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotText: {
    fontSize: 12,
    lineHeight: 16,
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