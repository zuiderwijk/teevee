import { describe, expect, it } from 'vitest';

import { resolveAppearanceColorScheme } from './appearance';

describe('appearance preference resolution', () => {
  it('follows the device when System is selected', () => {
    expect(resolveAppearanceColorScheme('system', 'dark')).toBe('dark');
    expect(resolveAppearanceColorScheme('system', 'light')).toBe('light');
  });

  it.each([null, undefined, 'unspecified'] as const)('falls back to light for %s', (scheme) => {
    expect(resolveAppearanceColorScheme('system', scheme)).toBe('light');
    expect(resolveAppearanceColorScheme('dark', scheme)).toBe('dark');
  });

  it('lets an explicit app preference override the device', () => {
    expect(resolveAppearanceColorScheme('dark', 'light')).toBe('dark');
    expect(resolveAppearanceColorScheme('light', 'dark')).toBe('light');
  });
});
