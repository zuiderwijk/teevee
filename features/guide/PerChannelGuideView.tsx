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
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import {
  isProgrammeCurrent,
  programmeProgress,
  type Channel,
  type GuideFixture,
  type Programme,
} from '@/data/domain/epg';
import { guideTelevisionDayStart, GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture } from '@/data/fixtures/runtimeGuideFixture';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { ChannelIdentity } from './ChannelIdentity';
import type { ProgrammeSelection } from './detailState';
import { GuideChrome } from './GuideChrome';
import { GuideDaySelector } from './GuideDaySelector';
import {
  COMPACT_CHROME_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_TYPOGRAPHY,
  GUIDE_VISUAL_METRICS,
  minimumTouchTargetForPlatform,
  PER_CHANNEL_VISUAL_METRICS,
} from './guideVisualMetrics';
import {
  guideTargetForDaySelection,
  guideTargetForNow,
  guideTargetForPrimetime,
} from './guideDaySelection';
import {
  adjacentChannelIndex,
  currentProgrammePresentationForNormalizedHeight,
  normalizedProgrammeHeight,
  PER_CHANNEL_VIEWED_TIME_ANCHOR_INSET,
  perChannelMinuteHeightForFontScale,
  programmeDensityForNormalizedHeight,
  programmeStartTimeFits,
  programmeVerticalFrame,
  programmesForChannelDay,
  scheduleYForTime,
} from './perChannel';
import { useGuideClock } from './useGuideClock';
import { useGuideDaySelection } from './useGuideDaySelection';
import { useSelectedGuideDaySchedule } from './useSelectedGuideDaySchedule';

const CHANNEL_ITEM_STEP =
  PER_CHANNEL_VISUAL_METRICS.channelItemSize + PER_CHANNEL_VISUAL_METRICS.channelItemGap;
const CONTEXT_WRAP_Y_EPSILON = 1;

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
  minuteHeight: number;
  fontScale: number;
  width: number;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

