import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppearancePreferenceProvider } from '@/features/settings/AppearancePreferenceProvider';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

function ThemedTabs() {
  const theme = useTeeveeTheme();

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Tabs
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: theme.colors.text,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 66,
            paddingTop: 7,
            paddingBottom: 7,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            lineHeight: 16,
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Gids' }} />
        <Tabs.Screen name="tonight" options={{ title: 'Vanavond' }} />
        <Tabs.Screen name="search" options={{ title: 'Zoeken' }} />
        <Tabs.Screen name="settings" options={{ title: 'Instellingen', href: null }} />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppearancePreferenceProvider>
      <ThemedTabs />
    </AppearancePreferenceProvider>
  );
}
