import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AppScreenErrorBoundary } from '@/components/AppScreenErrorBoundary';
import { AppTabIcon } from '@/components/AppTabIcon';
import { ChannelPersonalisationProvider } from '@/features/channels/ChannelPersonalisationProvider';
import { AppearancePreferenceProvider } from '@/features/settings/AppearancePreferenceProvider';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import { useTeeveeFonts } from '@/theme/useTeeveeFonts';
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
            fontFamily: TEEVEE_FONT_FAMILIES.semibold,
            fontSize: 10,
            lineHeight: 12,
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
        <Tabs.Screen name="channels" options={{ title: 'Mijn zenders', href: null }} />
      </Tabs>
    </>
  );
}

function FontAwareApp() {
  const theme = useTeeveeTheme();
  const [fontsLoaded, fontError] = useTeeveeFonts();

  if (fontError) {
    return (
      <SafeAreaView style={[styles.fontFailureRoot, { backgroundColor: theme.colors.background }]}>
        <View style={styles.fontFailureContent}>
          <Text accessibilityRole="header" style={[styles.fontFailureTitle, { color: theme.colors.text }]}>
            Teevee kon het lettertype niet laden
          </Text>
          <Text style={[styles.fontFailureBody, { color: theme.colors.textSecondary }]}>
            Sluit de app volledig en open Teevee opnieuw.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!fontsLoaded) return null;
  return <ThemedTabs />;
}

export default function RootLayout() {
  return (
    <AppearancePreferenceProvider>
      <ChannelPersonalisationProvider>
        <FontAwareApp />
      </ChannelPersonalisationProvider>
    </AppearancePreferenceProvider>
  );
}

const styles = StyleSheet.create({
  fontFailureRoot: {
    flex: 1,
  },
  fontFailureContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  fontFailureTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  fontFailureBody: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
});
