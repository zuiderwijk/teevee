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
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
};

type EdgeRowProps = {
  edge: EdgeReadableProgramme | null;
  rowIndex: number;
  rowHeight: number;
  viewportWidth: number;
  largeText: boolean;
  scrollX: SharedValue<number>;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
};

function EdgeRow({
  edge,
  rowIndex,
  rowHeight,
  viewportWidth,
  largeText,
  scrollX,
  textColor,
  backgroundColor,
  borderColor,
}: EdgeRowProps) {
  const startX = edge?.frame.left ?? 0;
  const endX = edge ? edge.frame.left + edge.frame.width : 0;
  const hasEdge = edge !== null;
  const contentMode = edge ? programmeContentMode(edge.frame.width) : 'compact';
  const horizontalPadding = contentMode === 'compact' ? 5 : 8;

  const animatedStyle = useAnimatedStyle(() => {
    if (!hasEdge) return { width: 0, opacity: 0 };

    const x = scrollX.value;
    const remaining = Math.max(0, endX - x);
    const width = Math.min(viewportWidth, remaining);
    const active = x > startX && x < endX;

    return {
      width,
      opacity: active && width >= MIN_READABLE_TEXT_WIDTH ? 1 : 0,
    };
  }, [endX, hasEdge, startX, viewportWidth]);

  return (
    <Animated.View
      style={[
        styles.edgeMask,
        {
          top: rowIndex * rowHeight,
          height: rowHeight,
          paddingHorizontal: horizontalPadding,
          backgroundColor,
          borderRightColor: borderColor,
        },
        animatedStyle,
      ]}
    >
      <Text
        numberOfLines={largeText ? 2 : contentMode === 'comfortable' ? 2 : 1}
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
            scrollX={scrollX}
            textColor={theme.colors.text}
            backgroundColor={theme.colors.background}
            borderColor={theme.colors.border}
          />
        ))}
      </Animated.View>
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
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  titleCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  titleLargeText: {
    fontSize: 13,
    lineHeight: 17,
  },
});
