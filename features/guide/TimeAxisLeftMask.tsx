import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { clippedTimeAxisLabelWidth } from './timeAxis';

type TimeAxisLeftMaskProps = {
  height: number;
  firstTickX: number;
  tickSpacing: number;
  labelWidth: number;
  backgroundColor: string;
  scrollX: SharedValue<number>;
};

export function TimeAxisLeftMask({
  height,
  firstTickX,
  tickSpacing,
  labelWidth,
  backgroundColor,
  scrollX,
}: TimeAxisLeftMaskProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: clippedTimeAxisLabelWidth(scrollX.value, firstTickX, tickSpacing, labelWidth),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mask,
        {
          height: Math.max(0, height - 1),
          backgroundColor,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 4,
  },
});
