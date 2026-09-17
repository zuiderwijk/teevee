import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppScreenErrorBoundary } from '@/components/AppScreenErrorBoundary';
import { AppTabIcon } from '@/components/AppTabIcon';
import { AppearancePreferenceProvider } from '@/features/settings/AppearancePreferenceProvider';
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
          tabBarActiveTintColor: theme.colors.currentTime,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarAllowFontScaling: false,
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            minHeight: 64,
            paddingTop: 6,
          },
          tabBarItemStyle: {
            paddingTop: 1,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            lineHeight: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Gids',
            tabBarIcon: ({ color, focused }) => (
              <AppTabIcon name="guide" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="tonight"
          options={{
            title: 'Vanavond',
            tabBarIcon: ({ color, focused }) => (
              <AppTabIcon name="tonight" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Zoeken',
            tabBarIcon: ({ color, focused }) => (
              <AppTabIcon name="search" color={color} focused={focused} />
            ),
          }}
        />
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
