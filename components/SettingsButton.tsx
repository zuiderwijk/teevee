import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

// Keep this secondary compact control readable while headers reflow around it.
const SETTINGS_CONTROL_MAX_FONT_SIZE_MULTIPLIER = 1.2;

export function SettingsButton() {
  const router = useRouter();
  const theme = useTeeveeTheme();

  return (
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
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
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
