import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

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
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: left >= scrollX.value ? 1 : 0,
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
    paddingLeft: 6,
    paddingTop: 11,
  },
  tickLabel: { fontSize: 10, fontWeight: '600' },
});
