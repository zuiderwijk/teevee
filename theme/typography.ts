import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { useFonts } from 'expo-font';

export const TEEVEE_UI_TYPEFACE = 'Instrument Sans' as const;

export const TEEVEE_FONT_FAMILIES = {
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semibold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
} as const;

export const TEEVEE_FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Production-safe Instrument Sans delivery.
 *
 * The pinned Expo Google Fonts package redistributes Instrument Sans under the
 * SIL Open Font License 1.1 and exposes static weight assets. Registering each
 * static asset under its own family name keeps iOS and Android from synthesizing
 * custom-font weights differently. Metro bundles these assets with the installed
 * app, so the UI remains available offline after installation.
 */
export const INSTRUMENT_SANS_RUNTIME = {
  enabled: true,
  package: '@expo-google-fonts/instrument-sans@0.4.2',
  licence: 'MIT AND OFL-1.1',
} as const;

export function useTeeveeFonts() {
  return useFonts({
    [TEEVEE_FONT_FAMILIES.regular]: InstrumentSans_400Regular,
    [TEEVEE_FONT_FAMILIES.medium]: InstrumentSans_500Medium,
    [TEEVEE_FONT_FAMILIES.semibold]: InstrumentSans_600SemiBold,
    [TEEVEE_FONT_FAMILIES.bold]: InstrumentSans_700Bold,
  });
}
