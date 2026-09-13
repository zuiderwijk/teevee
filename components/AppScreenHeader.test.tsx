// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppScreenHeader } from './AppScreenHeader';

vi.mock('react-native', () => {
  type Props = {
    children?: ReactNode;
    accessibilityRole?: string;
  };
  const View = ({ children }: Props) => createElement('div', null, children);
  const Text = ({ children, accessibilityRole }: Props) =>
    createElement(accessibilityRole === 'header' ? 'h1' : 'span', null, children);
  return {
    View,
    Text,
    StyleSheet: { create: <T,>(value: T) => value },
  };
});

vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    colors: {
      textMuted: '#777',
      text: '#111',
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

describe('AppScreenHeader', () => {
  it('renders one semantic title and an optional action', async () => {
    await act(async () => {
      root.render(<AppScreenHeader title="Zoeken" action={<button>Instellingen</button>} />);
    });

    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1')?.textContent).toBe('Zoeken');
    expect(container.textContent).toContain('TEEVEE');
    expect(container.querySelector('button')?.textContent).toBe('Instellingen');
  });

  it('does not require an action', async () => {
    await act(async () => {
      root.render(<AppScreenHeader title="Vanavond" />);
    });

    expect(container.querySelector('h1')?.textContent).toBe('Vanavond');
    expect(container.querySelector('button')).toBeNull();
  });
});
