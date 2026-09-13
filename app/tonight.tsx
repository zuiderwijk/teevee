import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreenHeader } from '@/components/AppScreenHeader';
import { SettingsButton } from '@/components/SettingsButton';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

export default function TonightScreen() {
  const theme = useTeeveeTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <AppScreenHeader title="Vanavond" action={<SettingsButton />} />
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>Deze sectie krijgt later de keuzehulp voor wat er vanavond op televisie is.</Text>
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
  body: {
    marginTop: 18,
    maxWidth: 420,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
});
