import type { ColorSchemeName } from 'react-native';

import type { AppearancePreference } from './appPreferences';

export type ResolvedAppearance = 'light' | 'dark';

export function resolveAppearanceColorScheme(
  preference: AppearancePreference,
  systemColorScheme: ColorSchemeName | null | undefined,
): ResolvedAppearance {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemColorScheme === 'dark' ? 'dark' : 'light';
}
