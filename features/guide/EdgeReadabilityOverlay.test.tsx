// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SharedValue } from 'react-native-reanimated';

import type { GuideFixture } from '@/data/domain/epg';

import { EdgeReadabilityOverlay } from './EdgeReadabilityOverlay';
import { guideLayoutForFontScale } from './layout';

type StyleValue = Record<string, unknown> | StyleValue[] | null | undefined;
type MockProps = {
  children?: ReactNode;
  testID?: string;
  style?: StyleValue;
};

function flattenStyle(style: StyleValue): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (result, item) => ({ ...result, ...flattenStyle(item) }),
      {},
    );
  }
  return style;
}

vi.mock('react-native', () => {
  const View = ({ children, testID, style }: MockProps) => {
    const resolved = flattenStyle(style);
    return createElement(
      'div',
      {
        'data-testid': testID,
        'data-width': resolved.width,
        'data-opacity': resolved.opacity,
      },
      children,
    );
  };
  const Text = ({ children }: MockProps) => createElement('span', null, children);
  return {
    View,
    Text,
    StyleSheet: { create: <T,>(styles: T) => styles },
  };
});

vi.mock('react-native-reanimated', async () => {
  const { View } = await import('react-native');
  return {
    default: { View },
    useAnimatedReaction: () => undefined,
    useAnimatedStyle: (callback: () => Record<string, unknown>) => callback(),
  };
});

vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    callback(...args),
}));

vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    colors: {
      text: '#111',
      textSecondary: '#555',
      background: '#f7f7f5',
      border: '#ddd',
    },
  }),
}));

const START = Date.parse('2026-09-22T00:00:00.000Z');
const fixture: GuideFixture = {
  generatedAt: 'test',
  timezone: 'Europe/Amsterdam',
  channels: [
    {
      id: 'one',
      name: 'NPO 1',
      displayName: 'NPO 1',
      sortOrder: 0,
      isActive: true,
    },
  ],
  programmes: [
    {
      id: 'programme-1',
      channelId: 'one',
      title: 'Betekenisvolle titel',
      startAt: new Date(START).toISOString(),
      endAt: new Date(START + 60 * 60_000).toISOString(),
    },
  ],
};

function sharedValue(value: number): SharedValue<number> {
  return { value } as unknown as SharedValue<number>;
}

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

async function renderAt(viewportX: number) {
  await act(async () => {
    root.render(
      <EdgeReadabilityOverlay
        fixture={fixture}
        layout={guideLayoutForFontScale(1)}
        windowStart={START}
        viewportWidth={120}
        nowMs={START}
        scrollX={sharedValue(viewportX)}
        scrollY={sharedValue(0)}
        contentTopInset={100}
        collapseProgress={sharedValue(0)}
        fontScale={1}
        reduceMotion={false}
      />,
    );
  });
}

describe('EdgeReadabilityOverlay', () => {
  it('keeps mask/boundary while suppressing a meaningless tiny title fragment', async () => {
    await renderAt(179);

    const mask = container.querySelector<HTMLElement>(
      '[data-testid="guide-edge-mask-programme-1"]',
    );
    const text = container.querySelector<HTMLElement>(
      '[data-testid="guide-edge-text-programme-1"]',
    );
    const boundary = container.querySelector<HTMLElement>(
      '[data-testid="guide-edge-boundary-programme-1"]',
    );

    expect(mask?.dataset.width).toBe('1');
    expect(mask?.dataset.opacity).toBe('1');
    expect(text?.dataset.opacity).toBe('0');
    expect(text?.querySelector('span')?.textContent).toBe('Betekenisvolle titel');
    expect(boundary?.dataset.opacity).toBe('0.55');
  });

  it('re-anchors the title once the visible remainder reaches 48 pt', async () => {
    await renderAt(132);

    const text = container.querySelector<HTMLElement>(
      '[data-testid="guide-edge-text-programme-1"]',
    );
    expect(text?.dataset.opacity).toBe('1');
    expect(text?.querySelector('span')?.textContent).toBe('Betekenisvolle titel');
  });
});
