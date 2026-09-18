import {
  type ReactNode,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import type { Channel, Programme } from '@/data/domain/epg';
import { GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture } from '@/data/fixtures/runtimeGuideFixture';
import { runtimeGuideScheduleFor } from '@/data/runtime/guideScheduleRuntime';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { ChannelIdentity } from './ChannelIdentity';
import type { ProgrammeSelection } from './detailState';
import { GuideChrome } from './GuideChrome';
import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_VISUAL_METRICS,
} from './guideVisualMetrics';
import {
  clampReferenceTime,
  explicitRailActionAnimation,
  indexProgrammesByChannel,
  nearestSlotIndex,
  nowNextPrimetimeMs,
  nowNextTelevisionDayBounds,
  programmesAroundReferenceFromProgrammes,
  railDragCommitsWithoutMomentum,
  railSlotIndexForOffset,
  resolveNowNextSchedulePresentation,
  resolveNowNextTemporalControlStates,
  timeSlotsForDay,
} from './nowNext';
import {
  NOW_NEXT_STABLE_SCROLL_GEOMETRY,
  NOW_NEXT_TYPOGRAPHY,
  NOW_NEXT_VISUAL_METRICS,
  nowNextChannelRowLayout,
  nowNextChromeCondensedForProgress,
  nowNextCollapseProgressForScrollOffset,
  nowNextProgrammePressBackgroundColor,
  nowNextSafeAreaLayout,
  nowNextStableScrollVisuals,
} from './nowNextLayout';
import { useGuideClock } from './useGuideClock';

type NowNextGuideViewProps = {
  guideDataVersion: number;
  presentationNavigation: ReactNode;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

type ChannelRowProps = {
  channel: Channel;
  programmes: readonly Programme[];
  referenceMs: number;
  live: boolean;
  nowMs: number;
  fontScale: number;
  platform: string;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

function formatTime(timeMs: number) {
  return new Date(timeMs).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: GUIDE_TIME_ZONE,
  });
}

function programmeAccessibilityLabel(
  channel: Channel,
  programme: Programme,
  current: boolean,
) {
  const startMs = Date.parse(programme.startAt);
  const endMs = Date.parse(programme.endAt);
  return `${channel.displayName}, ${programme.title}, ${formatTime(startMs)} tot ${formatTime(endMs)}${current ? ', nu bezig' : ''}`;
}

const FOLLOWING_SLOT_INDEXES = [0, 1, 2] as const;

