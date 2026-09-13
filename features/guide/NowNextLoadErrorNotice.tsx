import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

type NowNextLoadErrorNoticeProps = {
  onRetry: () => void;
};

export function NowNextLoadErrorNotice({ onRetry }: NowNextLoadErrorNoticeProps) {
  const theme = useTeeveeTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Nu & Straks kon niet laden</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>De andere gidsweergaven blijven beschikbaar. Probeer Nu & Straks opnieuw te laden.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nu & Straks opnieuw laden"
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          {
            backgroundColor: theme.colors.accent,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <Text style={[styles.retryButtonText, { color: theme.colors.background }]}>Opnieuw proberen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 72,
    zIndex: 21,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  body: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  retryButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  retryButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
});
