import { describe, expect, it } from 'vitest';

import { resolveAppearanceColorScheme } from './appearance';

describe('appearance preference resolution', () => {
  it('follows the device when System is selected', () => {
    expect(resolveAppearanceColorScheme('system', 'dark')).toBe('dark');
    expect(resolveAppearanceColorScheme('system', 'light')).toBe('light');
  });

  it('falls back to light when the system scheme is unavailable', () => {
    expect(resolveAppearanceColorScheme('system', null)).toBe('light');
  });

  it('lets an explicit app preference override the device', () => {
    expect(resolveAppearanceColorScheme('dark', 'light')).toBe('dark');
    expect(resolveAppearanceColorScheme('light', 'dark')).toBe('light');
  });
});
