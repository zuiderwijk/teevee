export const TEEVEE_UI_TYPEFACE = 'Instrument Sans' as const;

/**
 * Instrument Sans is the canonical Teevee UI typeface. The repository does not
 * yet contain approved font binaries or a lockfile entry for the verified Expo
 * Google Fonts distribution. Until that asset/dependency input is committed,
 * production components deliberately leave fontFamily unset and use the native
 * system family as an explicit fallback. Final visual acceptance remains blocked
 * until Instrument Sans is actually loaded on-device.
 *
 * Verified production-safe candidate:
 * - @expo-google-fonts/instrument-sans@0.4.2
 * - upstream: expo/google-fonts
 * - licence: MIT AND OFL-1.1 (font: OFL-1.1)
 */
export const INSTRUMENT_SANS_RUNTIME = {
  enabled: false,
  package: '@expo-google-fonts/instrument-sans@0.4.2',
  licence: 'MIT AND OFL-1.1',
  blocker: 'approved font asset/package lock input not committed',
} as const;

export const TEEVEE_FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
