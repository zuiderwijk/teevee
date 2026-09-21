import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER } from './guideVisualMetrics';
import { GUIDE_TIME_TICK_LABEL_OFFSET } from './timeAxis';
import { TOTAAL_TYPOGRAPHY } from './totaal';

type TimeAxisTickProps = {
  left: number;
  label: string;
  labelWidth: number;
  labelColor: string;
  tickColor: string;
  major: boolean;
  tickHeight: number;
  tickOpacity: number;
};

export const TimeAxisTick = memo(function TimeAxisTick({
  left,
  label,
  labelWidth,
  labelColor,
  tickColor,
  major,
  tickHeight,
  tickOpacity,
}: TimeAxisTickProps) {
  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={[styles.tickAnchor, { left }]}
    >
      {major ? (
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
          style={[
            styles.tickLabel,
            { width: labelWidth, color: labelColor },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.tickMark,
          {
            height: tickHeight,
            backgroundColor: tickColor,
            opacity: tickOpacity,
          },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  tickAnchor: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  tickLabel: {
    position: 'absolute',
    top: 6,
    left: GUIDE_TIME_TICK_LABEL_OFFSET,
    ...TOTAAL_TYPOGRAPHY.axisLabel,
  },
  tickMark: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 1,
  },
});
