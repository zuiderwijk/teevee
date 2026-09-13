import { useColorScheme } from 'react-native';

import { resolveAppearanceColorScheme } from '@/features/settings/appearance';
import { useAppearancePreference } from '@/features/settings/AppearancePreferenceProvider';

import { darkTheme, lightTheme } from './tokens';

export function useTeeveeTheme() {
  const systemColorScheme = useColorScheme();
  const appearance = useAppearancePreference();
  const resolvedAppearance = resolveAppearanceColorScheme(appearance, systemColorScheme);

  return resolvedAppearance === 'dark' ? darkTheme : lightTheme;
}
