import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  COMPACT_CHROME_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_TYPOGRAPHY,
  GUIDE_VISUAL_METRICS,
} from './guideVisualMetrics';
import { GUIDE_PRESENTATIONS, type GuidePresentation } from './guidePresentation';

type GuidePresentationSelectorProps = {
  selected: GuidePresentation;
  loadingPresentation?: GuidePresentation | null;
  onSelect: (presentation: GuidePresentation) => void;
};

export function GuidePresentationSelector({
  selected,
  loadingPresentation = null,
  onSelect,
}: GuidePresentationSelectorProps) {
  const theme = useTeeveeTheme();
  const { width } = useWindowDimensions();
  const tabWidth = Math.max(
    0,
    (width - GUIDE_VISUAL_METRICS.screenInsetX * 2) / GUIDE_PRESENTATIONS.length,
  );
  const indicatorWidth = Math.min(
    GUIDE_VISUAL_METRICS.presentationIndicatorWidth,
    Math.max(0, tabWidth - 16),
  );

  return (
    <View
      testID="guide-presentation-selector"
      accessibilityRole="tablist"
      style={styles.container}
    >
      {GUIDE_PRESENTATIONS.map((presentation) => {
        const active = presentation.id === selected;
        const loading = presentation.id === loadingPresentation;

        return (
          <Pressable
            key={presentation.id}
            testID={`guide-presentation-${presentation.id}`}
            accessibilityRole="tab"
            accessibilityLabel={`${presentation.label}-weergave`}
            accessibilityState={{ selected: active, busy: loading }}
            disabled={loading}
            onPress={() => onSelect(presentation.id)}
            style={({ pressed }) => [
              styles.item,
              {
                opacity: loading
                  ? GUIDE_VISUAL_METRICS.disabledOpacity
                  : pressed
                    ? GUIDE_VISUAL_METRICS.controlPressOpacity
                    : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={COMPACT_CHROME_MAX_FONT_SIZE_MULTIPLIER}
              style={[
                active ? styles.selectedLabel : styles.inactiveLabel,
                { color: active ? theme.colors.text : theme.colors.textSecondary },
              ]}
            >
              {loading ? 'Laden…' : presentation.label}
            </Text>
            {active ? (
              <View
                pointerEvents="none"
                testID="guide-presentation-active-indicator"
                style={[
                  styles.activeIndicator,
                  {
                    width: indicatorWidth,
                    backgroundColor: theme.colors.currentTime,
                  },
                ]}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: GUIDE_VISUAL_METRICS.presentationNavHeight,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: GUIDE_VISUAL_METRICS.screenInsetX,
  },
  item: {
    position: 'relative',
    flex: 1,
    minHeight: GUIDE_VISUAL_METRICS.presentationNavHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveLabel: {
    ...GUIDE_TYPOGRAPHY.presentationInactive,
    letterSpacing: 0,
  },
  selectedLabel: {
    ...GUIDE_TYPOGRAPHY.presentationSelected,
    letterSpacing: 0,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    height: GUIDE_VISUAL_METRICS.presentationIndicatorHeight,
    borderRadius: GUIDE_VISUAL_METRICS.presentationIndicatorRadius,
  },
});
