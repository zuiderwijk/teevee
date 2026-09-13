import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_APP_PREFERENCES } from '@/features/settings/appPreferences';

import { readAppPreferences, writeAppPreferences } from './appPreferencesStorage';

afterEach(() => {
  writeAppPreferences(DEFAULT_APP_PREFERENCES);
});

describe('app preferences storage fallback', () => {
  it('round-trips the versioned preferences contract', () => {
    expect(readAppPreferences()).toEqual(DEFAULT_APP_PREFERENCES);

    const preferences = {
      version: 1 as const,
      guidePresentation: 'per-channel' as const,
      appearance: 'dark' as const,
    };

    expect(writeAppPreferences(preferences)).toBe(true);
    expect(readAppPreferences()).toEqual(preferences);
  });
});
