import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme } from './tokens';

export function useTeeveeTheme() {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
