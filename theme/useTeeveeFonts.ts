import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { useFonts } from 'expo-font';

import { TEEVEE_FONT_FAMILIES } from './typography';

/**
 * Register only the four canonical static Instrument Sans faces before app
 * content renders. Importing the individual weight entry points matters: the
 * package root also references italic faces, which would unnecessarily bundle
 * assets that Teevee does not use. Metro embeds these four local package assets
 * in the installed app, so no network is required after installation.
 */
export function useTeeveeFonts() {
  return useFonts({
    [TEEVEE_FONT_FAMILIES.regular]: InstrumentSans_400Regular,
    [TEEVEE_FONT_FAMILIES.medium]: InstrumentSans_500Medium,
    [TEEVEE_FONT_FAMILIES.semibold]: InstrumentSans_600SemiBold,
    [TEEVEE_FONT_FAMILIES.bold]: InstrumentSans_700Bold,
  });
}
