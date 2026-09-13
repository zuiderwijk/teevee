import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { GuideFixture, Programme } from '@/data/domain/epg';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  edgeBoundaryBucket,
  edgeBoundaryXs,
  edgeReadableProgramme,
  type EdgeReadableProgramme,
} from './edgeReadability';
import { programmeContentMode } from './geometry';
import type { GuideLayoutMetrics } from './layout';

const MIN_READABLE_TEXT_WIDTH = 16;

type EdgeReadabilityOverlayProps = {
  fixture: GuideFixture;
  layout: GuideLayoutMetrics;
  windowStart: number;
  viewportWidth: number;
  nowMs: number;
  nowX: number;
  nowInWindow: boolean;
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
};

type EdgeRowProps = {
  edge: EdgeReadableProgramme | null;
  rowIndex: number;
  rowHeight: number;
  viewportWidth: number;
  largeText: boolean;
  nowMs: number;
  scrollX: SharedValue<number>;
  textColor: string;
  programmeColor: string;
  currentProgrammeColor: string;
};

function EdgeRow({
  edge,
  rowIndex,
  rowHeight,
  viewportWidth,
  largeText,
  nowMs,
  scrollX,
  textColor,
  programmeColor,
  currentProgrammeColor,
}: EdgeRowProps) {
  const startX = edge?.frame.left ?? 0;
  const endX = edge ? edge.frame.left + edge.frame.width : 0;
  const hasEdge = edge !== null;
  const contentMode = edge ? programmeContentMode(edge.frame.width) : 'compact';
  const horizontalPadding = contentMode === 'compact' ? 5 : 8;
  const startMs = edge ? Date.parse(edge.programme.startAt) : 0;
  const endMs = edge ? Date.parse(edge.programme.endAt) : 0;
  const isCurrent = hasEdge && nowMs >= startMs && nowMs < endMs;
  const leavesProgressVisible = isCurrent && contentMode !== 'compact';
  const topInset = leavesProgressVisible ? 14 : 4;
  const bottomInset = 4;

  const animatedStyle = useAnimatedStyle(() => {
    if (!hasEdge) return { width: 0, opacity: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 };

    const x = scrollX.value;
    const remaining = Math.max(0, endX - x);
    const width = Math.min(viewportWidth, remaining);
    const active = x > startX && x < endX;
    const endVisible = remaining <= viewportWidth;

    return {
      width,
      opacity: active && width >= MIN_READABLE_TEXT_WIDTH ? 1 : 0,
      borderTopRightRadius: endVisible && !leavesProgressVisible ? 8 : 0,
      borderBottomRightRadius: endVisible ? 8 : 0,
    };
  }, [endX, hasEdge, leavesProgressVisible, startX, viewportWidth]);

  return (
    <Animated.View
      style={[
        styles.edgeMask,
        {
          top: rowIndex * rowHeight + topInset,
          height: Math.max(0, rowHeight - topInset - bottomInset),
          paddingHorizontal: horizontalPadding,
          paddingVertical: contentMode === 'compact' ? 6 : 7,
          backgroundColor: isCurrent ? currentProgrammeColor : programmeColor,
        },
        animatedStyle,
      ]}
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.title,
          contentMode === 'compact' ? styles.titleCompact : null,
          largeText ? styles.titleLargeText : null,
          { color: textColor },
        ]}
      >
        {edge?.programme.title ?? ''}
      </Text>
    </Animated.View>
  );
}

export function EdgeReadabilityOverlay({
  fixture,
  layout,
  windowStart,
  viewportWidth,
  nowMs,
  nowX,
  nowInWindow,
  scrollX,
  scrollY,
}: EdgeReadabilityOverlayProps) {
  const theme = useTeeveeTheme();

  const programmesByChannel = useMemo(() => {
    const map = new Map<string, Programme[]>();
    for (const channel of fixture.channels) map.set(channel.id, []);
    for (const programme of fixture.programmes) map.get(programme.channelId)?.push(programme);
    return map;
  }, [fixture]);

  const boundaries = useMemo(
    () => edgeBoundaryXs(fixture.programmes, windowStart, layout.minuteWidth),
    [fixture.programmes, layout.minuteWidth, windowStart],
  );

  const buildEdges = useCallback(
    (viewportX: number) =>
      fixture.channels.map((channel) =>
        edgeReadableProgramme(
          programmesByChannel.get(channel.id) ?? [],
          viewportX,
          viewportWidth,
          windowStart,
          layout.minuteWidth,
        ),
      ),
    [fixture.channels, layout.minuteWidth, programmesByChannel, viewportWidth, windowStart],
  );

  const [activeEdges, setActiveEdges] = useState<Array<EdgeReadableProgramme | null>>(() =>
    buildEdges(0),
  );

  const syncEdgesForX = useCallback(
    (viewportX: number) => {
      setActiveEdges(buildEdges(viewportX));
    },
    [buildEdges],
  );

  useEffect(() => {
    syncEdgesForX(scrollX.value);
  }, [scrollX, syncEdgesForX]);

  useAnimatedReaction(
    () => edgeBoundaryBucket(boundaries, scrollX.value),
    (bucket, previousBucket) => {
      if (bucket === previousBucket) return;
      scheduleOnRN(syncEdgesForX, scrollX.value);
    },
    [boundaries, syncEdgesForX],
  );

  const gridStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value }],
  }));

  const currentTimeStyle = useAnimatedStyle(() => {
    const left = nowX - scrollX.value;
    return {
      opacity: nowInWindow && left >= 0 && left <= viewportWidth ? 1 : 0,
      transform: [{ translateX: left }],
    };
  }, [nowInWindow, nowX, viewportWidth]);

  return (
    <View
      testID="guide-edge-readability-overlay"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.overlay}
    >
      <Animated.View
        style={[
          styles.grid,
          { height: fixture.channels.length * layout.rowHeight },
          gridStyle,
        ]}
      >
        {fixture.channels.map((channel, rowIndex) => (
          <EdgeRow
            key={channel.id}
            edge={activeEdges[rowIndex] ?? null}
            rowIndex={rowIndex}
            rowHeight={layout.rowHeight}
            viewportWidth={viewportWidth}
            largeText={layout.largeText}
            nowMs={nowMs}
            scrollX={scrollX}
            textColor={theme.colors.text}
            programmeColor={theme.colors.programme}
            currentProgrammeColor={theme.colors.programmeCurrent}
          />
        ))}
      </Animated.View>

      {nowInWindow ? (
        <Animated.View
          style={[
            styles.currentTimeLine,
            { backgroundColor: theme.colors.currentTime },
            currentTimeStyle,
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 3,
  },
  grid: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
  },
  edgeMask: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  title: { fontSize: 12, fontWeight: '600' },
  titleCompact: { fontSize: 10 },
  titleLargeText: { fontSize: 12 },
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 4,
  },
});
