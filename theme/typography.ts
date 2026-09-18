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
 * Production runtime source for the canonical Teevee typeface.
 * The runtime loader lives in `useTeeveeFonts.ts` so importing typography
 * tokens in domain/unit tests does not initialize Expo native modules.
 */
export const INSTRUMENT_SANS_RUNTIME = {
  enabled: true,
  package: '@expo-google-fonts/instrument-sans@0.4.2',
  licence: 'MIT AND OFL-1.1',
} as const;
