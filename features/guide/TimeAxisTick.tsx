import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { GUIDE_TIME_TICK_LABEL_OFFSET, timeAxisLabelOpacity } from './timeAxis';

type TimeAxisTickProps = {
  left: number;
  label: string;
  labelWidth: number;
  labelColor: string;
  borderColor: string;
  scrollX: SharedValue<number>;
};

export function TimeAxisTick({
  left,
  label,
  labelWidth,
  labelColor,
  borderColor,
  scrollX,
}: TimeAxisTickProps) {
  const labelStartX = left + GUIDE_TIME_TICK_LABEL_OFFSET;
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: timeAxisLabelOpacity(labelStartX, scrollX.value),
  }));

  return (
    <View style={[styles.tick, { left, borderLeftColor: borderColor }]}>
      <Animated.Text
        numberOfLines={1}
        style={[styles.tickLabel, { width: labelWidth, color: labelColor }, labelAnimatedStyle]}
      >
        {label}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: GUIDE_TIME_TICK_LABEL_OFFSET,
    paddingTop: 11,
  },
  tickLabel: { fontSize: 10, fontWeight: '600' },
});
