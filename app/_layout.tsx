import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

export default function RootLayout() {
  const theme = useTeeveeTheme();

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </>
  );
}
