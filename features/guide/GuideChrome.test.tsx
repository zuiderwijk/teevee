// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GuideChrome } from './GuideChrome';

const push = vi.fn();

vi.mock('expo-router', () => ({
  useRouter: () => ({ push }),
}));

type MockProps = {
  children?: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  maxFontSizeMultiplier?: number;
  onPress?: () => void;
};

vi.mock('react-native', () => {
  const element = (tag: string, props: MockProps) =>
    createElement(
      tag,
      {
        'data-testid': props.testID,
        'data-max-font-scale': props.maxFontSizeMultiplier,
        'aria-label': props.accessibilityLabel,
        role: props.accessibilityRole,
        onClick: props.onPress,
      },
      props.children,
    );

  return {
    Pressable: (props: MockProps) => element('button', props),
    View: (props: MockProps) => element('div', props),
    Text: (props: MockProps) => element('span', props),
    StyleSheet: {
      hairlineWidth: 1,
      create: <T,>(value: T) => value,
    },
  };
});

vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    dark: false,
    colors: {
      background: '#fff',
      surface: '#fff',
      surfaceElevated: '#f5f5f5',
      text: '#111',
      textSecondary: '#555',
      textMuted: '#777',
      border: '#ddd',
      accent: '#111',
      currentTime: '#d44',
      programme: '#eee',
      programmeCurrent: '#ddd',
    },
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  push.mockReset();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('GuideChrome', () => {
  it('removes non-essential brand and presentation chrome when condensed', async () => {
    await act(async () => {
      root.render(
        <GuideChrome
          condensed
          presentationNavigation={<button data-testid="presentation-navigation">tabs</button>}
          heading="Gids"
          supportingText="Alle zenders, één overzicht"
        />,
      );
    });

    expect(container.querySelector('[data-testid="guide-chrome-condensed"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="presentation-navigation"]')).toBeNull();
    expect(container.querySelector('[data-testid="guide-search-action"]')).toBeNull();
    expect(container.querySelector('[data-testid="guide-settings-action"]')).toBeNull();
    expect(container.textContent).not.toContain('Gids');
  });

  it('keeps presentation switching, search/settings and bounded scaling when expanded', async () => {
    await act(async () => {
      root.render(
        <GuideChrome
          condensed={false}
          presentationNavigation={<div data-testid="presentation-navigation">tabs</div>}
          heading="Gids"
          supportingText="Alle zenders, één overzicht"
        />,
      );
    });

    expect(container.querySelector('[data-testid="presentation-navigation"]')).not.toBeNull();
    const search = container.querySelector<HTMLButtonElement>('[data-testid="guide-search-action"]');
    const settings = container.querySelector<HTMLButtonElement>('[data-testid="guide-settings-action"]');
    expect(search?.getAttribute('aria-label')).toBe('Zoeken');
    expect(settings?.getAttribute('aria-label')).toBe('Open instellingen');

    const scalingCaps = [...container.querySelectorAll<HTMLElement>('[data-max-font-scale]')]
      .map((node) => Number(node.getAttribute('data-max-font-scale')))
      .filter(Number.isFinite);
    expect(scalingCaps.length).toBeGreaterThan(0);
    expect(Math.max(...scalingCaps)).toBeLessThanOrEqual(1.25);

    await act(async () => search?.click());
    await act(async () => settings?.click());
    expect(push).toHaveBeenNthCalledWith(1, '/search');
    expect(push).toHaveBeenNthCalledWith(2, '/settings');
  });
});
