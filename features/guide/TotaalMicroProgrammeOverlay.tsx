import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { timeToX } from './geometry';
import {
  TOTAAL_TYPOGRAPHY,
  totaalStableScrollVisuals,
} from './totaal';
import {
  TOTAAL_MICRO_PROGRAMME_INSET_X,
  type TotaalRepeatedTitleRun,
  type TotaalRepeatedTitleRunPresentation,
  totaalRepeatedRunVisibleLayout,
} from './totaalMicroProgrammes';

type TotaalMicroProgrammeOverlayProps = {
  runPresentations: readonly TotaalRepeatedTitleRunPresentation[];
  channelRowIndex: ReadonlyMap<string, number>;
  windowStartMs: number;
  minuteWidth: number;
  rowHeight: number;
  viewportWidth: number;
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
  contentTopInset: number;
  collapseProgress: SharedValue<number>;
  fontScale: number;
  reduceMotion: boolean;
};

type RepeatedTitleRunOverlayProps = {
  run: TotaalRepeatedTitleRun;
  rowIndex: number;
  windowStartMs: number;
  minuteWidth: number;
  rowHeight: number;
  viewportWidth: number;
  scrollX: SharedValue<number>;
  fontScale: number;
  textColor: string;
};

const RepeatedTitleRunOverlay = memo(function RepeatedTitleRunOverlay({
  run,
  rowIndex,
  windowStartMs,
  minuteWidth,
  rowHeight,
  viewportWidth,
  scrollX,
  fontScale,
  textColor,
}: RepeatedTitleRunOverlayProps) {
  const runStartX = timeToX(run.startMs, windowStartMs, minuteWidth);
  const runEndX = timeToX(run.endMs, windowStartMs, minuteWidth);

  const outerStyle = useAnimatedStyle(() => {
    const layout = totaalRepeatedRunVisibleLayout(
      runStartX,
      runEndX,
      scrollX.value,
      viewportWidth,
      fontScale,
    );
    return {
      width: layout.visibleWidth,
      opacity: layout.visibleWidth > 0 ? 1 : 0,
      transform: [{ translateX: layout.viewportOffsetX }],
    };
  }, [fontScale, runEndX, runStartX, viewportWidth]);

  const sharedTitleStyle = useAnimatedStyle(() => {
    const layout = totaalRepeatedRunVisibleLayout(
      runStartX,
      runEndX,
      scrollX.value,
      viewportWidth,
      fontScale,
    );
    return {
      opacity: layout.showSharedTitle ? 1 : 0,
    };
  }, [fontScale, runEndX, runStartX, viewportWidth]);

  return (
    <Animated.View
      testID={`totaal-repeated-run-${run.id}`}
      pointerEvents="none"
      accessible={false}
      style={[
        styles.runViewport,
        {
          top: rowIndex * rowHeight,
          height: rowHeight,
        },
        outerStyle,
      ]}
    >
      <Animated.View
        testID={`totaal-repeated-title-${run.id}`}
        pointerEvents="none"
        accessible={false}
        style={[styles.sharedTitle, sharedTitleStyle]}
      >
        <Text
          accessible={false}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.sharedTitleText, { color: textColor }]}
        >
          {run.title}
        </Text>
      </Animated.View>
    </Animated.View>
  );
});

export const TotaalMicroProgrammeOverlay = memo(function TotaalMicroProgrammeOverlay({
  runPresentations,
  channelRowIndex,
  windowStartMs,
  minuteWidth,
  rowHeight,
  viewportWidth,
  scrollX,
  scrollY,
  contentTopInset,
  collapseProgress,
  fontScale,
  reduceMotion,
}: TotaalMicroProgrammeOverlayProps) {
  const theme = useTeeveeTheme();

  const gridStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          contentTopInset -
          scrollY.value +
          totaalStableScrollVisuals(
            collapseProgress.value,
            fontScale,
            scrollY.value,
            reduceMotion,
          ).contentTranslateY,
      },
    ],
  }));

  return (
    <View
      testID="totaal-micro-programme-overlay"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.overlay}
    >
      <Animated.View style={[styles.grid, gridStyle]}>
        {runPresentations.map(({ run, programmes }) => {
          const rowIndex = channelRowIndex.get(run.channelId);
          return rowIndex === undefined || programmes.length === 0 ? null : (
            <RepeatedTitleRunOverlay
              key={run.id}
              run={run}
              rowIndex={rowIndex}
              windowStartMs={windowStartMs}
              minuteWidth={minuteWidth}
              rowHeight={rowHeight}
              viewportWidth={viewportWidth}
              scrollX={scrollX}
              fontScale={fontScale}
              textColor={theme.colors.text}
            />
          );
        })}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 4,
  },
  grid: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  runViewport: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
  sharedTitle: {
    position: 'absolute',
    left: TOTAAL_MICRO_PROGRAMME_INSET_X,
    right: 0,
    top: 0,
    bottom: 0,
    minWidth: 0,
    justifyContent: 'center',
  },
  sharedTitleText: {
    ...TOTAAL_TYPOGRAPHY.programmeTitle,
  },
});
