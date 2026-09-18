import { type ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
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
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { type Channel } from '@/data/domain/epg';
import { guideTelevisionDayStart, GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture } from '@/data/fixtures/runtimeGuideFixture';
import { runtimeGuideScheduleFor } from '@/data/runtime/guideScheduleRuntime';
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
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  currentProgrammeTitleLineCount,
  GUIDE_TYPOGRAPHY,
  GUIDE_VISUAL_METRICS,
  minimumTouchTargetForPlatform,
  PER_CHANNEL_VISUAL_METRICS,
  programmeTitleLineCount,
} from './guideVisualMetrics';
import {
  adjacentChannelIndex,
  buildProgrammeRows,
  channelRailRecenterPlan,
  collapseProgressForScrollOffset,
  compactContextForCollapseProgress,
  perChannelAnimatedTargetForScheduleOffset,
  perChannelFunctionalGapsForCollapseProgress,
  perChannelLayoutAnchorKey,
  perChannelNativeOffsetForScheduleOffset,
  perChannelScheduleOffsetForNativeOffset,
  PER_CHANNEL_STABLE_SCROLL_GEOMETRY,
  perChannelStableScrollVisuals,
  type PerChannelProgrammeRow,
  programmesForChannelDay,
  programmeRowPressBackgroundColor,
  resolvePerChannelSchedulePresentation,
  resolvePerChannelTemporalControlStates,
  scheduleHeightForRows,
  scrollOffsetForTimestamp,
  selectedChannelIndexForId,
  timestampForScrollOffset,
  viewportReferenceInset,
} from './perChannel';
import { useGuideClock } from './useGuideClock';
import { useGuideDaySelection } from './useGuideDaySelection';
import { useSelectedGuideDaySchedule } from './useSelectedGuideDaySchedule';

const TIME_COLUMN_CONTENT_WIDTH =
  GUIDE_VISUAL_METRICS.screenInsetX +
  PER_CHANNEL_VISUAL_METRICS.timeGutterWidth -
  PER_CHANNEL_VISUAL_METRICS.timeTextX;
const CONTEXT_WRAP_Y_EPSILON = 1;
const SCROLL_DIAGNOSTICS_ENABLED =
  typeof __DEV__ !== 'undefined' && __DEV__;
const SCROLL_DIAGNOSTIC_MAX_SAMPLES = 240;
type ScrollDiagnosticContext = {
  samples: number[][];
  frame: number;
};

function reportScrollDiagnosticEvent(
  event: string,
  y: number,
  collapseProgress: number,
  reactCommit: number,
) {
  if (!SCROLL_DIAGNOSTICS_ENABLED) return;
  console.log(
    '[TEEVEE_SCROLL_EVENT]',
    JSON.stringify({
      event,
      timestampMs: Date.now(),
      y,
      collapseProgress,
      reactCommit,
    }),
  );
}

function reportScrollDiagnosticTrace(samples: number[][]) {
  if (!SCROLL_DIAGNOSTICS_ENABLED || samples.length === 0) return;
  console.log(
    '[TEEVEE_SCROLL_TRACE]',
    JSON.stringify({
      columns: [
        'frame',
        'contentOffsetY',
        'collapseProgress',
        'guideChromeHeight',
        'channelStripHeight',
        'stripToContextGap',
        'contextToScheduleGap',
        'scheduleViewportY',
        'scheduleViewportHeight',
        'reactCommit',
      ],
      samples,
    }),
  );
}

type PerChannelGuideViewProps = {
  guideDataVersion: number;
  presentationNavigation: ReactNode;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

type SchedulePageProps = {
  channel: Channel;
  rows: PerChannelProgrammeRow[];
  width: number;
  fontScale: number;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

function formatTime(timeMs: number) {
  return new Date(timeMs).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: GUIDE_TIME_ZONE,
  });
}

function currentDetail(row: PerChannelProgrammeRow) {
  const description = row.programme.description?.trim();
  if (description) return description;
  const subtitle = row.programme.subtitle?.trim();
  return subtitle || null;
}

