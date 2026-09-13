import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

const SETTINGS_CONTROL_MAX_FONT_SIZE_MULTIPLIER = 1.2;

export function SettingsButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTeeveeTheme();

  return (
    <View pointerEvents="box-none" style={[styles.dock, { top: insets.top + 10 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open instellingen"
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <Text
          maxFontSizeMultiplier={SETTINGS_CONTROL_MAX_FONT_SIZE_MULTIPLIER}
          numberOfLines={1}
          style={[styles.label, { color: theme.colors.textSecondary }]}
        >
          Instellingen
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
  },
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
