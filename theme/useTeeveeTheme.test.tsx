// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppearancePreferenceProvider, useAppearancePreferenceSettings } from '@/features/settings/AppearancePreferenceProvider';
import { DEFAULT_APP_PREFERENCES, type AppearancePreference } from '@/features/settings/appPreferences';
import { readAppPreferences, writeAppPreferences } from '@/services/storage/appPreferencesStorage';

import { darkTheme, lightTheme } from './tokens';
import { useTeeveeTheme } from './useTeeveeTheme';

type Scheme = 'light' | 'dark' | 'unspecified' | null;

const schemeStore = vi.hoisted(() => ({
  value: 'light' as Scheme,
  listeners: new Set<() => void>(),
}));

vi.mock('react-native', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    useColorScheme: () => useSyncExternalStore(
      (listener: () => void) => {
        schemeStore.listeners.add(listener);
        return () => schemeStore.listeners.delete(listener);
      },
      () => schemeStore.value,
      () => schemeStore.value,
    ),
  };
});

function ThemeProbe() {
  const theme = useTeeveeTheme();
  return (
    <div
      data-testid="theme-probe"
      data-dark={String(theme.dark)}
      data-background={theme.colors.background}
      data-editorial-accent={theme.colors.editorialAccent}
      data-editorial-accent-surface={theme.colors.editorialAccentSurface}
    />
  );
}

function PreferenceControls() {
  const { setAppearance } = useAppearancePreferenceSettings();
  return <>{(['system', 'light', 'dark'] as const).map((value) => (
    <button key={value} data-appearance={value} onClick={() => setAppearance(value)}>{value}</button>
  ))}</>;
}

function AppProbe() {
  return <AppearancePreferenceProvider><ThemeProbe /><PreferenceControls /></AppearancePreferenceProvider>;
}

async function chooseAppearance(value: AppearancePreference) {
  const button = container.querySelector<HTMLButtonElement>(`[data-appearance="${value}"]`);
  if (!button) throw new Error('Preference button is not rendered');
  await act(async () => button.click());
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  writeAppPreferences(DEFAULT_APP_PREFERENCES);
  schemeStore.value = 'light';
  schemeStore.listeners.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  schemeStore.listeners.clear();
  vi.unstubAllGlobals();
});

function probe() {
  const node = container.querySelector<HTMLElement>('[data-testid="theme-probe"]');
  if (!node) throw new Error('Theme probe is not rendered');
  return node;
}

async function switchScheme(value: Scheme) {
  await act(async () => {
    schemeStore.value = value;
    for (const listener of [...schemeStore.listeners]) listener();
  });
}

describe('useTeeveeTheme live system updates', () => {
  it('reacts to light → dark → light changes without remounting', async () => {
    await act(async () => root.render(<ThemeProbe />));
    const node = probe();

    expect(node.dataset.dark).toBe('false');
    expect(node.dataset.background).toBe(lightTheme.colors.background);
    expect(node.dataset.editorialAccent).toBe(lightTheme.colors.editorialAccent);
    expect(node.dataset.editorialAccentSurface).toBe(
      lightTheme.colors.editorialAccentSurface,
    );

    await switchScheme('dark');
    expect(probe()).toBe(node);
    expect(node.dataset.dark).toBe('true');
    expect(node.dataset.background).toBe(darkTheme.colors.background);
    expect(node.dataset.editorialAccent).toBe(darkTheme.colors.editorialAccent);
    expect(node.dataset.editorialAccentSurface).toBe(
      darkTheme.colors.editorialAccentSurface,
    );

    await switchScheme('light');
    expect(probe()).toBe(node);
    expect(node.dataset.dark).toBe('false');
    expect(node.dataset.background).toBe(lightTheme.colors.background);
    expect(node.dataset.editorialAccent).toBe(lightTheme.colors.editorialAccent);
    expect(node.dataset.editorialAccentSurface).toBe(
      lightTheme.colors.editorialAccentSurface,
    );
  });

  it('falls back to light when the system reports no explicit scheme', async () => {
    await act(async () => root.render(<ThemeProbe />));
    await switchScheme(null);

    expect(probe().dataset.dark).toBe('false');
    expect(probe().dataset.background).toBe(lightTheme.colors.background);
  });
});


describe('appearance provider integration', () => {
  it('applies explicit choices live and resumes device following without remounting', async () => {
    await act(async () => root.render(<AppProbe />));
    const node = probe();
    await chooseAppearance('dark');
    expect(node.dataset.dark).toBe('true');
    await switchScheme('dark');
    await chooseAppearance('light');
    expect(node.dataset.dark).toBe('false');
    await switchScheme('light');
    await switchScheme('dark');
    expect(node.dataset.dark).toBe('false');
    await chooseAppearance('system');
    expect(node.dataset.dark).toBe('true');
    await switchScheme('unspecified');
    expect(node.dataset.dark).toBe('false');
    expect(probe()).toBe(node);
  });

  it('restores an explicit choice on remount and preserves the latest Guide preference', async () => {
    writeAppPreferences({ version: 1, appearance: 'dark', guidePresentation: 'per-channel' });
    await act(async () => root.render(<AppProbe />));
    expect(probe().dataset.dark).toBe('true');
    // Simulate a Guide selection after the provider has mounted.
    writeAppPreferences({ ...readAppPreferences(), guidePresentation: 'now-next' });
    await chooseAppearance('light');
    expect(readAppPreferences()).toEqual({ version: 1, appearance: 'light', guidePresentation: 'now-next' });
    await act(async () => root.render(null));
    await switchScheme('dark');
    await act(async () => root.render(<AppProbe />));
    expect(probe().dataset.dark).toBe('false');
  });
});
