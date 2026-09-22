// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER } from './guideVisualMetrics';
import { GuideDaySelector } from './GuideDaySelector';

type StyleValue = Record<string, unknown> | StyleValue[] | null | undefined;
type MockProps = {
  children?: ReactNode;
  testID?: string;
  style?: StyleValue | ((state: { pressed: boolean }) => StyleValue);
  maxFontSizeMultiplier?: number;
  visible?: boolean;
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
  const node = (tag: string) =>
    ({ children, testID, style, maxFontSizeMultiplier }: MockProps) => {
      const resolved =
        typeof style === 'function'
          ? flattenStyle(style({ pressed: false }))
          : flattenStyle(style);
      return createElement(
        tag,
        {
          'data-testid': testID,
          'data-flex-grow': resolved.flexGrow,
          'data-flex-shrink': resolved.flexShrink,
          'data-max-font': maxFontSizeMultiplier,
        },
        children,
      );
    };

  return {
    Pressable: node('button'),
    SafeAreaView: node('div'),
    ScrollView: node('div'),
    Text: node('span'),
    View: node('div'),
    Modal: ({ children, visible }: MockProps) =>
      visible ? createElement('div', null, children) : null,
    StyleSheet: { create: <T,>(styles: T) => styles },
  };
});

vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    colors: {
      text: '#111',
      textSecondary: '#555',
      border: '#ddd',
      surface: '#fff',
      surfaceElevated: '#f5f5f5',
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

describe('GuideDaySelector intrinsic compact allocation', () => {
  it('keeps the full one-line date and chevron intrinsically allocated at Larger Text', async () => {
    const nowMs = Date.parse('2026-09-22T00:00:00.000Z');
    const selectedDayStartMs = Date.parse('2026-09-21T04:00:00.000Z');

    await act(async () => {
      root.render(
        <GuideDaySelector
          selectedDayStartMs={selectedDayStartMs}
          nowMs={nowMs}
          labelVariant="per-channel"
          preserveInlineIntrinsicWidth
          onSelectDay={() => undefined}
        />,
      );
    });

    const control = container.querySelector<HTMLElement>('[data-testid="guide-day-selector"]');
    const group = container.querySelector<HTMLElement>(
      '[data-testid="guide-day-selector-text-group"]',
    );
    const label = container.querySelector<HTMLElement>(
      '[data-testid="guide-day-selector-label"]',
    );
    const chevron = container.querySelector<HTMLElement>(
      '[data-testid="guide-day-selector-chevron"]',
    );

    expect(control?.dataset.flexShrink).toBe('0');
    expect(group?.dataset.flexShrink).toBe('0');
    expect(label?.dataset.flexShrink).toBe('0');
    expect(label?.dataset.maxFont).toBe(
      String(COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER),
    );
    expect(COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER).toBe(1.2);
    expect(label?.textContent).toBe('Ma 21 sep');
    expect(chevron?.textContent).toBe('⌄');
  });
});
