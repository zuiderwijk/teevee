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
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: string;
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
        'aria-hidden': props.accessibilityElementsHidden || props.importantForAccessibility === 'no-hide-descendants'
          ? true
          : undefined,
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

vi.mock('react-native-reanimated', async () => {
  const { useState } = await import('react');
  const { View } = await import('react-native');
  return {
    default: { View },
    ReduceMotion: { System: 'system' },
    useSharedValue: function useSharedValue<T>(initial: T) {
      const [value] = useState(() => ({ value: initial }));
      return value;
    },
    useAnimatedStyle: (callback: () => unknown) => callback(),
    withSpring: (target: number) => target,
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
  it('hides non-essential brand and presentation chrome from interaction when condensed', async () => {
    await act(async () => {
      root.render(
        <GuideChrome
          condensed
          presentationNavigation={<button data-testid="presentation-navigation">tabs</button>}
        />,
      );
    });

    expect(container.querySelector('[data-testid="guide-chrome-condensed"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="guide-chrome-expanded-content"]')?.getAttribute('aria-hidden'))
      .toBe('true');
  });

  it('keeps presentation switching, search/settings and bounded scaling when expanded', async () => {
    await act(async () => {
      root.render(
        <GuideChrome
          condensed={false}
          presentationNavigation={<div data-testid="presentation-navigation">tabs</div>}
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
    expect(Math.max(...scalingCaps)).toBeLessThanOrEqual(1.15);

    await act(async () => search?.click());
    await act(async () => settings?.click());
    expect(push).toHaveBeenNthCalledWith(1, '/search');
    expect(push).toHaveBeenNthCalledWith(2, '/settings');
  });
});
