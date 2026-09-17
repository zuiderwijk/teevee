import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { useFonts } from 'expo-font';

import { TEEVEE_FONT_FAMILIES } from './typography';

/**
 * Register the pinned static Instrument Sans assets before app content renders.
 * Metro bundles these package assets into the installed app, so no network is
 * required after installation. Weight-specific family names avoid platform
 * synthesis differences between iOS and Android.
 */
export function useTeeveeFonts() {
  return useFonts({
    [TEEVEE_FONT_FAMILIES.regular]: InstrumentSans_400Regular,
    [TEEVEE_FONT_FAMILIES.medium]: InstrumentSans_500Medium,
    [TEEVEE_FONT_FAMILIES.semibold]: InstrumentSans_600SemiBold,
    [TEEVEE_FONT_FAMILIES.bold]: InstrumentSans_700Bold,
  });
}
