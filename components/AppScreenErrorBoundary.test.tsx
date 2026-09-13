// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppScreenErrorBoundary } from './AppScreenErrorBoundary';

vi.mock('react-native', () => {
  type Props = {
    children?: ReactNode;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    onPress?: () => void;
  };
  const View = ({ children }: Props) => createElement('div', null, children);
  const Text = ({ children, accessibilityRole }: Props) =>
    createElement(accessibilityRole === 'header' ? 'h1' : 'span', null, children);
  return {
    View,
    Text,
    Pressable: ({ children, accessibilityLabel, onPress }: Props) =>
      createElement('button', { 'aria-label': accessibilityLabel, onClick: onPress }, children),
    StyleSheet: { create: <T,>(value: T) => value },
  };
});

vi.mock('react-native-safe-area-context', async () => ({ SafeAreaView: (await import('react-native')).View }));
vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    colors: {
      background: '#fff',
      text: '#111',
      textSecondary: '#555',
      textMuted: '#777',
      accent: '#111',
    },
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('AppScreenErrorBoundary', () => {
  it('shows a generic recovery state and calls Expo Router retry', async () => {
    const retry = vi.fn(async () => undefined);

    await act(async () => {
      root.render(<AppScreenErrorBoundary error={new Error('sensitive implementation detail')} retry={retry} />);
    });

    expect(container.querySelector('h1')?.textContent).toBe('Er ging iets mis');
    expect(container.textContent).not.toContain('sensitive implementation detail');

    const button = container.querySelector<HTMLButtonElement>('[aria-label="Probeer dit scherm opnieuw te laden"]');
    expect(button).not.toBeNull();
    await act(async () => button?.click());
    expect(retry).toHaveBeenCalledOnce();
  });
});
