import { describe, expect, it } from 'vitest';

import {
  DEFAULT_APP_PREFERENCES,
  parseAppPreferences,
  parseSerializedAppPreferences,
  serializeAppPreferences,
  withGuidePresentation,
} from './appPreferences';

describe('app preferences', () => {
  it('uses safe defaults when no preferences exist', () => {
    expect(parseSerializedAppPreferences(null)).toEqual(DEFAULT_APP_PREFERENCES);
  });

  it('restores supported Guide and appearance preferences', () => {
    expect(
      parseSerializedAppPreferences(
        JSON.stringify({ version: 1, guidePresentation: 'per-channel', appearance: 'dark' }),
      ),
    ).toEqual({ version: 1, guidePresentation: 'per-channel', appearance: 'dark' });
  });

  it('repairs unsupported or corrupt fields independently', () => {
    expect(
      parseAppPreferences({ version: 99, guidePresentation: 'unknown', appearance: 'light' }),
    ).toEqual({ version: 1, guidePresentation: 'total', appearance: 'light' });
    expect(parseSerializedAppPreferences('{broken')).toEqual(DEFAULT_APP_PREFERENCES);
  });

  it('changes the Guide preference without losing other settings', () => {
    const current = { version: 1 as const, guidePresentation: 'total' as const, appearance: 'dark' as const };
    const next = withGuidePresentation(current, 'now-next');

    expect(next).toEqual({ version: 1, guidePresentation: 'now-next', appearance: 'dark' });
    expect(parseSerializedAppPreferences(serializeAppPreferences(next))).toEqual(next);
  });
});
