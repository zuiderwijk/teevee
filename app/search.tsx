import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreenHeader } from '@/components/AppScreenHeader';
import { SettingsButton } from '@/components/SettingsButton';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

export default function SearchScreen() {
  const theme = useTeeveeTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <AppScreenHeader title="Zoeken" action={<SettingsButton />} />
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
  body: {
    marginTop: 18,
    maxWidth: 420,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
});