type ProgrammeBlockProps = {
  channel: Channel;
  programme: Programme;
  frame: { top: number; height: number };
  current: boolean;
  progress: number;
  fontScale: number;
  showSeparator: boolean;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
  currentTimeColor: string;
  pressedBackground: string;
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

function currentDetail(programme: Programme): string | null {
  const description = programme.description?.trim();
  if (description) return description;
  const subtitle = programme.subtitle?.trim();
  return subtitle || null;
}

function ProgrammeBlock({
  channel,
  programme,
  frame,
  current,
  progress,
  fontScale,
  showSeparator,
  textColor,
  secondaryTextColor,
  borderColor,
  currentTimeColor,
  pressedBackground,
  onSelectProgramme,
}: ProgrammeBlockProps) {
  const startMs = Date.parse(programme.startAt);
  const endMs = Date.parse(programme.endAt);
  const effectiveFontScale = Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  const normalizedHeight = normalizedProgrammeHeight(frame.height, effectiveFontScale);
  const density = programmeDensityForNormalizedHeight(normalizedHeight);
  const currentPresentation = current
    ? currentProgrammePresentationForNormalizedHeight(normalizedHeight)
    : null;
  const visibleDensity = currentPresentation?.density ?? density;
  const showText = visibleDensity !== 'hidden';
  const compact = visibleDensity === 'compact';
  const showStartTime = programmeStartTimeFits(frame.height, effectiveFontScale, visibleDensity);
  const contentInsetY = compact
    ? PER_CHANNEL_VISUAL_METRICS.programmeCompactInsetY
    : PER_CHANNEL_VISUAL_METRICS.programmeContentInsetY;
  const allowSecondTitleLine =
    !compact && normalizedHeight >= PER_CHANNEL_VISUAL_METRICS.twoLineTitleMinNormalizedHeight;
  const detail = current ? currentDetail(programme) : null;
  const showProgress = Boolean(currentPresentation?.showProgress);
  const canShowDescription = Boolean(currentPresentation?.showDescription && detail);
  const [measuredTitleLines, setMeasuredTitleLines] = useState(1);
  const titleLineHeight = compact
    ? GUIDE_TYPOGRAPHY.programmeTitleCompact.lineHeight
    : GUIDE_TYPOGRAPHY.programmeTitle.lineHeight;
  const progressTopBoundary =
    frame.height -
    PER_CHANNEL_VISUAL_METRICS.progressBottomInset -
    PER_CHANNEL_VISUAL_METRICS.progressHeight -
    PER_CHANNEL_VISUAL_METRICS.progressTextClearance;
  const descriptionStart =
    contentInsetY +
    titleLineHeight * effectiveFontScale * Math.max(1, measuredTitleLines) +
    PER_CHANNEL_VISUAL_METRICS.descriptionGap;
  const descriptionLineCount = canShowDescription
    ? Math.max(
        0,
        Math.min(
          3,
          Math.floor(
            (progressTopBoundary - descriptionStart) /
              (GUIDE_TYPOGRAPHY.currentDescription.lineHeight * effectiveFontScale),
          ),
        ),
      )
    : 0;

  return (
    <Pressable
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
          backgroundColor: pressed ? pressedBackground : 'transparent',
        },
      ]}
    >
      {showText ? (
        <>
          {showStartTime ? (
            <Text
              testID={`per-channel-start-${programme.id}`}
              numberOfLines={1}
              style={[
                styles.programmeStart,
                { top: contentInsetY, color: secondaryTextColor },
              ]}
            >
              {formatTime(startMs)}
            </Text>
          ) : null}

          <View
            style={[
              styles.programmeContent,
              {
                top: contentInsetY,
                bottom: showProgress
                  ? PER_CHANNEL_VISUAL_METRICS.progressBottomInset +
                    PER_CHANNEL_VISUAL_METRICS.progressHeight +
                    PER_CHANNEL_VISUAL_METRICS.progressTextClearance
                  : 0,
              },
            ]}
          >
            <Text
              numberOfLines={allowSecondTitleLine ? 2 : 1}
              ellipsizeMode="tail"
              onTextLayout={(event) => {
                if (!current || !canShowDescription) return;
                const lines = Math.max(1, Math.min(2, event.nativeEvent.lines.length));
                setMeasuredTitleLines((previous) => (previous === lines ? previous : lines));
              }}
              style={[
                compact
                  ? current
                    ? styles.currentProgrammeTitleCompact
                    : styles.programmeTitleCompact
                  : current
                    ? styles.currentProgrammeTitle
                    : styles.programmeTitle,
                { color: textColor },
              ]}
            >
              {programme.title}
            </Text>

            {descriptionLineCount > 0 && detail ? (
              <Text
                testID={`per-channel-description-${programme.id}`}
                numberOfLines={descriptionLineCount}
                ellipsizeMode="tail"
                style={[styles.programmeDescription, { color: secondaryTextColor }]}
              >
                {detail}
              </Text>
            ) : null}
          </View>
        </>
      ) : null}

      {showProgress ? (
        <View
          testID={`per-channel-progress-${programme.id}`}
          style={[styles.progressTrack, { backgroundColor: borderColor }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(1, Math.max(0, progress)) * 100}%`,
                backgroundColor: currentTimeColor,
              },
            ]}
          />
        </View>
      ) : null}

      {showSeparator ? (
        <View
          pointerEvents="none"
          style={[styles.programmeSeparator, { backgroundColor: borderColor }]}
        />
      ) : null}
    </Pressable>
  );
}

const SchedulePage = memo(function SchedulePage({
  channel,
  fixture,
  dayStartMs,
  dayEndMs,
  nowMs,
  minuteHeight,
  fontScale,
  width,
  onSelectProgramme,
}: SchedulePageProps) {
  const theme = useTeeveeTheme();
  const programmes = useMemo(
    () => programmesForChannelDay(fixture, channel.id, dayStartMs, dayEndMs),
    [channel.id, dayEndMs, dayStartMs, fixture],
  );
  const separatorOwnerIds = useMemo(() => {
    const ownerByEnd = new Map<number, string>();
    programmes.forEach((programme) => {
      const visibleEnd = Math.min(dayEndMs, Date.parse(programme.endAt));
      if (!ownerByEnd.has(visibleEnd)) ownerByEnd.set(visibleEnd, programme.id);
    });
    return new Set(ownerByEnd.values());
  }, [dayEndMs, programmes]);
  const height = ((dayEndMs - dayStartMs) / 60_000) * minuteHeight;

  return (
    <View style={{ width, height }}>
      {programmes.map((programme) => {
        const frame = programmeVerticalFrame(programme, dayStartMs, dayEndMs, minuteHeight);
        const current = isProgrammeCurrent(programme, nowMs);
        const progress = current ? programmeProgress(programme, nowMs) : 0;

        return (
          <ProgrammeBlock
            key={programme.id}
            channel={channel}
            programme={programme}
            frame={frame}
            current={current}
            progress={progress}
            fontScale={fontScale}
            showSeparator={separatorOwnerIds.has(programme.id)}
            textColor={theme.colors.text}
            secondaryTextColor={theme.colors.textSecondary}
            borderColor={theme.colors.border}
            currentTimeColor={theme.colors.currentTime}
            pressedBackground={theme.colors.surfaceElevated}
            onSelectProgramme={onSelectProgramme}
          />
        );
      })}
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
    <View accessible={false} style={styles.moonIconBox}>
      <View style={[styles.moonCircle, { borderColor: color }]} />
      <View style={[styles.moonMask, { backgroundColor: maskColor }]} />
    </View>
  );
}

export const PerChannelGuideView = memo(function PerChannelGuideView({
  guideDataVersion,
  onSelectProgramme,
  headerAction,
}: PerChannelGuideViewProps) {
  const theme = useTeeveeTheme();
  const { width: windowWidth, fontScale = 1 } = useWindowDimensions();
  const effectiveFontScale = Number.isFinite(fontScale) && fontScale > 0 ? Math.max(1, fontScale) : 1;
  const minuteHeight = useMemo(
    () => perChannelMinuteHeightForFontScale(effectiveFontScale),
    [effectiveFontScale],
  );
  const minimumTouchTarget = minimumTouchTargetForPlatform(Platform.OS);
  const reduceMotion = useReducedMotion();
  const channelStripRef = useRef<ScrollView>(null);
  const pagerRef = useRef<ScrollView>(null);
  const scheduleRef = useRef<ScrollView>(null);
  const contextDateYRef = useRef<number | null>(null);
  const contextUtilitiesYRef = useRef<number | null>(null);
  const nowMs = useGuideClock();
  const { selectedDayStartMs, selectDay } = useGuideDaySelection(nowMs);
  const selectedDay = useSelectedGuideDaySchedule(selectedDayStartMs, guideDataVersion);
  const fixture = useMemo(
    () => selectedDay.schedule ?? buildRuntimeGuideFixture(selectedDayStartMs),
    [guideDataVersion, selectedDay.schedule, selectedDayStartMs],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [condensed, setCondensed] = useState(false);
  const [contextWrapped, setContextWrapped] = useState(false);
  const viewedTimeRef = useRef(nowMs);
  const pendingTargetTimeRef = useRef<number | null>(null);
  const channels = fixture.channels;
  const safeSelectedIndex = Math.min(Math.max(0, selectedIndex), Math.max(0, channels.length - 1));
  const selectedChannel = channels[safeSelectedIndex] ?? channels[0];
  const dayStartMs = selectedDayStartMs;
  const dayEndMs = useMemo(
    () => guideTelevisionDayStart(selectedDayStartMs, 1),
    [selectedDayStartMs],
  );
  const scheduleHeight = ((dayEndMs - dayStartMs) / 60_000) * minuteHeight;
  const pagerChannels = useMemo(
    () => channelsForPager(channels, safeSelectedIndex),
    [channels, safeSelectedIndex],
  );
  const collapseProgress = useSharedValue(0);
  const collapseAnchorY = useSharedValue(0);
  const collapseEnabled = useSharedValue(0);
  const headingNaturalHeight = useSharedValue(
    PER_CHANNEL_VISUAL_METRICS.stripToHeadingGap +
      GUIDE_TYPOGRAPHY.selectedChannelHeading.lineHeight +
      PER_CHANNEL_VISUAL_METRICS.headingToUtilitiesGap,
  );

  useEffect(() => {
    if (selectedIndex !== safeSelectedIndex) setSelectedIndex(safeSelectedIndex);
  }, [safeSelectedIndex, selectedIndex]);

  useEffect(() => {
    contextDateYRef.current = null;
    contextUtilitiesYRef.current = null;
    setContextWrapped(false);
  }, [effectiveFontScale, safeSelectedIndex, selectedDayStartMs, windowWidth]);

  const centrePager = useCallback(
    (animated = false) => {
      pagerRef.current?.scrollTo({ x: windowWidth, animated });
    },
    [windowWidth],
  );

  const centreSelectedChannel = useCallback(
    (index: number, animated = true) => {
      const itemCentre =
        PER_CHANNEL_VISUAL_METRICS.channelStripInsetX +
        index * CHANNEL_ITEM_STEP +
        PER_CHANNEL_VISUAL_METRICS.channelItemSize / 2;
      const contentWidth =
        PER_CHANNEL_VISUAL_METRICS.channelStripInsetX * 2 +
        channels.length * PER_CHANNEL_VISUAL_METRICS.channelItemSize +
        Math.max(0, channels.length - 1) * PER_CHANNEL_VISUAL_METRICS.channelItemGap;
      const max = Math.max(0, contentWidth - windowWidth);
      const target = itemCentre - windowWidth / 2;
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
      const y = Math.max(
        0,
        scheduleYForTime(target, dayStartMs, minuteHeight) - PER_CHANNEL_VIEWED_TIME_ANCHOR_INSET,
      );
      if (!animated) {
        collapseAnchorY.value = y;
        collapseEnabled.value = 0;
        collapseProgress.value = 0;
        setCondensed(false);
      }
      scheduleRef.current?.scrollTo({ y, animated });
    },
    [collapseAnchorY, collapseEnabled, collapseProgress, dayEndMs, dayStartMs, minuteHeight],
  );

  const syncScheduleScroll = useCallback(
    (y: number, progress: number) => {
      const nextViewedTime =
        dayStartMs +
        ((Math.max(0, y) + PER_CHANNEL_VIEWED_TIME_ANCHOR_INSET) / minuteHeight) * 60_000;
      viewedTimeRef.current = clampTime(nextViewedTime, dayStartMs, dayEndMs);
      const nextCondensed = progress >= 1;
      setCondensed((current) => (current === nextCondensed ? current : nextCondensed));
    },
    [dayEndMs, dayStartMs, minuteHeight],
  );

  const scheduleScrollHandler = useAnimatedScrollHandler(
    {
      onBeginDrag: () => {
        collapseEnabled.value = 1;
      },
      onScroll: (event) => {
        const y = Math.max(0, event.contentOffset.y);
        const scrollY = collapseEnabled.value
          ? Math.max(0, y - collapseAnchorY.value)
          : 0;
        const progress = reduceMotion
          ? scrollY >= PER_CHANNEL_VISUAL_METRICS.reduceMotionSwitchOffset
            ? 1
            : 0
          : Math.min(1, scrollY / PER_CHANNEL_VISUAL_METRICS.collapseDistance);
        collapseProgress.value = progress;
        scheduleOnRN(syncScheduleScroll, y, progress);
      },
    },
    [reduceMotion, syncScheduleScroll],
  );

  const restHeadingStyle = useAnimatedStyle(() => {
    const progress = collapseProgress.value;
    return {
      height: headingNaturalHeight.value * (1 - progress),
      opacity: 1 - progress,
      transform: [
        { translateY: -PER_CHANNEL_VISUAL_METRICS.collapseTranslateY * progress },
      ],
    };
  });

  const scheduleGapStyle = useAnimatedStyle(() => ({
    height: PER_CHANNEL_VISUAL_METRICS.utilityToScheduleGap * (1 - collapseProgress.value),
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

  const handleHeadingLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const measured = event.nativeEvent.layout.height;
      if (measured > 0) headingNaturalHeight.value = measured;
    },
    [headingNaturalHeight],
  );

  const detectContextWrap = useCallback(() => {
    const dateY = contextDateYRef.current;
    const utilitiesY = contextUtilitiesYRef.current;
    if (dateY === null || utilitiesY === null) return;
    if (Math.abs(dateY - utilitiesY) > CONTEXT_WRAP_Y_EPSILON) setContextWrapped(true);
  }, []);

  const handleDateContextLayout = useCallback((event: LayoutChangeEvent) => {
    contextDateYRef.current = event.nativeEvent.layout.y;
    detectContextWrap();
  }, [detectContextWrap]);

  const handleUtilitiesLayout = useCallback((event: LayoutChangeEvent) => {
    contextUtilitiesYRef.current = event.nativeEvent.layout.y;
    detectContextWrap();
  }, [detectContextWrap]);

  if (!selectedChannel) return null;

  const contextMinHeight = condensed && contextWrapped
    ? PER_CHANNEL_VISUAL_METRICS.stickyContextWrappedHeight
    : PER_CHANNEL_VISUAL_METRICS.stickyContextHeight;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <GuideChrome
        condensed={condensed}
        presentationNavigation={headerAction}
        collapseProgress={collapseProgress}
      />

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

      <Animated.View
        testID="per-channel-rest-heading"
        pointerEvents={condensed ? 'none' : 'auto'}
        accessibilityElementsHidden={condensed}
        importantForAccessibility={condensed ? 'no-hide-descendants' : 'auto'}
        style={[styles.restHeadingClip, restHeadingStyle]}
      >
        <View onLayout={handleHeadingLayout} style={styles.channelContext}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[styles.channelName, { color: theme.colors.text }]}
          >
            {selectedChannel.displayName}
          </Text>
        </View>
      </Animated.View>

      <View
        testID={condensed ? 'per-channel-context-condensed' : 'per-channel-context-expanded'}
        style={[
          styles.contextRow,
          {
            minHeight: contextMinHeight,
            backgroundColor: theme.colors.background,
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
          style={[
            styles.utilityActions,
            contextWrapped ? styles.utilityActionsWrapped : null,
          ]}
        >
          <Pressable
            testID="per-channel-primetime"
            accessibilityRole="button"
            accessibilityLabel="Ga naar primetime, 20:30 op geselecteerde dag"
            onPress={scrollToPrimetime}
            style={({ pressed }) => [
              styles.utilityTouchTarget,
              {
                minHeight: minimumTouchTarget,
                opacity: pressed ? GUIDE_VISUAL_METRICS.controlPressOpacity : 1,
              },
            ]}
          >
            <View
              style={[
                styles.primetimeVisible,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <MoonGlyph
                color={theme.colors.textSecondary}
                maskColor={theme.colors.surfaceElevated}
              />
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={COMPACT_CHROME_MAX_FONT_SIZE_MULTIPLIER}
                style={[styles.utilityButtonText, { color: theme.colors.textSecondary }]}
              >
                Primetime
              </Text>
            </View>
          </Pressable>
          <Pressable
            testID="per-channel-now"
            accessibilityRole="button"
            accessibilityLabel="Ga naar nu"
            onPress={() => scrollToNow(true)}
            style={({ pressed }) => [
              styles.utilityTouchTarget,
              {
                minHeight: minimumTouchTarget,
                opacity: pressed ? GUIDE_VISUAL_METRICS.controlPressOpacity : 1,
              },
            ]}
          >
            <View style={[styles.nowVisible, { borderColor: theme.colors.border }]}> 
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={COMPACT_CHROME_MAX_FONT_SIZE_MULTIPLIER}
                style={[styles.utilityButtonText, { color: theme.colors.text }]}
              >
                Nu
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <Animated.View pointerEvents="none" style={scheduleGapStyle} />
      <View
        pointerEvents="none"
        testID="per-channel-schedule-boundary"
        style={[styles.scheduleBoundary, { backgroundColor: theme.colors.border }]}
      />

      <Animated.ScrollView
        ref={scheduleRef}
        testID="per-channel-schedule-scroll"
        bounces
        alwaysBounceVertical
        directionalLockEnabled
        nestedScrollEnabled
        decelerationRate="normal"
        showsVerticalScrollIndicator
        scrollEventThrottle={16}
        onScroll={scheduleScrollHandler}
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
              minuteHeight={minuteHeight}
              fontScale={effectiveFontScale}
              width={windowWidth}
              onSelectProgramme={onSelectProgramme}
            />
          ))}
        </ScrollView>
      </Animated.ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  channelStrip: {
    flexGrow: 0,
    height: PER_CHANNEL_VISUAL_METRICS.channelStripHeight,
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
  restHeadingClip: {
    overflow: 'hidden',
  },
  channelContext: {
    paddingHorizontal: GUIDE_VISUAL_METRICS.screenInsetX,
    paddingTop: PER_CHANNEL_VISUAL_METRICS.stripToHeadingGap,
    paddingBottom: PER_CHANNEL_VISUAL_METRICS.headingToUtilitiesGap,
  },
  channelName: {
    ...GUIDE_TYPOGRAPHY.selectedChannelHeading,
    letterSpacing: 0,
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
    minWidth: GUIDE_VISUAL_METRICS.touchTargetIos,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primetimeVisible: {
    height: PER_CHANNEL_VISUAL_METRICS.utilityVisibleHeight,
    paddingHorizontal: PER_CHANNEL_VISUAL_METRICS.primetimePaddingX,
    borderRadius: PER_CHANNEL_VISUAL_METRICS.utilityRadius,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PER_CHANNEL_VISUAL_METRICS.utilityIconGap,
  },
  nowVisible: {
    height: PER_CHANNEL_VISUAL_METRICS.utilityVisibleHeight,
    minWidth: PER_CHANNEL_VISUAL_METRICS.nowMinWidth,
    paddingHorizontal: PER_CHANNEL_VISUAL_METRICS.nowPaddingX,
    borderRadius: PER_CHANNEL_VISUAL_METRICS.utilityRadius,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonIconBox: {
    width: PER_CHANNEL_VISUAL_METRICS.utilityIconSize,
    height: PER_CHANNEL_VISUAL_METRICS.utilityIconSize,
  },
  moonCircle: {
    width: PER_CHANNEL_VISUAL_METRICS.utilityIconSize,
    height: PER_CHANNEL_VISUAL_METRICS.utilityIconSize,
    borderRadius: PER_CHANNEL_VISUAL_METRICS.utilityIconSize / 2,
    borderWidth: 1.5,
  },
  moonMask: {
    position: 'absolute',
    width: 10,
    height: 10,
    right: -2,
    top: -2,
    borderRadius: 5,
  },
  utilityButtonText: {
    ...GUIDE_TYPOGRAPHY.utility,
    letterSpacing: 0,
  },
  scheduleBoundary: {
    flexGrow: 0,
    height: StyleSheet.hairlineWidth,
    marginLeft: GUIDE_VISUAL_METRICS.screenInsetX,
  },
  programme: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  programmeStart: {
    position: 'absolute',
    left: GUIDE_VISUAL_METRICS.screenInsetX + PER_CHANNEL_VISUAL_METRICS.timeTextInsetX,
    width:
      PER_CHANNEL_VISUAL_METRICS.timeGutterWidth -
      PER_CHANNEL_VISUAL_METRICS.timeTextInsetX,
    ...GUIDE_TYPOGRAPHY.programmeStart,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  programmeContent: {
    position: 'absolute',
    left: PER_CHANNEL_VISUAL_METRICS.programmeColumnX,
    right: PER_CHANNEL_VISUAL_METRICS.programmeRightInset,
    overflow: 'hidden',
  },
  programmeTitle: {
    ...GUIDE_TYPOGRAPHY.programmeTitle,
    letterSpacing: 0,
  },
  programmeTitleCompact: {
    ...GUIDE_TYPOGRAPHY.programmeTitleCompact,
    letterSpacing: 0,
  },
  currentProgrammeTitle: {
    ...GUIDE_TYPOGRAPHY.currentProgrammeTitle,
    letterSpacing: 0,
  },
  currentProgrammeTitleCompact: {
    ...GUIDE_TYPOGRAPHY.currentProgrammeTitleCompact,
    letterSpacing: 0,
  },
  programmeDescription: {
    ...GUIDE_TYPOGRAPHY.currentDescription,
    marginTop: PER_CHANNEL_VISUAL_METRICS.descriptionGap,
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
    left: GUIDE_VISUAL_METRICS.screenInsetX,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
