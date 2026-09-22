// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SharedValue } from 'react-native-reanimated';

import type { GuideFixture } from '@/data/domain/epg';

import { EdgeReadabilityOverlay } from './EdgeReadabilityOverlay';
import { guideLayoutForFontScale } from './layout';
import { totaalEdgeReadableTitleFloor } from './totaal';

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
        'data-padding-x': resolved.paddingHorizontal,
      },
      children,
    );
  };
  const Text = ({ children, testID }: MockProps) =>
    createElement('span', { 'data-testid': testID }, children);
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

async function renderAtRemaining(
  remainingWidth: number,
  fontScale = 1,
) {
  const layout = guideLayoutForFontScale(fontScale);
  const programmeEndX = layout.minuteWidth * 60;

  await act(async () => {
    root.render(
      <EdgeReadabilityOverlay
        fixture={fixture}
        layout={layout}
        windowStart={START}
        viewportWidth={120}
        nowMs={START}
        scrollX={sharedValue(programmeEndX - remainingWidth)}
        scrollY={sharedValue(0)}
        contentTopInset={100}
        collapseProgress={sharedValue(0)}
        fontScale={fontScale}
        reduceMotion={false}
      />,
    );
  });
}

describe('EdgeReadabilityOverlay', () => {
  it('keeps mask/boundary while suppressing a meaningless tiny title fragment', async () => {
    await renderAtRemaining(1);

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
    expect(boundary?.dataset.opacity).toBe('0.55');
  });

  it('reveals the base-scale title only when 48 pt of inner text width remains after compact padding', async () => {
    const floor = totaalEdgeReadableTitleFloor(1);

    await renderAtRemaining(floor.outerWidth - 0.01);
    expect(
      container.querySelector<HTMLElement>(
        '[data-testid="guide-edge-text-programme-1"]',
      )?.dataset.opacity,
    ).toBe('0');

    await renderAtRemaining(floor.outerWidth);
    const mask = container.querySelector<HTMLElement>(
      '[data-testid="guide-edge-mask-programme-1"]',
    );
    const text = container.querySelector<HTMLElement>(
      '[data-testid="guide-edge-text-programme-1"]',
    );

    expect(Number(mask?.dataset.width)).toBeCloseTo(60, 8);
    expect(Number(mask?.dataset.paddingX)).toBe(6);
    expect(
      Number(mask?.dataset.width) - Number(mask?.dataset.paddingX) * 2,
    ).toBe(48);
    expect(text?.dataset.opacity).toBe('1');
  });

  it('scales the usable inner title floor at Larger Text and applies standard padding', async () => {
    const floor = totaalEdgeReadableTitleFloor(1.35);

    await renderAtRemaining(floor.outerWidth);
    const mask = container.querySelector<HTMLElement>(
      '[data-testid="guide-edge-mask-programme-1"]',
    );
    const text = container.querySelector<HTMLElement>(
      '[data-testid="guide-edge-text-programme-1"]',
    );

    expect(Number(mask?.dataset.width)).toBeCloseTo(80.8, 8);
    expect(Number(mask?.dataset.paddingX)).toBe(8);
    expect(
      Number(mask?.dataset.width) - Number(mask?.dataset.paddingX) * 2,
    ).toBeCloseTo(64.8, 8);
    expect(text?.dataset.opacity).toBe('1');
  });

  it('does not show secondary metadata while the remainder is still in compact mode', async () => {
    await renderAtRemaining(63.99);

    expect(
      container.querySelector('[data-testid="guide-edge-secondary-programme-1"]'),
    ).toBeNull();
    expect(
      container.querySelector<HTMLElement>(
        '[data-testid="guide-edge-text-programme-1"]',
      )?.dataset.opacity,
    ).toBe('1');
  });
});
