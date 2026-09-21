import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import {
  isProgrammeCurrent,
  type GuideFixture,
  type Programme,
} from '@/data/domain/epg';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  edgeBoundaryBucket,
  edgeBoundaryXs,
  edgeReadableProgramme,
  type EdgeReadableProgramme,
} from './edgeReadability';
import { formatGuideTime } from './guideRenderData';
import { programmeFrame } from './geometry';
import type { GuideLayoutMetrics } from './layout';
import {
  TOTAAL_PROGRAMME_READABILITY_THRESHOLDS,
  TOTAAL_TYPOGRAPHY,
  TOTAAL_VISUAL_METRICS,
  totaalProgrammeContentPresentation,
  totaalStableScrollVisuals,
} from './totaal';

const MIN_READABLE_TEXT_WIDTH = 16;

type EdgeReadabilityOverlayProps = {
  fixture: GuideFixture;
  layout: GuideLayoutMetrics;
  windowStart: number;
  viewportWidth: number;
  nowMs: number;
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
  contentTopInset: number;
  collapseProgress: SharedValue<number>;
  fontScale: number;
};

type EdgeRowProps = {
  edge: EdgeReadableProgramme | null;
  rowIndex: number;
  rowHeight: number;
  viewportWidth: number;
  nowMs: number;
  scrollX: SharedValue<number>;
  textColor: string;
  secondaryTextColor: string;
  canvasColor: string;
  boundaryColor: string;
};

function EdgeRow({
  edge,
  rowIndex,
  rowHeight,
  viewportWidth,
  nowMs,
  scrollX,
  textColor,
  secondaryTextColor,
  canvasColor,
  boundaryColor,
}: EdgeRowProps) {
  const startX = edge?.frame.left ?? 0;
  const endX = edge ? edge.frame.left + edge.frame.width : 0;
  const hasEdge = edge !== null;
  const presentation = totaalProgrammeContentPresentation(edge?.visibleWidth ?? 0);
  const isCurrent = edge !== null && isProgrammeCurrent(edge.programme, nowMs);
  const startMs = edge ? Date.parse(edge.programme.startAt) : 0;
  const endMs = edge ? Date.parse(edge.programme.endAt) : 0;
  const secondary = isCurrent
    ? `tot ${formatGuideTime(endMs)}`
    : formatGuideTime(startMs);

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

  const boundaryStyle = useAnimatedStyle(() => {
    if (!hasEdge) return { opacity: 0 };
    const x = scrollX.value;
    const remaining = Math.max(0, endX - x);
    const active = x > startX && x < endX;
    const endVisible = remaining <= viewportWidth;
    return {
      opacity:
        active && endVisible
          ? TOTAAL_VISUAL_METRICS.programmeBoundaryOpacity
          : 0,
    };
  }, [endX, hasEdge, startX, viewportWidth]);

  return (
    <Animated.View
      style={[
        styles.edgeMask,
        {
          top: rowIndex * rowHeight,
          height: Math.max(0, rowHeight - 1),
          paddingHorizontal: presentation.paddingX,
          backgroundColor: canvasColor,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.textContent}>
        <Text
          numberOfLines={presentation.titleLines}
          ellipsizeMode="tail"
          style={[
            isCurrent ? styles.currentTitle : styles.title,
            { color: textColor },
          ]}
        >
          {edge?.programme.title ?? ''}
        </Text>
        {presentation.showSecondary && edge ? (
          <Text
            numberOfLines={1}
            style={[styles.secondary, { color: secondaryTextColor }]}
          >
            {secondary}
          </Text>
        ) : null}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.boundary,
          { backgroundColor: boundaryColor },
          boundaryStyle,
        ]}
      />
    </Animated.View>
  );
}

export function EdgeReadabilityOverlay({
  fixture,
  layout,
  windowStart,
  viewportWidth,
  nowMs,
  scrollX,
  scrollY,
  contentTopInset,
  collapseProgress,
  fontScale,
}: EdgeReadabilityOverlayProps) {
  const theme = useTeeveeTheme();

  const programmesByChannel = useMemo(() => {
    const map = new Map<string, Programme[]>();
    for (const channel of fixture.channels) map.set(channel.id, []);
    for (const programme of fixture.programmes) {
      map.get(programme.channelId)?.push(programme);
    }
    return map;
  }, [fixture]);

  const boundaries = useMemo(() => {
    const boundarySet = new Set(
      edgeBoundaryXs(
        fixture.programmes,
        windowStart,
        layout.minuteWidth,
      ),
    );
    for (const programme of fixture.programmes) {
      const frame = programmeFrame(programme, windowStart, layout.minuteWidth);
      const frameEnd = frame.left + frame.width;
      for (const threshold of TOTAAL_PROGRAMME_READABILITY_THRESHOLDS) {
        const thresholdX = frameEnd - threshold;
        if (thresholdX > frame.left && thresholdX < frameEnd) {
          boundarySet.add(thresholdX);
        }
      }
    }
    return [...boundarySet].sort((left, right) => left - right);
  }, [fixture.programmes, layout.minuteWidth, windowStart]);

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
    [
      fixture.channels,
      layout.minuteWidth,
      programmesByChannel,
      viewportWidth,
      windowStart,
    ],
  );

  const [activeEdges, setActiveEdges] = useState<Array<EdgeReadableProgramme | null>>(
    () => buildEdges(0),
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
    transform: [
      {
        translateY:
          contentTopInset -
          scrollY.value +
          totaalStableScrollVisuals(
            collapseProgress.value,
            fontScale,
          ).contentTranslateY,
      },
    ],
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
          {
            height: fixture.channels.length * layout.rowHeight,
          },
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
            nowMs={nowMs}
            scrollX={scrollX}
            textColor={theme.colors.text}
            secondaryTextColor={theme.colors.textSecondary}
            canvasColor={theme.colors.background}
            boundaryColor={theme.colors.border}
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
  },
  textContent: {
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'center',
  },
  title: {
    ...TOTAAL_TYPOGRAPHY.programmeTitle,
  },
  currentTitle: {
    ...TOTAAL_TYPOGRAPHY.currentProgrammeTitle,
  },
  secondary: {
    ...TOTAAL_TYPOGRAPHY.programmeSecondary,
    marginTop: 3,
  },
  boundary: {
    position: 'absolute',
    right: 0,
    top: TOTAAL_VISUAL_METRICS.programmeBoundaryInsetY,
    bottom: TOTAAL_VISUAL_METRICS.programmeBoundaryInsetY,
    width: TOTAAL_VISUAL_METRICS.programmeBoundaryWidth,
  },
});
