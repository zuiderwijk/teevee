import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

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
              { opacity: loading ? 0.5 : pressed ? 0.68 : 1 },
            ]}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              style={[
                styles.label,
                {
                  color: active ? theme.colors.text : theme.colors.textSecondary,
                  fontWeight: active ? '700' : '500',
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
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  item: {
    position: 'relative',
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    lineHeight: 20,
  },
  activeIndicator: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: -StyleSheet.hairlineWidth,
    height: 3,
    borderRadius: 2,
  },
});
