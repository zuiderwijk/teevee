import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { GUIDE_PRESENTATIONS, type GuidePresentation } from './guidePresentation';
import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  PER_CHANNEL_TYPOGRAPHY,
  PER_CHANNEL_VISUAL_METRICS,
} from './perChannelVisualMetrics';

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
  const tabs = variant === 'tabs';

  return (
    <View
      testID="guide-presentation-selector"
      accessibilityRole="tablist"
      style={[
        tabs ? styles.tabsContainer : styles.pillContainer,
        tabs ? null : { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
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
              tabs ? styles.tabItem : styles.pillItem,
              tabs
                ? null
                : { backgroundColor: active ? theme.colors.accent : 'transparent' },
              {
                opacity: loading
                  ? 0.5
                  : pressed
                    ? PER_CHANNEL_VISUAL_METRICS.controlPressedOpacity
                    : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
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
                style={[styles.tabIndicator, { backgroundColor: theme.colors.currentTime }]}
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
    height: 52,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: PER_CHANNEL_VISUAL_METRICS.screenInsetX,
  },
  tabItem: {
    position: 'relative',
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInactiveLabel: {
    ...PER_CHANNEL_TYPOGRAPHY.presentationInactive,
  },
  tabSelectedLabel: {
    ...PER_CHANNEL_TYPOGRAPHY.presentationSelected,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 36,
    height: 2,
    borderRadius: 1,
  },
});
