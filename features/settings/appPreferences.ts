import {
  DEFAULT_GUIDE_PRESENTATION,
  isGuidePresentation,
  type GuidePresentation,
} from '@/features/guide/guidePresentation';

export const APP_PREFERENCES_VERSION = 1 as const;

export const APPEARANCE_PREFERENCES = ['system', 'light', 'dark'] as const;
export type AppearancePreference = (typeof APPEARANCE_PREFERENCES)[number];

export type AppPreferences = {
  version: typeof APP_PREFERENCES_VERSION;
  guidePresentation: GuidePresentation;
  appearance: AppearancePreference;
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  version: APP_PREFERENCES_VERSION,
  guidePresentation: DEFAULT_GUIDE_PRESENTATION,
  appearance: 'system',
};

export function isAppearancePreference(value: unknown): value is AppearancePreference {
  return APPEARANCE_PREFERENCES.some((appearance) => appearance === value);
}

export function parseAppPreferences(value: unknown): AppPreferences {
  if (!value || typeof value !== 'object') return DEFAULT_APP_PREFERENCES;

  const candidate = value as Record<string, unknown>;

  return {
    version: APP_PREFERENCES_VERSION,
    guidePresentation: isGuidePresentation(candidate.guidePresentation)
      ? candidate.guidePresentation
      : DEFAULT_APP_PREFERENCES.guidePresentation,
    appearance: isAppearancePreference(candidate.appearance)
      ? candidate.appearance
      : DEFAULT_APP_PREFERENCES.appearance,
  };
}

export function parseSerializedAppPreferences(value: string | null): AppPreferences {
  if (!value) return DEFAULT_APP_PREFERENCES;

  try {
    return parseAppPreferences(JSON.parse(value));
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export function serializeAppPreferences(preferences: AppPreferences): string {
  return JSON.stringify(preferences);
}

export function withGuidePresentation(
  preferences: AppPreferences,
  guidePresentation: GuidePresentation,
): AppPreferences {
  return {
    ...preferences,
    guidePresentation,
  };
}
