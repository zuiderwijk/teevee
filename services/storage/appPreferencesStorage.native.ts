import { File, Paths } from 'expo-file-system';

import {
  DEFAULT_APP_PREFERENCES,
  parseSerializedAppPreferences,
  serializeAppPreferences,
  type AppPreferences,
} from '@/features/settings/appPreferences';

const PREFERENCES_FILE_NAME = 'teevee-preferences-v1.json';

function preferencesFile() {
  return new File(Paths.document, PREFERENCES_FILE_NAME);
}

export function readAppPreferences(): AppPreferences {
  try {
    const file = preferencesFile();
    if (!file.exists) return DEFAULT_APP_PREFERENCES;
    return parseSerializedAppPreferences(file.textSync());
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export function writeAppPreferences(preferences: AppPreferences): boolean {
  try {
    const file = preferencesFile();
    if (!file.exists) file.create({ intermediates: true });
    file.write(serializeAppPreferences(preferences));
    return true;
  } catch {
    return false;
  }
}
