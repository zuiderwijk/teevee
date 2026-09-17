import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
  useFonts,
} from '@expo-google-fonts/instrument-sans';

export const TEEVEE_UI_TYPEFACE = 'Instrument Sans' as const;

/**
 * Canonical Teevee UI family. Weight-specific family names avoid platform font
 * synthesis differences between iOS and Android: each visual weight maps to the
 * corresponding static Instrument Sans asset shipped in the installed bundle.
 */
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

export const INSTRUMENT_SANS_RUNTIME = {
  enabled: true,
  package: '@expo-google-fonts/instrument-sans@0.4.2',
  upstream: 'expo/google-fonts',
  licence: 'MIT AND OFL-1.1',
} as const;

export function useTeeveeFonts() {
  return useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });
}
