import {
  DEFAULT_APP_PREFERENCES,
  parseSerializedAppPreferences,
  serializeAppPreferences,
  type AppPreferences,
} from '@/features/settings/appPreferences';

let memoryValue: string | null = null;

export function readAppPreferences(): AppPreferences {
  return memoryValue
    ? parseSerializedAppPreferences(memoryValue)
    : DEFAULT_APP_PREFERENCES;
}

export function writeAppPreferences(preferences: AppPreferences): boolean {
  memoryValue = serializeAppPreferences(preferences);
  return true;
}
