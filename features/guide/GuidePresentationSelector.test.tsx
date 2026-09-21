// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const viewport = vi.hoisted(() => ({
  width: 390,
  fontScale: 1,
}));

vi.mock('@/theme/useTeeveeTheme', async () => {
  const { lightTheme } = await import('@/theme/tokens');
  return { useTeeveeTheme: () => lightTheme };
});

vi.mock('react-native', () => {
  type HostProps = {
    children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    testID?: string;
    numberOfLines?: number;
    maxFontSizeMultiplier?: number;
    style?: unknown | ((state: { pressed: boolean }) => unknown);
    onPress?: () => void;
    disabled?: boolean;
  };

  const resolvedChildren = (children: HostProps['children']) =>
    typeof children === 'function' ? children({ pressed: false }) : children;

  const View = ({ children, testID, style }: HostProps) =>
    createElement(
      'div',
      {
        'data-testid': testID,
        'data-style': JSON.stringify(style),
      },
      resolvedChildren(children),
    );

  const Text = ({
    children,
    numberOfLines,
    maxFontSizeMultiplier,
  }: HostProps) =>
    createElement(
      'span',
      {
        'data-number-of-lines': numberOfLines,
        'data-max-font-size-multiplier': maxFontSizeMultiplier,
      },
      resolvedChildren(children),
    );

  const Pressable = ({ children, testID, style, onPress, disabled }: HostProps) =>
    createElement(
      'button',
      {
        'data-testid': testID,
        'data-style': JSON.stringify(
          typeof style === 'function' ? style({ pressed: false }) : style,
        ),
        disabled,
        onClick: onPress,
      },
      resolvedChildren(children),
    );

  return {
    View,
    Text,
    Pressable,
    StyleSheet: {
      create: <T,>(styles: T) => styles,
      hairlineWidth: 1,
    },
    useWindowDimensions: () => ({
      width: viewport.width,
      height: 844,
      scale: 3,
      fontScale: viewport.fontScale,
    }),
  };
});

import { GuidePresentationSelector } from './GuidePresentationSelector';

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  viewport.fontScale = 1;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function renderTabs(loadingPresentation: 'now-next' | null = null) {
  return act(async () =>
    root.render(
      <GuidePresentationSelector
        selected="now-next"
        loadingPresentation={loadingPresentation}
        onSelect={vi.fn()}
        variant="tabs"
      />,
    ),
  );
}

describe('GuidePresentationSelector responsive tabs', () => {
  it('uses the standard 48-pt one-line geometry through fontScale 1.35', async () => {
    viewport.fontScale = 1.35;
    await renderTabs();

    const selector = container.querySelector<HTMLElement>(
      '[data-testid="guide-presentation-selector"]',
    );
    expect(selector?.getAttribute('data-style')).toContain('"height":48');

    const labels = [...container.querySelectorAll('span')];
    expect(labels.map((label) => label.textContent)).toEqual([
      'Totaal',
      'Per zender',
      'Nu & Straks',
    ]);
    expect(
      labels.every(
        (label) => label.getAttribute('data-number-of-lines') === '1',
      ),
    ).toBe(true);
    expect(
      labels.every(
        (label) =>
          label.getAttribute('data-max-font-size-multiplier') === '1.2',
      ),
    ).toBe(true);
  });

  it('keeps the full Nu & Straks tab label while its deferred module is loading', async () => {
    viewport.fontScale = 1.8;
    await renderTabs('now-next');

    const labels = [...container.querySelectorAll('span')];
    expect(labels.map((label) => label.textContent)).toEqual([
      'Totaal',
      'Per zender',
      'Nu & Straks',
    ]);

    const nowNext = container.querySelector<HTMLButtonElement>(
      '[data-testid="guide-presentation-now-next"]',
    );
    expect(nowNext?.disabled).toBe(true);
  });

  it('uses 64-pt max-two-line tabs above fontScale 1.35 without abbreviating labels', async () => {
    viewport.fontScale = 1.8;
    await renderTabs();

    const selector = container.querySelector<HTMLElement>(
      '[data-testid="guide-presentation-selector"]',
    );
    expect(selector?.getAttribute('data-style')).toContain('"height":64');

    const labels = [...container.querySelectorAll('span')];
    expect(labels.map((label) => label.textContent)).toEqual([
      'Totaal',
      'Per zender',
      'Nu & Straks',
    ]);
    expect(
      labels.every(
        (label) => label.getAttribute('data-number-of-lines') === '2',
      ),
    ).toBe(true);
  });
});
