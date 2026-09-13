// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NowNextLoadErrorNotice } from './NowNextLoadErrorNotice';

vi.mock('react-native', () => {
  type Props = {
    children?: ReactNode;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    onPress?: () => void;
  };
  const View = ({ children, accessibilityRole }: Props) =>
    createElement('div', { role: accessibilityRole }, children);
  const Text = ({ children }: Props) => createElement('span', null, children);
  const Pressable = ({ children, accessibilityRole, accessibilityLabel, onPress }: Props) =>
    createElement(
      'button',
      { role: accessibilityRole, 'aria-label': accessibilityLabel, onClick: onPress },
      children,
    );
  return {
    View,
    Text,
    Pressable,
    StyleSheet: { create: <T,>(value: T) => value, hairlineWidth: 1 },
  };
});

vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    colors: {
      surfaceElevated: '#fff',
      border: '#ddd',
      text: '#111',
      textSecondary: '#555',
      accent: '#222',
      background: '#f7f7f5',
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

describe('NowNextLoadErrorNotice', () => {
  it('shows a recoverable user-facing error without technical details', async () => {
    const onRetry = vi.fn();

    await act(async () => {
      root.render(<NowNextLoadErrorNotice onRetry={onRetry} />);
    });

    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).toContain('Nu & Straks kon niet laden');
    expect(container.textContent).toContain('De andere gidsweergaven blijven beschikbaar');
    expect(container.textContent).not.toContain('Error:');

    const retry = container.querySelector<HTMLButtonElement>('button');
    expect(retry).not.toBeNull();
    expect(retry?.getAttribute('aria-label')).toBe('Nu & Straks opnieuw laden');
    await act(async () => retry?.click());
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