const ChannelRow = memo(function ChannelRow({
  channel,
  programmes,
  referenceMs,
  live,
  nowMs,
  fontScale,
  platform,
  onSelectProgramme,
}: ChannelRowProps) {
  const theme = useTeeveeTheme();
  const rowLayout = nowNextChannelRowLayout(platform, fontScale);
  const { referenceProgramme, followingProgrammes } = useMemo(
    () => programmesAroundReferenceFromProgrammes(programmes, referenceMs),
    [programmes, referenceMs],
  );

  const openProgramme = useCallback(
    (programme: Programme) => onSelectProgramme({ programme, channel }),
    [channel, onSelectProgramme],
  );

  const isActuallyLive =
    live &&
    referenceProgramme !== null &&
    Date.parse(referenceProgramme.startAt) <= nowMs &&
    nowMs < Date.parse(referenceProgramme.endAt);

  return (
    <View
      testID={`now-next-channel-${channel.id}`}
      style={[
        styles.channelRow,
        {
          height: rowLayout.rowHeight,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[styles.channelIdentityZone, { height: rowLayout.referenceHeight }]}
      >
        <ChannelIdentity
          channel={channel}
          textColor={theme.colors.text}
          mutedTextColor={theme.colors.textMuted}
          variant="now-next"
          accessible={false}
        />
      </View>

      <View style={styles.programmesColumn}>
        {referenceProgramme ? (
          <Pressable
            testID={`now-next-reference-${channel.id}-${referenceProgramme.id}`}
            accessibilityRole="button"
            accessibilityLabel={programmeAccessibilityLabel(
              channel,
              referenceProgramme,
              isActuallyLive,
            )}
            accessibilityHint="Opent programmadetails"
            onPress={() => openProgramme(referenceProgramme)}
            style={({ pressed }) => [
              styles.referenceProgramme,
              {
                height: rowLayout.referenceHeight,
                backgroundColor: nowNextProgrammePressBackgroundColor(
                  pressed,
                  theme.colors.surface,
                ),
              },
            ]}
          >
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[styles.referenceTitle, { color: theme.colors.text }]}
            >
              {referenceProgramme.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.referenceMeta,
                {
                  color: isActuallyLive
                    ? theme.colors.currentTime
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {isActuallyLive
                ? `Nu · tot ${formatTime(Date.parse(referenceProgramme.endAt))}`
                : `tot ${formatTime(Date.parse(referenceProgramme.endAt))}`}
            </Text>
          </Pressable>
        ) : (
          <View
            testID={`now-next-reference-gap-${channel.id}`}
            style={[styles.referenceProgramme, { height: rowLayout.referenceHeight }]}
          >
            <Text style={[styles.gapTitle, { color: theme.colors.textSecondary }]}>
              Geen programma
            </Text>
            <Text style={[styles.referenceMeta, { color: theme.colors.textMuted }]}>
              op dit tijdstip
            </Text>
          </View>
        )}

        <View style={styles.followingList}>
          {FOLLOWING_SLOT_INDEXES.map((slotIndex) => {
            const programme = followingProgrammes[slotIndex];
            if (!programme) {
              return (
                <View
                  key={slotIndex}
                  testID={`now-next-following-empty-${channel.id}-${slotIndex}`}
                  pointerEvents="none"
                  style={{ height: rowLayout.followingHeight }}
                />
              );
            }

            const stacked = rowLayout.mode === 'stacked';
            return (
              <Pressable
                key={programme.id}
                testID={`now-next-following-${channel.id}-${slotIndex}-${programme.id}`}
                accessibilityRole="button"
                accessibilityLabel={programmeAccessibilityLabel(
                  channel,
                  programme,
                  false,
                )}
                accessibilityHint="Opent programmadetails"
                onPress={() => openProgramme(programme)}
                style={({ pressed }) => [
                  styles.followingRow,
                  stacked ? styles.followingRowStacked : styles.followingRowHorizontal,
                  {
                    height: rowLayout.followingHeight,
                    backgroundColor: nowNextProgrammePressBackgroundColor(
                      pressed,
                      theme.colors.surface,
                    ),
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.followingTime,
                    stacked ? styles.followingTimeStacked : null,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {formatTime(Date.parse(programme.startAt))}
                </Text>
                <Text
                  numberOfLines={stacked ? 2 : 1}
                  ellipsizeMode="tail"
                  style={[
                    styles.followingTitle,
                    stacked ? styles.followingTitleStacked : null,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {programme.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
});

export const NowNextGuideView = memo(function NowNextGuideView({
  guideDataVersion,
  presentationNavigation,
  onSelectProgramme,
}: NowNextGuideViewProps) {
  const theme = useTeeveeTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { width: windowWidth, fontScale = 1 } = useWindowDimensions();
  const effectiveFontScale =
    Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  const platform = Platform.OS;
  const reduceMotion = useReducedMotion();
  const timeRailRef = useRef<ScrollView>(null);
  const nowMs = useGuideClock();
  const [dayAnchorMs, setDayAnchorMs] = useState(() => nowMs);
  const [live, setLive] = useState(true);
  const [pinnedReferenceMs, setPinnedReferenceMs] = useState(() => nowMs);
  const [condensed, setCondensed] = useState(false);

  const { startMs: dayStartMs, endMs: dayEndMs } = useMemo(
    () => nowNextTelevisionDayBounds(dayAnchorMs),
    [dayAnchorMs],
  );
  const slots = useMemo(
    () => timeSlotsForDay(dayStartMs, dayEndMs),
    [dayEndMs, dayStartMs],
  );
  const primetimeMs = useMemo(() => nowNextPrimetimeMs(dayStartMs), [dayStartMs]);
  const referenceMs = live
    ? clampReferenceTime(nowMs, dayStartMs, dayEndMs)
    : clampReferenceTime(pinnedReferenceMs, dayStartMs, dayEndMs);
  const referenceMsRef = useRef(referenceMs);
  referenceMsRef.current = referenceMs;
  const selectedSlotIndex = nearestSlotIndex(slots, referenceMs);
  const temporalControlStates = resolveNowNextTemporalControlStates({
    live,
    referenceMs,
    primetimeMs,
  });

  const runtimeSchedule = useMemo(
    () => runtimeGuideScheduleFor(dayAnchorMs),
    [dayAnchorMs, guideDataVersion],
  );
  const establishedChannelsRef = useRef<Channel[] | null>(
    runtimeSchedule?.channels.length ? runtimeSchedule.channels : null,
  );
  const establishedChannels = runtimeSchedule?.channels.length
    ? runtimeSchedule.channels
    : establishedChannelsRef.current;

  useEffect(() => {
    if (runtimeSchedule?.channels.length) {
      establishedChannelsRef.current = runtimeSchedule.channels;
    }
  }, [runtimeSchedule]);

  const fixtureFallback = useMemo(
    () =>
      establishedChannels?.length
        ? null
        : buildRuntimeGuideFixture(dayStartMs),
    [dayStartMs, establishedChannels],
  );
  const schedulePresentation = useMemo(
    () =>
      resolveNowNextSchedulePresentation(
        runtimeSchedule,
        establishedChannels,
        fixtureFallback,
      ),
    [establishedChannels, fixtureFallback, runtimeSchedule],
  );
  const programmesByChannel = useMemo(
    () =>
      schedulePresentation.schedule
        ? indexProgrammesByChannel(schedulePresentation.schedule)
        : new Map<string, Programme[]>(),
    [schedulePresentation.schedule],
  );
  const rowLayout = nowNextChannelRowLayout(platform, effectiveFontScale);
  const railInset = Math.max(
    0,
    windowWidth / 2 - NOW_NEXT_VISUAL_METRICS.timeSlotWidth / 2,
  );
  const safeAreaLayout = nowNextSafeAreaLayout(safeAreaInsets.top);

  useEffect(() => {
    const nextDayStartMs = nowNextTelevisionDayBounds(nowMs).startMs;
    if (nextDayStartMs === dayStartMs) return;
    setDayAnchorMs(nowMs);
    setPinnedReferenceMs(nowMs);
    setLive(true);
  }, [dayStartMs, nowMs]);

  const centreTime = useCallback(
    (index: number, animated: boolean) => {
      timeRailRef.current?.scrollTo({
        x: Math.max(0, index * NOW_NEXT_VISUAL_METRICS.timeSlotWidth),
        animated,
      });
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
    (index: number) => {
      setReferenceSlot(index);
      centreTime(index, explicitRailActionAnimation(reduceMotion));
    },
    [centreTime, reduceMotion, setReferenceSlot],
  );

  const commitRailOffset = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (slots.length === 0) return;
      const index = railSlotIndexForOffset(
        event.nativeEvent.contentOffset.x,
        slots.length,
        NOW_NEXT_VISUAL_METRICS.timeSlotWidth,
      );
      setReferenceSlot(index);
    },
    [setReferenceSlot, slots.length],
  );

  const commitDragWithoutMomentum = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (railDragCommitsWithoutMomentum(event.nativeEvent.velocity?.x)) {
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
    const nextDayStartMs = nowNextTelevisionDayBounds(currentNow).startMs;
    setPinnedReferenceMs(currentNow);
    setLive(true);

    if (nextDayStartMs !== dayStartMs) {
      setDayAnchorMs(currentNow);
      return;
    }

    centreTime(
      nearestSlotIndex(slots, currentNow),
      explicitRailActionAnimation(reduceMotion),
    );
  }, [centreTime, dayStartMs, reduceMotion, slots]);

  const goPrimetime = useCallback(() => {
    setPinnedReferenceMs(primetimeMs);
    setLive(false);
    centreTime(
      nearestSlotIndex(slots, primetimeMs),
      explicitRailActionAnimation(reduceMotion),
    );
  }, [centreTime, primetimeMs, reduceMotion, slots]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      centreTime(nearestSlotIndex(slots, referenceMsRef.current), false);
    });
    return () => cancelAnimationFrame(frame);
  }, [centreTime, slots]);

  const collapseProgress = useSharedValue(0);
  const syncCondensed = useCallback((next: boolean) => {
    setCondensed((current) => (current === next ? current : next));
  }, []);

  useAnimatedReaction(
    () => nowNextChromeCondensedForProgress(collapseProgress.value),
    (next, previous) => {
      if (next !== previous) scheduleOnRN(syncCondensed, next);
    },
    [syncCondensed],
  );

  const channelScrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        collapseProgress.value = nowNextCollapseProgressForScrollOffset(
          event.contentOffset.y,
          reduceMotion,
        );
      },
    },
    [reduceMotion],
  );

  const channelContentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: nowNextStableScrollVisuals(collapseProgress.value)
          .contentTranslateY,
      },
    ],
  }));

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
          testID="now-next-reference-context"
          style={[
            styles.referenceContext,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.referenceCopy}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
              style={[
                styles.referenceCaption,
                { color: theme.colors.textMuted },
              ]}
            >
              Referentietijd
            </Text>
            <Text
              testID="now-next-reference-time"
              numberOfLines={1}
              maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.referenceTime, { color: theme.colors.text }]}
            >
              {live ? `Nu · ${formatTime(referenceMs)}` : formatTime(referenceMs)}
            </Text>
          </View>

          <View style={styles.utilityActions}>
            <Pressable
              testID="now-next-primetime"
              accessibilityRole="button"
              accessibilityLabel="Ga naar primetime, 20:30 op de actieve televisiedag"
              accessibilityState={{
                selected: temporalControlStates.primetime === 'active',
              }}
              onPress={goPrimetime}
              style={styles.utilityTouchTarget}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.primetimeVisible,
                    pressed
                      ? { backgroundColor: theme.colors.surface }
                      : null,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
                    style={[styles.utilityText, { color: theme.colors.textSecondary }]}
                  >
                    Primetime
                  </Text>
                  {temporalControlStates.primetime === 'active' ? (
                    <View
                      testID="now-next-primetime-active-indicator"
                      style={[
                        styles.utilityIndicator,
                        { backgroundColor: theme.colors.currentTime },
                      ]}
                    />
                  ) : null}
                </View>
              )}
            </Pressable>

            <Pressable
              testID="now-next-now"
              accessibilityRole="button"
              accessibilityLabel="Ga naar nu"
              accessibilityState={{ selected: temporalControlStates.nu === 'active' }}
              onPress={goNow}
              style={styles.utilityTouchTarget}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.nowVisible,
                    temporalControlStates.nu === 'action'
                      ? {
                          backgroundColor: theme.colors.surfaceElevated,
                          borderColor: theme.colors.border,
                          borderWidth: StyleSheet.hairlineWidth,
                        }
                      : null,
                    pressed
                      ? { backgroundColor: theme.colors.surface }
                      : null,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
                    style={[styles.utilityText, { color: theme.colors.text }]}
                  >
                    Nu
                  </Text>
                  {temporalControlStates.nu === 'active' ? (
                    <View
                      testID="now-next-now-active-indicator"
                      style={[
                        styles.utilityIndicator,
                        { backgroundColor: theme.colors.currentTime },
                      ]}
                    />
                  ) : null}
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View
          testID="now-next-time-rail-shell"
          style={[
            styles.timeRailShell,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              styles.referenceMarker,
              { backgroundColor: theme.colors.currentTime },
            ]}
          />
          <ScrollView
            ref={timeRailRef}
            testID="now-next-time-rail"
            horizontal
            bounces
            directionalLockEnabled
            nestedScrollEnabled
            decelerationRate="fast"
            snapToInterval={NOW_NEXT_VISUAL_METRICS.timeSlotWidth}
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
                  testID={`now-next-time-slot-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Tijd ${formatTime(slot)}`}
                  accessibilityState={{ selected }}
                  onPress={() => chooseSlot(index)}
                  style={({ pressed }) => [
                    styles.timeSlot,
                    pressed ? { backgroundColor: theme.colors.surface } : null,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
                    style={[
                      selected
                        ? styles.timeSlotSelectedText
                        : styles.timeSlotText,
                      {
                        color: selected
                          ? theme.colors.text
                          : theme.colors.textMuted,
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
      </View>

      <Animated.ScrollView
        testID="now-next-channel-scroll"
        bounces
        alwaysBounceVertical
        directionalLockEnabled
        nestedScrollEnabled
        showsVerticalScrollIndicator
        scrollEventThrottle={16}
        onScroll={channelScrollHandler}
        style={[
          styles.channelViewport,
          { top: safeAreaLayout.channelViewportTop },
        ]}
        contentContainerStyle={{
          paddingBottom: NOW_NEXT_VISUAL_METRICS.bottomClearance,
        }}
      >
        <Animated.View style={[styles.channelContent, channelContentStyle]}>
          <View
            pointerEvents="none"
            style={{ height: NOW_NEXT_STABLE_SCROLL_GEOMETRY.contentTopInset }}
          />

          {schedulePresentation.schedule ? (
            schedulePresentation.channels.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                programmes={programmesByChannel.get(channel.id) ?? []}
                referenceMs={referenceMs}
                live={live}
                nowMs={nowMs}
                fontScale={effectiveFontScale}
                platform={platform}
                onSelectProgramme={onSelectProgramme}
              />
            ))
          ) : (
            <View
              testID="now-next-schedule-state-unavailable"
              accessible
              accessibilityRole="text"
              accessibilityLabel="Geen gidsgegevens beschikbaar."
              style={[
                styles.scheduleUnavailable,
                {
                  minHeight: Math.max(
                    rowLayout.rowHeight,
                    schedulePresentation.channels.length * rowLayout.rowHeight,
                  ),
                },
              ]}
            >
              <Text
                style={[
                  styles.scheduleUnavailableText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Geen gidsgegevens beschikbaar.
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>
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
    zIndex: 2,
  },
  referenceContext: {
    height: NOW_NEXT_VISUAL_METRICS.referenceContextHeight,
    paddingHorizontal: GUIDE_VISUAL_METRICS.screenInsetX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: NOW_NEXT_VISUAL_METRICS.shortcutGap,
  },
  referenceCopy: {
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'center',
  },
  referenceCaption: {
    ...NOW_NEXT_TYPOGRAPHY.referenceCaption,
    letterSpacing: 0,
  },
  referenceTime: {
    ...NOW_NEXT_TYPOGRAPHY.referenceTime,
    marginTop: 1,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  utilityActions: {
    marginLeft: 'auto',
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: NOW_NEXT_VISUAL_METRICS.shortcutGap,
  },
  utilityTouchTarget: {
    minHeight: Platform.OS === 'android'
      ? GUIDE_VISUAL_METRICS.minimumTouchTarget
      : GUIDE_VISUAL_METRICS.minimumTouchTargetIos,
    minWidth: Platform.OS === 'android'
      ? GUIDE_VISUAL_METRICS.minimumTouchTarget
      : GUIDE_VISUAL_METRICS.minimumTouchTargetIos,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primetimeVisible: {
    position: 'relative',
    height: NOW_NEXT_VISUAL_METRICS.shortcutVisibleHeight,
    paddingHorizontal: NOW_NEXT_VISUAL_METRICS.primetimePaddingX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowVisible: {
    position: 'relative',
    height: NOW_NEXT_VISUAL_METRICS.shortcutVisibleHeight,
    minWidth: NOW_NEXT_VISUAL_METRICS.nowMinWidth,
    paddingHorizontal: NOW_NEXT_VISUAL_METRICS.nowPaddingX,
    borderRadius: NOW_NEXT_VISUAL_METRICS.shortcutRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityText: {
    ...NOW_NEXT_TYPOGRAPHY.utility,
    letterSpacing: 0,
  },
  utilityIndicator: {
    position: 'absolute',
    bottom: NOW_NEXT_VISUAL_METRICS.utilityIndicatorBottomInset,
    width: NOW_NEXT_VISUAL_METRICS.utilityIndicatorWidth,
    height: NOW_NEXT_VISUAL_METRICS.utilityIndicatorHeight,
    borderRadius: NOW_NEXT_VISUAL_METRICS.utilityIndicatorRadius,
  },
  timeRailShell: {
    height: NOW_NEXT_VISUAL_METRICS.timeRailHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  referenceMarker: {
    position: 'absolute',
    left: '50%',
    bottom: 0,
    width: NOW_NEXT_VISUAL_METRICS.referenceMarkerWidth,
    height: NOW_NEXT_VISUAL_METRICS.referenceMarkerHeight,
    zIndex: 2,
    borderRadius: NOW_NEXT_VISUAL_METRICS.referenceMarkerWidth / 2,
  },
  timeSlot: {
    width: NOW_NEXT_VISUAL_METRICS.timeSlotWidth,
    height: NOW_NEXT_VISUAL_METRICS.timeSlotHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotText: {
    ...NOW_NEXT_TYPOGRAPHY.timeSlot,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  timeSlotSelectedText: {
    ...NOW_NEXT_TYPOGRAPHY.timeSlotSelected,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  channelViewport: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  channelContent: {
    width: '100%',
  },
  channelRow: {
    paddingTop: NOW_NEXT_VISUAL_METRICS.channelTopPadding,
    paddingBottom: NOW_NEXT_VISUAL_METRICS.channelBottomPadding,
    paddingLeft: NOW_NEXT_VISUAL_METRICS.channelLeftInset,
    paddingRight: NOW_NEXT_VISUAL_METRICS.programmeRightInset,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelIdentityZone: {
    width: NOW_NEXT_VISUAL_METRICS.channelIdentityWidth,
    marginRight: NOW_NEXT_VISUAL_METRICS.channelProgrammeGap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programmesColumn: {
    flex: 1,
    minWidth: 0,
  },
  referenceProgramme: {
    justifyContent: 'center',
    paddingRight: 0,
  },
  referenceTitle: {
    ...NOW_NEXT_TYPOGRAPHY.referenceTitle,
    letterSpacing: 0,
  },
  gapTitle: {
    ...NOW_NEXT_TYPOGRAPHY.followingTitle,
    letterSpacing: 0,
  },
  referenceMeta: {
    ...NOW_NEXT_TYPOGRAPHY.referenceMeta,
    marginTop: 3,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  followingList: {
    marginTop: NOW_NEXT_VISUAL_METRICS.referenceToFollowingGap,
  },
  followingRow: {
    width: '100%',
  },
  followingRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followingRowStacked: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: NOW_NEXT_VISUAL_METRICS.followingStackedPaddingY,
  },
  followingTime: {
    ...NOW_NEXT_TYPOGRAPHY.followingTime,
    width: NOW_NEXT_VISUAL_METRICS.followingTimeWidth,
    marginRight: NOW_NEXT_VISUAL_METRICS.followingTimeTitleGap,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  followingTimeStacked: {
    width: '100%',
    marginRight: 0,
    marginBottom: NOW_NEXT_VISUAL_METRICS.followingStackedGap,
  },
  followingTitle: {
    ...NOW_NEXT_TYPOGRAPHY.followingTitle,
    flex: 1,
    minWidth: 0,
    letterSpacing: 0,
  },
  followingTitleStacked: {
    width: '100%',
    flex: 0,
  },
  scheduleUnavailable: {
    paddingHorizontal: GUIDE_VISUAL_METRICS.screenInsetX,
    paddingTop: 24,
  },
  scheduleUnavailableText: {
    ...NOW_NEXT_TYPOGRAPHY.referenceMeta,
    letterSpacing: 0,
  },
});
