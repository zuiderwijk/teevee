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
      accessibilityRole="tablist"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {GUIDE_PRESENTATIONS.map((presentation) => {
        const active = presentation.id === selected;
        const loading = presentation.id === loadingPresentation;

        return (
          <Pressable
            key={presentation.id}
            accessibilityRole="tab"
            accessibilityLabel={`${presentation.label}-weergave`}
            accessibilityState={{ selected: active, busy: loading }}
            disabled={loading}
            onPress={() => onSelect(presentation.id)}
            style={({ pressed }) => [
              styles.item,
              {
                backgroundColor: active ? theme.colors.accent : 'transparent',
                opacity: loading ? 0.5 : pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              style={[
                styles.label,
                { color: active ? theme.colors.background : theme.colors.textSecondary },
              ]}
            >
              {loading ? 'Laden…' : presentation.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
  },
  item: {
    minHeight: 40,
    minWidth: 88,
    paddingHorizontal: 13,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
