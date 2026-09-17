import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GUIDE_TIME_TICK_LABEL_OFFSET } from './timeAxis';

const TIME_LABEL_MAX_FONT_SIZE_MULTIPLIER = 1.2;

type TimeAxisTickProps = {
  left: number;
  label: string;
  labelWidth: number;
  labelColor: string;
  borderColor: string;
};

export const TimeAxisTick = memo(function TimeAxisTick({
  left,
  label,
  labelWidth,
  labelColor,
  borderColor,
}: TimeAxisTickProps) {
  return (
    <View style={[styles.tick, { left, borderLeftColor: borderColor }]}>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={TIME_LABEL_MAX_FONT_SIZE_MULTIPLIER}
        style={[styles.tickLabel, { width: labelWidth, color: labelColor }]}
      >
        {label}
      </Text>
    </View>
  );
});

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
  tickLabel: { fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
