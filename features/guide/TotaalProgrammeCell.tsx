import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isProgrammeCurrent, type Channel, type Programme } from '@/data/domain/epg';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import type { ProgrammeSelection } from './detailState';
import { formatGuideTime } from './guideRenderData';
import { programmeFrame } from './geometry';
import {
  TOTAAL_TYPOGRAPHY,
  TOTAAL_VISUAL_METRICS,
  totaalProgrammeContentPresentation,
  totaalProgrammePressBackgroundColor,
  totaalProgrammeSecondaryLabel,
} from './totaal';
import { totaalIsMicroProgrammeFrameWidth } from './totaalMicroProgrammes';

type TotaalProgrammeCellProps = {
  channel: Channel;
  programme: Programme;
  nowMs: number;
  windowStartMs: number;
  minuteWidth: number;
  fontScale: number;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

export const TotaalProgrammeCell = memo(function TotaalProgrammeCell({
  channel,
  programme,
  nowMs,
  windowStartMs,
  minuteWidth,
  fontScale,
  onSelectProgramme,
}: TotaalProgrammeCellProps) {
  const theme = useTeeveeTheme();
  const frame = programmeFrame(programme, windowStartMs, minuteWidth);
  const startMs = Date.parse(programme.startAt);
  const endMs = Date.parse(programme.endAt);
  const current = isProgrammeCurrent(programme, nowMs);
  const microcell = totaalIsMicroProgrammeFrameWidth(frame.width, fontScale);
  const content = totaalProgrammeContentPresentation(frame.width);
  const accessibilityStatus = current ? ', nu bezig' : '';
  const secondary = totaalProgrammeSecondaryLabel(
    current,
    formatGuideTime(startMs),
    formatGuideTime(endMs),
  );

  return (
    <Pressable
      testID={`programme-${programme.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${channel.displayName}, ${programme.title}, ${formatGuideTime(startMs)} tot ${formatGuideTime(endMs)}${accessibilityStatus}`}
      accessibilityHint="Opent programmadetails"
      onPress={() => onSelectProgramme({ programme, channel })}
      style={({ pressed }) => [
        styles.programme,
        {
          left: frame.left,
          width: frame.width,
          paddingHorizontal: microcell ? 0 : content.paddingX,
          backgroundColor: totaalProgrammePressBackgroundColor(
            pressed,
            theme.colors.surfaceElevated,
          ),
        },
      ]}
    >
      {microcell ? null : (
        <View style={styles.programmeTextContent}>
          <Text
            testID={`totaal-programme-title-${programme.id}`}
            numberOfLines={content.titleLines}
            ellipsizeMode="tail"
            style={[
              current ? styles.currentProgrammeTitle : styles.programmeTitle,
              { color: theme.colors.text },
            ]}
          >
            {programme.title}
          </Text>
          {content.showSecondary ? (
            <Text
              testID={`totaal-programme-secondary-${programme.id}`}
              numberOfLines={1}
              style={[
                styles.programmeSecondary,
                { color: theme.colors.textSecondary },
              ]}
            >
              {secondary}
            </Text>
          ) : null}
        </View>
      )}
      <View
        testID={`totaal-programme-boundary-${programme.id}`}
        pointerEvents="none"
        style={[
          styles.programmeBoundary,
          {
            backgroundColor: theme.colors.border,
            opacity: TOTAAL_VISUAL_METRICS.programmeBoundaryOpacity,
          },
        ]}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  programme: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  programmeTextContent: {
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'center',
  },
  programmeTitle: {
    ...TOTAAL_TYPOGRAPHY.programmeTitle,
  },
  currentProgrammeTitle: {
    ...TOTAAL_TYPOGRAPHY.currentProgrammeTitle,
  },
  programmeSecondary: {
    ...TOTAAL_TYPOGRAPHY.programmeSecondary,
    marginTop: 3,
  },
  programmeBoundary: {
    position: 'absolute',
    right: 0,
    top: TOTAAL_VISUAL_METRICS.programmeBoundaryInsetY,
    bottom: TOTAAL_VISUAL_METRICS.programmeBoundaryInsetY,
    width: TOTAAL_VISUAL_METRICS.programmeBoundaryWidth,
  },
});
