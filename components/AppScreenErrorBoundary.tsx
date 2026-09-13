import type { ErrorBoundaryProps } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

export function AppScreenErrorBoundary({ retry }: ErrorBoundaryProps) {
  const theme = useTeeveeTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text accessible={false} style={[styles.eyebrow, { color: theme.colors.textMuted }]}>TEEVEE</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Er ging iets mis</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>Dit scherm kon niet worden geladen. Je kunt het opnieuw proberen of via de navigatie naar een ander onderdeel gaan.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Probeer dit scherm opnieuw te laden"
          onPress={() => void retry()}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 4,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  body: {
    marginTop: 12,
    maxWidth: 440,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  retryButton: {
    minHeight: 48,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
});
