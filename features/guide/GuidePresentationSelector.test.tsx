// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GuidePresentationSelector } from './GuidePresentationSelector';

type MockProps = {
  children?: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityState?: { selected?: boolean; busy?: boolean };
  disabled?: boolean;
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
        'aria-selected': props.accessibilityState?.selected,
        'aria-busy': props.accessibilityState?.busy,
        role: props.accessibilityRole,
        disabled: props.disabled,
        onClick: props.onPress,
      },
      props.children,
    );

  return {
    Pressable: (props: MockProps) => element('button', props),
    View: (props: MockProps) => element('div', props),
    Text: (props: MockProps) => element('span', props),
    Platform: { OS: 'ios' },
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
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
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('GuidePresentationSelector', () => {
  it('keeps one accessible selected tab and commits presentation changes', async () => {
    const onSelect = vi.fn();

    await act(async () => {
      root.render(<GuidePresentationSelector selected="total" onSelect={onSelect} />);
    });

    const tabs = [...container.querySelectorAll<HTMLButtonElement>('button[role="tab"]')];
    expect(tabs).toHaveLength(3);
    expect(tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true')).toHaveLength(1);
    expect(container.querySelector('[data-testid="guide-presentation-total"]')?.getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('[data-testid="guide-presentation-active-indicator"]')).not.toBeNull();
    expect([...container.querySelectorAll('[data-max-font-scale]')].every((node) => node.getAttribute('data-max-font-scale') === '1.2')).toBe(true);

    const perChannel = container.querySelector<HTMLButtonElement>('[data-testid="guide-presentation-per-channel"]');
    if (!perChannel) throw new Error('Missing Per zender tab');
    await act(async () => perChannel.click());

    expect(onSelect).toHaveBeenCalledWith('per-channel');
  });

  it('announces and disables a presentation while its deferred module is loading', async () => {
    await act(async () => {
      root.render(
        <GuidePresentationSelector
          selected="total"
          loadingPresentation="now-next"
          onSelect={() => undefined}
        />,
      );
    });

    const nowNext = container.querySelector<HTMLButtonElement>('[data-testid="guide-presentation-now-next"]');
    expect(nowNext?.getAttribute('aria-busy')).toBe('true');
    expect(nowNext?.disabled).toBe(true);
    expect(nowNext?.textContent).toContain('Laden…');
  });
});
