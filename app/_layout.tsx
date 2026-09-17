import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppScreenErrorBoundary } from '@/components/AppScreenErrorBoundary';
import { AppearancePreferenceProvider } from '@/features/settings/AppearancePreferenceProvider';
import { TEEVEE_FONT_FAMILIES, useTeeveeFonts } from '@/theme/typography';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

function ThemedTabs() {
  const theme = useTeeveeTheme();

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Tabs
        backBehavior="history"
        unstable_screenErrorBoundary={AppScreenErrorBoundary}
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
            fontFamily: TEEVEE_FONT_FAMILIES.semibold,
            fontSize: 12,
            lineHeight: 16,
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
  const [fontsLoaded, fontError] = useTeeveeFonts();

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

  return (
    <AppearancePreferenceProvider>
      <ThemedTabs />
    </AppearancePreferenceProvider>
  );
}
