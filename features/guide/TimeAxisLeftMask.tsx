import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { clippedTimeAxisLabelWidth } from './timeAxis';

type TimeAxisLeftMaskProps = {
  left: number;
  height: number;
  firstTickX: number;
  tickSpacing: number;
  labelWidth: number;
  backgroundColor: string;
  borderBottomColor: string;
  scrollX: SharedValue<number>;
};

export function TimeAxisLeftMask({
  left,
  height,
  firstTickX,
  tickSpacing,
  labelWidth,
  backgroundColor,
  borderBottomColor,
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
          left,
          height,
          backgroundColor,
          borderBottomColor,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    top: 0,
    zIndex: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
