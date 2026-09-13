import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { SettingsButton } from '@/components/SettingsButton';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

export default function TonightScreen() {
  const theme = useTeeveeTheme();

  return (
    <>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <SettingsButton />
          <Text accessible={false} style={[styles.eyebrow, { color: theme.colors.textMuted }]}>TEEVEE</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Vanavond</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>Deze sectie krijgt later de keuzehulp voor wat er vanavond op televisie is.</Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 2,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  body: {
    marginTop: 18,
    maxWidth: 420,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
});
