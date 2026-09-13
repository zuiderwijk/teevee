import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

export default function SearchScreen() {
  const theme = useTeeveeTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text accessible={false} style={[styles.eyebrow, { color: theme.colors.textMuted }]}>TEEVEE</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Zoeken</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>Zoeken naar programma’s en zenders wordt in een latere fase inhoudelijk gebouwd.</Text>
      </View>
    </SafeAreaView>
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
