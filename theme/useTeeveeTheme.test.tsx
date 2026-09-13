// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { darkTheme, lightTheme } from './tokens';
import { useTeeveeTheme } from './useTeeveeTheme';

type Scheme = 'light' | 'dark' | null;

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
    />
  );
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
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

    await switchScheme('dark');
    expect(probe()).toBe(node);
    expect(node.dataset.dark).toBe('true');
    expect(node.dataset.background).toBe(darkTheme.colors.background);

    await switchScheme('light');
    expect(probe()).toBe(node);
    expect(node.dataset.dark).toBe('false');
    expect(node.dataset.background).toBe(lightTheme.colors.background);
  });

  it('falls back to light when the system reports no explicit scheme', async () => {
    await act(async () => root.render(<ThemeProbe />));
    await switchScheme(null);

    expect(probe().dataset.dark).toBe('false');
    expect(probe().dataset.background).toBe(lightTheme.colors.background);
  });
});
