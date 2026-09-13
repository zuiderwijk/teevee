// @vitest-environment jsdom
// Real Settings/provider integration with native hosts and the router mocked.
// This validates control wiring, not native layout or navigation transitions.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsScreen from '@/app/settings';
import { readAppPreferences, writeAppPreferences } from '@/services/storage/appPreferencesStorage';

import { AppearancePreferenceProvider } from './AppearancePreferenceProvider';
import { DEFAULT_APP_PREFERENCES } from './appPreferences';

const router = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn(), canGoBack: vi.fn(() => true) }));
vi.mock('expo-router', () => ({ useRouter: () => router }));
vi.mock('react-native', async () => {
  const { createElement } = await import('react');
  type Props = {
    children?: ReactNode;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityState?: { checked?: boolean };
    onPress?: () => void;
  };
  const View = ({ children }: Props) => createElement('div', null, children);
  return {
    View, Text: View, ScrollView: View,
    Pressable: ({ children, accessibilityRole, accessibilityLabel, accessibilityState, onPress }: Props) =>
      createElement('button', { role: accessibilityRole, 'aria-label': accessibilityLabel,
        'aria-checked': accessibilityState?.checked, onClick: onPress }, children),
    StyleSheet: { create: <T,>(value: T) => value, hairlineWidth: 1 },
    useColorScheme: () => 'light',
  };
});
vi.mock('react-native-safe-area-context', async () => ({ SafeAreaView: (await import('react-native')).View }));

let container: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  router.canGoBack.mockReturnValue(true);
  writeAppPreferences(DEFAULT_APP_PREFERENCES);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(<AppearancePreferenceProvider><SettingsScreen /></AppearancePreferenceProvider>));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function control(labelPrefix: string) {
  const element = container.querySelector<HTMLButtonElement>(`[aria-label^="${labelPrefix}"]`);
  if (!element) throw new Error(`Missing control: ${labelPrefix}`);
  return element;
}

describe('Settings controls', () => {
  it('persists the chosen appearance and exposes one selected radio', async () => {
    expect(control('Systeem.').getAttribute('aria-checked')).toBe('true');
    await act(async () => control('Donker.').click());
    expect(readAppPreferences().appearance).toBe('dark');
    expect(control('Donker.').getAttribute('aria-checked')).toBe('true');
    expect(container.querySelectorAll('[aria-checked="true"]')).toHaveLength(1);
  });
  it('closes using navigation history', async () => {
    await act(async () => control('Sluit instellingen').click());
    expect(router.back).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });
  it('returns to Guide when Settings was opened without history', async () => {
    router.canGoBack.mockReturnValue(false);
    await act(async () => control('Sluit instellingen').click());
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
  });
});
