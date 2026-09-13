import {
  DEFAULT_APP_PREFERENCES,
  parseSerializedAppPreferences,
  serializeAppPreferences,
  type AppPreferences,
} from '@/features/settings/appPreferences';

const PREFERENCES_STORAGE_KEY = 'teevee.preferences.v1';

export function readAppPreferences(): AppPreferences {
  try {
    if (typeof globalThis.localStorage === 'undefined') return DEFAULT_APP_PREFERENCES;
    return parseSerializedAppPreferences(globalThis.localStorage.getItem(PREFERENCES_STORAGE_KEY));
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export function writeAppPreferences(preferences: AppPreferences): boolean {
  try {
    if (typeof globalThis.localStorage === 'undefined') return false;
    globalThis.localStorage.setItem(PREFERENCES_STORAGE_KEY, serializeAppPreferences(preferences));
    return true;
  } catch {
    return false;
  }
}