function ProgrammeRow({
  channel,
  row,
  fontScale,
  onSelectProgramme,
}: {
  channel: Channel;
  row: PerChannelProgrammeRow;
  fontScale: number;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
}) {
  const theme = useTeeveeTheme();
  const { programme, current, progress } = row;
  const startMs = Date.parse(programme.startAt);
  const endMs = Date.parse(programme.endAt);
  const titleLines = current
    ? currentProgrammeTitleLineCount(fontScale)
    : programmeTitleLineCount(fontScale);
  const detail = current ? currentDetail(row) : null;

  return (
    <Pressable
      testID={`per-channel-programme-${programme.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${channel.displayName}, ${programme.title}, ${formatTime(startMs)} tot ${formatTime(endMs)}${current ? ', nu bezig' : ''}`}
      accessibilityHint="Opent programmadetails"
      onPress={() => onSelectProgramme({ programme, channelName: channel.displayName })}
      style={({ pressed }) => [
        styles.programmeRow,
        {
          top: row.top,
          height: row.height,
          backgroundColor: programmeRowPressBackgroundColor(pressed, theme.colors.surface),
        },
      ]}
    >
      {current ? (
        <View
          testID={`per-channel-current-layer-${programme.id}`}
          pointerEvents="none"
          style={styles.currentVisualLayer}
        >
          <Text
            numberOfLines={1}
            style={[styles.currentTime, { color: theme.colors.textSecondary }]}
          >
            {formatTime(startMs)}
          </Text>
          <View style={styles.currentContent}>
            <Text
              numberOfLines={titleLines}
              ellipsizeMode="tail"
              style={[styles.currentTitle, { color: theme.colors.text }]}
            >
              {programme.title}
            </Text>
            {detail ? (
              <Text
                testID={`per-channel-description-${programme.id}`}
                numberOfLines={PER_CHANNEL_VISUAL_METRICS.currentDescriptionMaxLines}
                ellipsizeMode="tail"
                style={[styles.currentDescription, { color: theme.colors.textSecondary }]}
              >
                {detail}
              </Text>
            ) : null}
          </View>
          <View
            testID={`per-channel-progress-${programme.id}`}
            style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(1, Math.max(0, progress)) * 100}%`,
                  backgroundColor: theme.colors.currentTime,
                },
              ]}
            />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.standardTimeCell}>
            <Text
              numberOfLines={1}
              style={[styles.programmeTime, { color: theme.colors.textSecondary }]}
            >
              {formatTime(startMs)}
            </Text>
          </View>
          <View style={styles.standardTitleCell}>
            <Text
              numberOfLines={titleLines}
              ellipsizeMode="tail"
              style={[styles.programmeTitle, { color: theme.colors.text }]}
            >
              {programme.title}
            </Text>
          </View>
        </>
      )}
      <View
        pointerEvents="none"
        style={[styles.programmeSeparator, { backgroundColor: theme.colors.border }]}
      />
    </Pressable>
  );
}

const SchedulePage = memo(function SchedulePage({
  channel,
  rows,
  width,
  fontScale,
  onSelectProgramme,
}: SchedulePageProps) {
  const height = scheduleHeightForRows(rows);
  return (
    <View style={[styles.schedulePage, { width, height }]}>
      {rows.map((row) => (
        <ProgrammeRow
          key={row.programme.id}
          channel={channel}
          row={row}
          fontScale={fontScale}
          onSelectProgramme={onSelectProgramme}
        />
      ))}
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

function MoonGlyph({ color, maskColor }: { color: string; maskColor: string }) {
  return (
    <View
      testID="per-channel-primetime-moon"
      accessible={false}
      style={styles.moonIconBox}
    >
      <View style={[styles.moonDisc, { backgroundColor: color }]} />
      <View style={[styles.moonCutout, { backgroundColor: maskColor }]} />
    </View>
  );
}

export const PerChannelGuideView = memo(function PerChannelGuideView({
  guideDataVersion,
  onSelectProgramme,
  presentationNavigation,
}: PerChannelGuideViewProps) {
  const theme = useTeeveeTheme();
  const { width: windowWidth, fontScale = 1 } = useWindowDimensions();
  const effectiveFontScale = Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  const minimumTouchTarget = minimumTouchTargetForPlatform(Platform?.OS);
  const reduceMotion = useReducedMotion();
  const channelStripRef = useRef<ScrollView>(null);
  const pagerRef = useRef<ScrollView>(null);
  const scheduleRef = useRef<Animated.ScrollView>(null);
  const contextDateYRef = useRef<number | null>(null);
  const contextUtilitiesYRef = useRef<number | null>(null);
  const viewedTimeRef = useRef(Date.now());
  const pendingTargetTimeRef = useRef<number | null>(null);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const reactCommitCount = useSharedValue(0);
  const scheduleViewportY = useSharedValue(0);
  const scheduleViewportHeight = useSharedValue(0);
  const nowMs = useGuideClock();
  const { selectedDayStartMs, selectDay } = useGuideDaySelection(nowMs);
  const selectedDay = useSelectedGuideDaySchedule(selectedDayStartMs, guideDataVersion);
  const currentRuntimeSchedule = runtimeGuideScheduleFor(nowMs);
  const establishedChannelsRef = useRef<Channel[] | null>(
    currentRuntimeSchedule?.channels.length ? currentRuntimeSchedule.channels : null,
  );
  const establishedChannels =
    selectedDay.schedule?.channels.length
      ? selectedDay.schedule.channels
      : currentRuntimeSchedule?.channels.length
        ? currentRuntimeSchedule.channels
        : establishedChannelsRef.current;

  useEffect(() => {
    const nextChannels =
      selectedDay.schedule?.channels.length
        ? selectedDay.schedule.channels
        : currentRuntimeSchedule?.channels.length
          ? currentRuntimeSchedule.channels
          : null;
    if (nextChannels) establishedChannelsRef.current = nextChannels;
  }, [currentRuntimeSchedule, selectedDay.schedule]);

  const fixtureFallback = useMemo(
    () =>
      establishedChannels && establishedChannels.length > 0
        ? null
        : buildRuntimeGuideFixture(selectedDayStartMs),
    [establishedChannels, guideDataVersion, selectedDayStartMs],
  );
  const schedulePresentation = useMemo(
    () =>
      resolvePerChannelSchedulePresentation(
        selectedDay.schedule,
        establishedChannels,
        fixtureFallback,
      ),
    [establishedChannels, fixtureFallback, selectedDay.schedule],
  );
  const programmeSchedule = schedulePresentation.schedule;
  const channels = schedulePresentation.channels;
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(() => channels[0]?.id ?? null);
  const [condensed, setCondensed] = useState(false);
  const [contextWrapped, setContextWrapped] = useState(false);
  const [stableAnchorTimeMs, setStableAnchorTimeMs] = useState(() => viewedTimeRef.current);
  const safeSelectedIndex = selectedChannelIndexForId(channels, selectedChannelId);
  const selectedChannel = channels[safeSelectedIndex] ?? channels[0];
  const dayStartMs = selectedDayStartMs;
  const dayEndMs = useMemo(
    () => guideTelevisionDayStart(selectedDayStartMs, 1),
    [selectedDayStartMs],
  );
  const pagerChannels = useMemo(
    () => channelsForPager(channels, safeSelectedIndex),
    [channels, safeSelectedIndex],
  );
  const pagerPages = useMemo(
    () =>
      pagerChannels.map((channel) => ({
        channel,
        rows: programmeSchedule
          ? buildProgrammeRows(
              programmesForChannelDay(programmeSchedule, channel.id, dayStartMs, dayEndMs),
              nowMs,
              effectiveFontScale,
            )
          : [],
      })),
    [dayEndMs, dayStartMs, effectiveFontScale, nowMs, pagerChannels, programmeSchedule],
  );
  const selectedRows = pagerPages[1]?.rows ?? [];
  const nowTarget = useMemo(() => guideTargetForNow(nowMs), [nowMs]);
  const primetimeTarget = useMemo(
    () => guideTargetForPrimetime(selectedDayStartMs),
    [selectedDayStartMs],
  );
  const temporalControlStates = useMemo(
    () =>
      resolvePerChannelTemporalControlStates({
        rows: selectedRows,
        stableAnchorTimeMs,
        selectedDayStartMs,
        nowDayStartMs: nowTarget.dayStartMs,
        nowTimeMs: nowTarget.timeMs,
        primetimeTimeMs: primetimeTarget.timeMs,
        nuAvailable: channels.length > 0,
        primetimeAvailable: selectedRows.length > 0,
      }),
    [
      channels.length,
      nowTarget.dayStartMs,
      nowTarget.timeMs,
      primetimeTarget.timeMs,
      selectedDayStartMs,
      selectedRows,
      stableAnchorTimeMs,
    ],
  );
  const scheduleHeight = Math.max(1, ...pagerPages.map(({ rows }) => scheduleHeightForRows(rows)));
  const referenceInset = viewportReferenceInset(effectiveFontScale);
  const selectedRowsRef = useRef(selectedRows);
  const referenceInsetRef = useRef(referenceInset);
  selectedRowsRef.current = selectedRows;
  referenceInsetRef.current = referenceInset;

  const collapseProgress = useSharedValue(0);
  const collapseAnchorY = useSharedValue(0);
  const collapseEnabled = useSharedValue(0);

  useEffect(() => {
    reactCommitCount.value = renderCountRef.current;
    if (SCROLL_DIAGNOSTICS_ENABLED) {
      console.log(
        '[TEEVEE_SCROLL_COMMIT]',
        JSON.stringify({
          timestampMs: Date.now(),
          commit: renderCountRef.current,
          condensed,
          contextWrapped,
          selectedDayStartMs,
          selectedChannelId,
          hasProgrammeSchedule: programmeSchedule !== null,
        }),
      );
    }
  });

  useEffect(() => {
    if (!selectedChannel) return;
    if (selectedChannel.id !== selectedChannelId) setSelectedChannelId(selectedChannel.id);
  }, [selectedChannel, selectedChannelId]);

  useEffect(() => {
    contextDateYRef.current = null;
    contextUtilitiesYRef.current = null;
    setContextWrapped(false);
  }, [effectiveFontScale, safeSelectedIndex, selectedDayStartMs, windowWidth]);

  const centrePager = useCallback(
    (animated = false) => pagerRef.current?.scrollTo({ x: windowWidth, animated }),
    [windowWidth],
  );

  const centreSelectedChannel = useCallback(
    (index: number, animatedOverride?: boolean) => {
      const plan = channelRailRecenterPlan(index, channels.length, windowWidth, reduceMotion);
      channelStripRef.current?.scrollTo({
        x: plan.x,
        animated: animatedOverride ?? plan.animated,
      });
    },
    [channels.length, reduceMotion, windowWidth],
  );

  const selectChannel = useCallback(
    (index: number) => {
      if (!channels[index] || index === safeSelectedIndex) return;
      setSelectedChannelId(channels[index]!.id);
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
      const changedChannel = nextIndex !== safeSelectedIndex;
      if (changedChannel) setSelectedChannelId(channels[nextIndex]!.id);
      requestAnimationFrame(() => {
        centrePager(false);
        if (changedChannel) {
          requestAnimationFrame(() => centreSelectedChannel(nextIndex));
        }
      });
    },
    [centrePager, centreSelectedChannel, channels, safeSelectedIndex, windowWidth],
  );

  const scrollToTimestamp = useCallback(
    (timeMs: number, animated: boolean) => {
      viewedTimeRef.current = timeMs;
      setStableAnchorTimeMs(timeMs);
      const progress = Math.min(1, Math.max(0, collapseProgress.value));
      const scheduleOffset = scrollOffsetForTimestamp(
        selectedRowsRef.current,
        timeMs,
        referenceInsetRef.current,
      );
      const target =
        animated && collapseEnabled.value !== 0
          ? perChannelAnimatedTargetForScheduleOffset(
              scheduleOffset,
              collapseAnchorY.value,
              progress,
            )
          : {
              progress,
              nativeOffset: perChannelNativeOffsetForScheduleOffset(
                scheduleOffset,
                progress,
              ),
            };
      if (!animated) {
        collapseAnchorY.value = Math.max(
          0,
          target.nativeOffset -
            target.progress * PER_CHANNEL_VISUAL_METRICS.collapseDistance,
        );
        collapseEnabled.value = 1;
      }
      scheduleRef.current?.scrollTo({ y: target.nativeOffset, animated });
    },
    [collapseAnchorY, collapseEnabled, collapseProgress],
  );

  const syncViewedTimestamp = useCallback((y: number, progress: number) => {
    const scheduleOffset = perChannelScheduleOffsetForNativeOffset(y, progress);
    const nextTimeMs = timestampForScrollOffset(
      selectedRowsRef.current,
      scheduleOffset,
      referenceInsetRef.current,
      viewedTimeRef.current,
    );
    viewedTimeRef.current = nextTimeMs;
    setStableAnchorTimeMs(nextTimeMs);
  }, []);

  const syncCondensedState = useCallback((nextCondensed: boolean) => {
    setCondensed((current) => (current === nextCondensed ? current : nextCondensed));
  }, []);

  useAnimatedReaction(
    () => compactContextForCollapseProgress(collapseProgress.value),
    (nextCondensed, previousCondensed) => {
      if (nextCondensed !== previousCondensed) {
        scheduleOnRN(syncCondensedState, nextCondensed);
      }
    },
    [syncCondensedState],
  );

  const scheduleScrollHandler = useAnimatedScrollHandler<ScrollDiagnosticContext>(
    {
      onBeginDrag: (event, context) => {
        const y = Math.max(0, event.contentOffset.y);
        if (SCROLL_DIAGNOSTICS_ENABLED) {
          context.samples = [];
          context.frame = 0;
          scheduleOnRN(
            reportScrollDiagnosticEvent,
            'beginDrag',
            y,
            collapseProgress.value,
            reactCommitCount.value,
          );
        }
        if (collapseEnabled.value !== 0) return;
        collapseAnchorY.value = Math.max(
          0,
          y - collapseProgress.value * PER_CHANNEL_VISUAL_METRICS.collapseDistance,
        );
        collapseEnabled.value = 1;
      },
      onScroll: (event, context) => {
        const y = Math.max(0, event.contentOffset.y);
        const nextProgress = collapseProgressForScrollOffset(
          y,
          collapseEnabled.value ? collapseAnchorY.value : y,
          reduceMotion,
        );
        collapseProgress.value = nextProgress;

        if (
          SCROLL_DIAGNOSTICS_ENABLED &&
          context.samples &&
          context.samples.length < SCROLL_DIAGNOSTIC_MAX_SAMPLES
        ) {
          const visuals = perChannelStableScrollVisuals(nextProgress, contextWrapped);
          context.samples.push([
            context.frame ?? 0,
            y,
            nextProgress,
            visuals.guideChromeHeight,
            visuals.channelStripHeight,
            visuals.stripToContextGap,
            visuals.contextToScheduleGap,
            scheduleViewportY.value,
            scheduleViewportHeight.value,
            reactCommitCount.value,
          ]);
          context.frame = (context.frame ?? 0) + 1;
        }
      },
      onEndDrag: (event) => {
        const y = Math.max(0, event.contentOffset.y);
        if (SCROLL_DIAGNOSTICS_ENABLED) {
          scheduleOnRN(
            reportScrollDiagnosticEvent,
            'endDrag',
            y,
            collapseProgress.value,
            reactCommitCount.value,
          );
        }
        scheduleOnRN(syncViewedTimestamp, y, collapseProgress.value);
      },
      onMomentumBegin: (event) => {
        if (!SCROLL_DIAGNOSTICS_ENABLED) return;
        scheduleOnRN(
          reportScrollDiagnosticEvent,
          'momentumBegin',
          Math.max(0, event.contentOffset.y),
          collapseProgress.value,
          reactCommitCount.value,
        );
      },
      onMomentumEnd: (event, context) => {
        const y = Math.max(0, event.contentOffset.y);
        if (SCROLL_DIAGNOSTICS_ENABLED) {
          scheduleOnRN(
            reportScrollDiagnosticEvent,
            'momentumEnd',
            y,
            collapseProgress.value,
            reactCommitCount.value,
          );
          scheduleOnRN(reportScrollDiagnosticTrace, context.samples ?? []);
        }
        scheduleOnRN(syncViewedTimestamp, y, collapseProgress.value);
      },
    },
    [contextWrapped, reduceMotion, syncViewedTimestamp],
  );

  const contextTopGapStyle = useAnimatedStyle(() => ({
    height: perChannelFunctionalGapsForCollapseProgress(collapseProgress.value).stripToContext,
  }));

  const scheduleGapStyle = useAnimatedStyle(() => ({
    height: perChannelFunctionalGapsForCollapseProgress(collapseProgress.value).contextToSchedule,
  }));

  const channelStripHeightStyle = useAnimatedStyle(() => ({
    height:
      PER_CHANNEL_VISUAL_METRICS.channelStripHeight -
      (PER_CHANNEL_VISUAL_METRICS.channelStripHeight -
        PER_CHANNEL_VISUAL_METRICS.channelStripCondensedHeight) *
        collapseProgress.value,
  }));

  const scheduleContentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: perChannelStableScrollVisuals(
          collapseProgress.value,
          contextWrapped,
        ).contentTranslateY,
      },
    ],
  }));

  const changeDay = useCallback(
    (nextDayStartMs: number) => {
      if (nextDayStartMs === selectedDayStartMs) return;
      const target = guideTargetForDaySelection(viewedTimeRef.current, nextDayStartMs);
      pendingTargetTimeRef.current = target.timeMs;
      selectDay(target.dayStartMs);
    },
    [selectDay, selectedDayStartMs],
  );

  const scrollToNow = useCallback(() => {
    if (nowTarget.dayStartMs === selectedDayStartMs) {
      scrollToTimestamp(nowTarget.timeMs, true);
      return;
    }
    pendingTargetTimeRef.current = nowTarget.timeMs;
    selectDay(nowTarget.dayStartMs);
  }, [nowTarget, scrollToTimestamp, selectDay, selectedDayStartMs]);

  const scrollToPrimetime = useCallback(() => {
    scrollToTimestamp(primetimeTarget.timeMs, true);
  }, [primetimeTarget.timeMs, scrollToTimestamp]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => centrePager(false));
    return () => cancelAnimationFrame(frame);
  }, [centrePager, safeSelectedIndex, selectedDayStartMs]);

  const layoutAnchorKey = perChannelLayoutAnchorKey(
    selectedDayStartMs,
    selectedChannel?.id ?? null,
    effectiveFontScale,
    programmeSchedule,
  );
  useEffect(() => {
    if (!layoutAnchorKey) return;
    const target = pendingTargetTimeRef.current ?? viewedTimeRef.current;
    pendingTargetTimeRef.current = null;
    const frame = requestAnimationFrame(() => scrollToTimestamp(target, false));
    return () => cancelAnimationFrame(frame);
  }, [layoutAnchorKey, scrollToTimestamp]);

  const detectContextWrap = useCallback(() => {
    const dateY = contextDateYRef.current;
    const utilitiesY = contextUtilitiesYRef.current;
    if (dateY === null || utilitiesY === null) return;
    setContextWrapped(Math.abs(dateY - utilitiesY) > CONTEXT_WRAP_Y_EPSILON);
  }, []);

  const handleDateContextLayout = useCallback((event: LayoutChangeEvent) => {
    contextDateYRef.current = event.nativeEvent.layout.y;
    detectContextWrap();
  }, [detectContextWrap]);

  const handleUtilitiesLayout = useCallback((event: LayoutChangeEvent) => {
    contextUtilitiesYRef.current = event.nativeEvent.layout.y;
    detectContextWrap();
  }, [detectContextWrap]);

  const handleScheduleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    scheduleViewportY.value = y;
    scheduleViewportHeight.value = height;
    if (SCROLL_DIAGNOSTICS_ENABLED) {
      console.log(
        '[TEEVEE_SCROLL_LAYOUT]',
        JSON.stringify({
          timestampMs: Date.now(),
          y,
          height,
          commit: renderCountRef.current,
        }),
      );
    }
  }, [scheduleViewportHeight, scheduleViewportY]);

  if (!selectedChannel) return null;

  const contextMinHeight = contextWrapped
    ? PER_CHANNEL_VISUAL_METRICS.stickyContextWrappedHeight
    : PER_CHANNEL_VISUAL_METRICS.stickyContextHeight;
  const programmeStatus =
    programmeSchedule === null ? (selectedDay.unavailable ? 'unavailable' : 'loading') : null;
  const programmeStatusLabel =
    programmeStatus === 'unavailable'
      ? 'Geen gidsgegevens beschikbaar voor deze dag.'
      : 'Gids laden…';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View
        pointerEvents="box-none"
        style={[styles.guideOverlay, { backgroundColor: theme.colors.background }]}
      >
      <GuideChrome
        condensed={condensed}
        presentationNavigation={presentationNavigation}
        collapseProgress={collapseProgress}
      />

      <Animated.View style={[styles.channelStripFrame, channelStripHeightStyle]}>
        <ScrollView
          ref={channelStripRef}
          testID="per-channel-channel-strip"
          horizontal
          bounces
          directionalLockEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={[styles.channelStrip, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.channelStripContent}
        >
        {channels.map((channel, index) => {
          const active = index === safeSelectedIndex;
          return (
            <Pressable
              key={channel.id}
              testID={`per-channel-channel-${channel.id}`}
              accessibilityRole="button"
              accessibilityLabel={channel.displayName}
              accessibilityState={{ selected: active }}
              onPress={() => selectChannel(index)}
              style={({ pressed }) => [
                styles.channelButton,
                {
                  backgroundColor: active ? theme.colors.surfaceElevated : 'transparent',
                  borderColor: active ? theme.colors.border : 'transparent',
                  borderWidth: active ? StyleSheet.hairlineWidth : 0,
                  opacity: pressed ? GUIDE_VISUAL_METRICS.controlPressOpacity : 1,
                },
              ]}
            >
              <ChannelIdentity
                channel={channel}
                textColor={active ? theme.colors.text : theme.colors.textSecondary}
                mutedTextColor={theme.colors.textSecondary}
                variant="per-channel-strip"
              />
            </Pressable>
          );
        })}
        </ScrollView>
      </Animated.View>

      <Animated.View
        testID="per-channel-strip-to-context-gap"
        pointerEvents="none"
        style={contextTopGapStyle}
      />

      <View
        testID={condensed ? 'per-channel-context-condensed' : 'per-channel-context-expanded'}
        style={[
          styles.contextRow,
          {
            minHeight: contextMinHeight,
            backgroundColor: theme.colors.background,
            borderBottomColor: condensed ? theme.colors.border : 'transparent',
            borderBottomWidth: condensed ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <View
          testID="per-channel-date-group"
          onLayout={handleDateContextLayout}
          style={[styles.dateControlWrap, contextWrapped ? styles.contextFullWidth : null]}
        >
          <GuideDaySelector
            selectedDayStartMs={selectedDayStartMs}
            nowMs={nowMs}
            loading={selectedDay.loading}
            unavailable={selectedDay.unavailable}
            compactPrefix={condensed ? selectedChannel.displayName : undefined}
            onSelectDay={changeDay}
          />
        </View>

        <View
          testID="per-channel-utility-group"
          onLayout={handleUtilitiesLayout}
          style={[styles.utilityActions, contextWrapped ? styles.utilityActionsWrapped : null]}
        >
          <Pressable
            testID="per-channel-primetime"
            accessibilityRole="button"
            accessibilityLabel="Ga naar primetime, 20:30 op geselecteerde dag"
            accessibilityState={{
              selected: temporalControlStates.primetime === 'active',
              disabled: temporalControlStates.primetime === 'disabled',
            }}
            disabled={temporalControlStates.primetime === 'disabled'}
            onPress={scrollToPrimetime}
            style={({ pressed }) => [
              styles.utilityTouchTarget,
              {
                minHeight: minimumTouchTarget,
                minWidth: minimumTouchTarget,
                opacity:
                  temporalControlStates.primetime === 'disabled'
                    ? GUIDE_VISUAL_METRICS.disabledOpacity
                    : pressed
                      ? PER_CHANNEL_VISUAL_METRICS.utilityPressedOpacity
                      : 1,
              },
            ]}
          >
            <View style={styles.primetimeVisible}>
              <MoonGlyph
                color={
                  temporalControlStates.primetime === 'active'
                    ? theme.colors.text
                    : theme.colors.textSecondary
                }
                maskColor={theme.colors.background}
              />
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
                style={[
                  styles.utilityButtonText,
                  {
                    color:
                      temporalControlStates.primetime === 'active'
                        ? theme.colors.text
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                Primetime
              </Text>
              {temporalControlStates.primetime === 'active' ? (
                <View
                  testID="per-channel-primetime-active-indicator"
                  style={[styles.utilityCurrentIndicator, { backgroundColor: theme.colors.currentTime }]}
                />
              ) : null}
            </View>
          </Pressable>

          <Pressable
            testID="per-channel-now"
            accessibilityRole="button"
            accessibilityLabel="Ga naar nu"
            accessibilityState={{
              selected: temporalControlStates.nu === 'active',
              disabled: temporalControlStates.nu === 'disabled',
            }}
            disabled={temporalControlStates.nu === 'disabled'}
            onPress={scrollToNow}
            style={({ pressed }) => [
              styles.utilityTouchTarget,
              {
                minHeight: minimumTouchTarget,
                minWidth: minimumTouchTarget,
                opacity:
                  temporalControlStates.nu === 'disabled'
                    ? GUIDE_VISUAL_METRICS.disabledOpacity
                    : pressed
                      ? PER_CHANNEL_VISUAL_METRICS.utilityPressedOpacity
                      : 1,
              },
            ]}
          >
            <View
              style={[
                styles.nowVisible,
                temporalControlStates.nu !== 'active' ? styles.nowReturnVisible : null,
                temporalControlStates.nu !== 'active'
                  ? { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }
                  : null,
              ]}
            >
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
                style={[styles.utilityButtonText, { color: theme.colors.text }]}
              >
                Nu
              </Text>
              {temporalControlStates.nu === 'active' ? (
                <View
                  testID="per-channel-now-active-indicator"
                  style={[styles.utilityCurrentIndicator, { backgroundColor: theme.colors.currentTime }]}
                />
              ) : null}
            </View>
          </Pressable>
        </View>
      </View>

      <Animated.View pointerEvents="none" style={scheduleGapStyle} />
      </View>

      <Animated.ScrollView
        ref={scheduleRef}
        testID="per-channel-schedule-scroll"
        accessibilityState={{ busy: programmeStatus === 'loading' }}
        bounces
        alwaysBounceVertical
        directionalLockEnabled
        nestedScrollEnabled
        decelerationRate="normal"
        showsVerticalScrollIndicator
        scrollEventThrottle={16}
        onScroll={scheduleScrollHandler}
        onLayout={handleScheduleViewportLayout}
        style={styles.scheduleViewport}
        contentContainerStyle={{
          minHeight: PER_CHANNEL_STABLE_SCROLL_GEOMETRY.contentTopInset + scheduleHeight,
        }}
      >
        <Animated.View
          style={[
            styles.scheduleContent,
            scheduleContentStyle,
            {
              minHeight: PER_CHANNEL_STABLE_SCROLL_GEOMETRY.contentTopInset + scheduleHeight,
            },
          ]}
        >
          <View pointerEvents="none" style={styles.scheduleTopInset} />
        {programmeStatus ? (
          <View
            testID={`per-channel-programme-state-${programmeStatus}`}
            accessible
            accessibilityRole="text"
            accessibilityLabel={programmeStatusLabel}
            accessibilityLiveRegion="polite"
            style={styles.scheduleStatus}
          >
            <Text style={[styles.scheduleStatusText, { color: theme.colors.textSecondary }]}>
              {programmeStatusLabel}
            </Text>
          </View>
        ) : (
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
            {pagerPages.map(({ channel, rows }, pageIndex) => (
              <SchedulePage
                key={`${pageIndex}-${channel.id}`}
                channel={channel}
                rows={rows}
                width={windowWidth}
                fontScale={effectiveFontScale}
                onSelectProgramme={onSelectProgramme}
              />
            ))}
          </ScrollView>
        )}
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  guideOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 2,
  },
  scheduleViewport: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PER_CHANNEL_STABLE_SCROLL_GEOMETRY.viewportTop,
    bottom: 0,
    zIndex: 1,
  },
  scheduleContent: {
    width: '100%',
  },
  scheduleTopInset: {
    height: PER_CHANNEL_STABLE_SCROLL_GEOMETRY.contentTopInset,
  },
  channelStripFrame: {
    flexGrow: 0,
    overflow: 'hidden',
  },
  channelStrip: {
    flex: 1,
  },
  channelStripContent: {
    paddingHorizontal: PER_CHANNEL_VISUAL_METRICS.channelStripInsetX,
    alignItems: 'center',
    gap: PER_CHANNEL_VISUAL_METRICS.channelItemGap,
  },
  channelButton: {
    width: PER_CHANNEL_VISUAL_METRICS.channelItemSize,
    height: PER_CHANNEL_VISUAL_METRICS.channelItemSize,
    borderRadius: PER_CHANNEL_VISUAL_METRICS.channelSelectedRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextRow: {
    paddingHorizontal: GUIDE_VISUAL_METRICS.screenInsetX,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: PER_CHANNEL_VISUAL_METRICS.utilityGap,
    rowGap: 0,
  },
  dateControlWrap: {
    flexShrink: 0,
  },
  contextFullWidth: {
    width: '100%',
  },
  utilityActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: PER_CHANNEL_VISUAL_METRICS.utilityGap,
  },
  utilityActionsWrapped: {
    width: '100%',
    marginLeft: 0,
  },
  utilityTouchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primetimeVisible: {
    position: 'relative',
    height: PER_CHANNEL_VISUAL_METRICS.utilityVisibleHeight,
    paddingHorizontal: PER_CHANNEL_VISUAL_METRICS.primetimePaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PER_CHANNEL_VISUAL_METRICS.utilityIconGap,
  },
  nowVisible: {
    position: 'relative',
    height: PER_CHANNEL_VISUAL_METRICS.utilityVisibleHeight,
    minWidth: PER_CHANNEL_VISUAL_METRICS.nowMinWidth,
    paddingHorizontal: PER_CHANNEL_VISUAL_METRICS.nowPaddingX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowReturnVisible: {
    borderRadius: PER_CHANNEL_VISUAL_METRICS.utilityRadius,
    borderWidth: StyleSheet.hairlineWidth,
  },
  utilityCurrentIndicator: {
    position: 'absolute',
    bottom: PER_CHANNEL_VISUAL_METRICS.utilityIndicatorBottomInset,
    width: PER_CHANNEL_VISUAL_METRICS.utilityIndicatorWidth,
    height: PER_CHANNEL_VISUAL_METRICS.utilityIndicatorHeight,
    borderRadius: PER_CHANNEL_VISUAL_METRICS.utilityIndicatorRadius,
  },
  moonIconBox: {
    width: PER_CHANNEL_VISUAL_METRICS.utilityIconSize,
    height: PER_CHANNEL_VISUAL_METRICS.utilityIconSize,
    overflow: 'hidden',
  },
  moonDisc: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: PER_CHANNEL_VISUAL_METRICS.utilityIconSize,
    height: PER_CHANNEL_VISUAL_METRICS.utilityIconSize,
    borderRadius: PER_CHANNEL_VISUAL_METRICS.utilityIconSize / 2,
  },
  moonCutout: {
    position: 'absolute',
    left: 5,
    top: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  utilityButtonText: {
    ...GUIDE_TYPOGRAPHY.utility,
    letterSpacing: 0,
  },
  scheduleStatus: {
    minHeight: PER_CHANNEL_VISUAL_METRICS.currentRowHeight,
    paddingHorizontal: GUIDE_VISUAL_METRICS.screenInsetX,
    paddingTop: GUIDE_VISUAL_METRICS.screenInsetX,
  },
  scheduleStatusText: {
    ...GUIDE_TYPOGRAPHY.currentDescription,
    letterSpacing: 0,
  },
  schedulePage: {
    overflow: 'hidden',
  },
  programmeRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  currentVisualLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  standardTimeCell: {
    position: 'absolute',
    left: PER_CHANNEL_VISUAL_METRICS.timeTextX,
    top: 0,
    bottom: 0,
    width: TIME_COLUMN_CONTENT_WIDTH,
    justifyContent: 'center',
  },
  standardTitleCell: {
    position: 'absolute',
    left: PER_CHANNEL_VISUAL_METRICS.programmeColumnX,
    right: PER_CHANNEL_VISUAL_METRICS.programmeRightInset,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  programmeTime: {
    ...GUIDE_TYPOGRAPHY.programmeTime,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
  },
  programmeTitle: {
    ...GUIDE_TYPOGRAPHY.programmeTitle,
    letterSpacing: 0,
  },
  currentTime: {
    position: 'absolute',
    left: PER_CHANNEL_VISUAL_METRICS.timeTextX,
    top: PER_CHANNEL_VISUAL_METRICS.currentContentTopInset,
    width: TIME_COLUMN_CONTENT_WIDTH,
    ...GUIDE_TYPOGRAPHY.programmeTime,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
  },
  currentContent: {
    position: 'absolute',
    left: PER_CHANNEL_VISUAL_METRICS.programmeColumnX,
    right: PER_CHANNEL_VISUAL_METRICS.programmeRightInset,
    top: PER_CHANNEL_VISUAL_METRICS.currentContentTopInset,
    bottom:
      PER_CHANNEL_VISUAL_METRICS.progressBottomInset +
      PER_CHANNEL_VISUAL_METRICS.progressHeight +
      PER_CHANNEL_VISUAL_METRICS.currentDescriptionToProgressMinGap,
    overflow: 'hidden',
  },
  currentTitle: {
    ...GUIDE_TYPOGRAPHY.currentProgrammeTitle,
    letterSpacing: 0,
  },
  currentDescription: {
    ...GUIDE_TYPOGRAPHY.currentDescription,
    marginTop: PER_CHANNEL_VISUAL_METRICS.currentDescriptionGap,
    letterSpacing: 0,
  },
  progressTrack: {
    position: 'absolute',
    left: PER_CHANNEL_VISUAL_METRICS.programmeColumnX,
    right: PER_CHANNEL_VISUAL_METRICS.programmeRightInset,
    bottom: PER_CHANNEL_VISUAL_METRICS.progressBottomInset,
    height: PER_CHANNEL_VISUAL_METRICS.progressHeight,
    borderRadius: PER_CHANNEL_VISUAL_METRICS.progressRadius,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: PER_CHANNEL_VISUAL_METRICS.progressRadius,
  },
  programmeSeparator: {
    position: 'absolute',
    left: PER_CHANNEL_VISUAL_METRICS.separatorLeftInset,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
