import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { GUIDE_PRESENTATIONS, type GuidePresentation } from './guidePresentation';

const PRESENTATION_MAX_FONT_SIZE_MULTIPLIER = 1.15;

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

  return (
    <View
      testID="guide-presentation-selector"
      accessibilityRole="tablist"
      style={[styles.container, { borderBottomColor: theme.colors.border }]}
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
              { opacity: loading ? 0.5 : pressed ? 0.62 : 1 },
            ]}
          >
            <View style={styles.labelGroup}>
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={PRESENTATION_MAX_FONT_SIZE_MULTIPLIER}
                style={[
                  styles.label,
                  {
                    color: active ? theme.colors.text : theme.colors.textSecondary,
                    fontWeight: active ? '600' : '500',
                  },
                ]}
              >
                {loading ? 'Laden…' : presentation.label}
              </Text>
              {active ? (
                <View
                  pointerEvents="none"
                  style={[styles.activeIndicator, { backgroundColor: theme.colors.currentTime }]}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 6,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelGroup: {
    position: 'relative',
    alignSelf: 'center',
  },
  label: {
    fontSize: 15,
    lineHeight: 19,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -11,
    height: 2,
    borderRadius: 1,
  },
});
