import { describe, expect, it } from 'vitest';

import {
  DEFAULT_APP_PREFERENCES,
  parseAppPreferences,
  parseSerializedAppPreferences,
  serializeAppPreferences,
  withAppearancePreference,
  withChannelPersonalisation,
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

  it('restores valid channel personalisation and repairs corrupt channel state independently', () => {
    const channelPersonalisation = {
      version: 1 as const,
      knownChannelIds: ['a', 'b'],
      selectedChannelIds: ['b'],
    };
    expect(
      parseAppPreferences({
        version: 1,
        guidePresentation: 'now-next',
        appearance: 'system',
        channelPersonalisation,
      }),
    ).toEqual({
      version: 1,
      guidePresentation: 'now-next',
      appearance: 'system',
      channelPersonalisation,
    });

    expect(
      parseAppPreferences({
        version: 1,
        guidePresentation: 'now-next',
        appearance: 'dark',
        channelPersonalisation: {
          version: 1,
          knownChannelIds: ['a'],
          selectedChannelIds: [],
        },
      }),
    ).toEqual({
      version: 1,
      guidePresentation: 'now-next',
      appearance: 'dark',
    });
  });

  it('changes channel personalisation without losing Guide or appearance settings', () => {
    const current = {
      version: 1 as const,
      guidePresentation: 'per-channel' as const,
      appearance: 'dark' as const,
    };
    const next = withChannelPersonalisation(current, {
      version: 1,
      knownChannelIds: ['a', 'b'],
      selectedChannelIds: ['b'],
    });

    expect(next).toEqual({
      ...current,
      channelPersonalisation: {
        version: 1,
        knownChannelIds: ['a', 'b'],
        selectedChannelIds: ['b'],
      },
    });
    expect(withChannelPersonalisation(next, null)).toEqual(current);
  });

  it('changes appearance without losing the Guide preference', () => {
    const current = { version: 1 as const, guidePresentation: 'per-channel' as const, appearance: 'system' as const };
    const next = withAppearancePreference(current, 'dark');

    expect(next).toEqual({ version: 1, guidePresentation: 'per-channel', appearance: 'dark' });
  });
});
