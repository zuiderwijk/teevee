import { useFonts } from 'expo-font';

export const TEEVEE_FONT_FAMILIES = {
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semibold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
} as const;

/**
 * Instrument Sans is bundled with the installed app. Each static file is
 * registered under a weight-specific family name so iOS and Android do not
 * need to synthesize custom-font weights differently.
 */
export function useTeeveeFonts() {
  return useFonts({
    [TEEVEE_FONT_FAMILIES.regular]: require('../assets/fonts/InstrumentSans_400Regular.ttf'),
    [TEEVEE_FONT_FAMILIES.medium]: require('../assets/fonts/InstrumentSans_500Medium.ttf'),
    [TEEVEE_FONT_FAMILIES.semibold]: require('../assets/fonts/InstrumentSans_600SemiBold.ttf'),
    [TEEVEE_FONT_FAMILIES.bold]: require('../assets/fonts/InstrumentSans_700Bold.ttf'),
  });
}
