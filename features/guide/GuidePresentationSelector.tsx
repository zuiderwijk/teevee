import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_TYPOGRAPHY,
  GUIDE_VISUAL_METRICS,
  guidePresentationNavigationMetrics,
} from './guideVisualMetrics';
import { GUIDE_PRESENTATIONS, type GuidePresentation } from './guidePresentation';

type GuidePresentationSelectorProps = {
  selected: GuidePresentation;
  loadingPresentation?: GuidePresentation | null;
  onSelect: (presentation: GuidePresentation) => void;
  variant?: 'pill' | 'tabs';
};

export function GuidePresentationSelector({
  selected,
  loadingPresentation = null,
  onSelect,
  variant = 'pill',
}: GuidePresentationSelectorProps) {
  const theme = useTeeveeTheme();
  const { width, fontScale = 1 } = useWindowDimensions();
  const tabs = variant === 'tabs';
  const presentationNavigation = guidePresentationNavigationMetrics(fontScale);
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
      style={[
        tabs ? styles.tabsContainer : styles.pillContainer,
        tabs ? { height: presentationNavigation.height } : { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
      ]}
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
              tabs ? [styles.tabItem, { minHeight: presentationNavigation.height }] : styles.pillItem,
              tabs
                ? null
                : { backgroundColor: active ? theme.colors.accent : 'transparent' },
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
              numberOfLines={tabs ? presentationNavigation.maxLines : 1}
              maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
              style={[
                tabs
                  ? active
                    ? styles.tabSelectedLabel
                    : styles.tabInactiveLabel
                  : styles.pillLabel,
                {
                  color: tabs
                    ? active
                      ? theme.colors.text
                      : theme.colors.textSecondary
                    : active
                      ? theme.colors.background
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {loading ? 'Laden…' : presentation.label}
            </Text>
            {tabs && active ? (
              <View
                pointerEvents="none"
                testID="guide-presentation-active-indicator"
                style={[
                  styles.tabIndicator,
                  { width: indicatorWidth, backgroundColor: theme.colors.currentTime },
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
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
  },
  pillItem: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: 13,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontFamily: TEEVEE_FONT_FAMILIES.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  tabsContainer: {
    width: '100%',
    height: GUIDE_VISUAL_METRICS.presentationNavHeight,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: GUIDE_VISUAL_METRICS.screenInsetX,
  },
  tabItem: {
    position: 'relative',
    flex: 1,
    minHeight: GUIDE_VISUAL_METRICS.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInactiveLabel: {
    ...GUIDE_TYPOGRAPHY.presentationInactive,
    letterSpacing: 0,
  },
  tabSelectedLabel: {
    ...GUIDE_TYPOGRAPHY.presentationSelected,
    letterSpacing: 0,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: GUIDE_VISUAL_METRICS.presentationIndicatorHeight,
    borderRadius: GUIDE_VISUAL_METRICS.presentationIndicatorRadius,
  },
});
