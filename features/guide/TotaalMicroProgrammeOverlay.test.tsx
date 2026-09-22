// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SharedValue } from 'react-native-reanimated';

import type { Programme } from '@/data/domain/epg';

import { TOTAAL_TYPOGRAPHY } from './totaal';
import { deriveTotaalMicroProgrammeMetadata } from './totaalMicroProgrammes';
import { TotaalMicroProgrammeOverlay } from './TotaalMicroProgrammeOverlay';

const themeState = vi.hoisted(() => ({ text: '#111' }));

type StyleValue = Record<string, unknown> | StyleValue[] | null | undefined;
type MockProps = {
  children?: ReactNode;
  testID?: string;
  style?: StyleValue;
  pointerEvents?: string;
  accessible?: boolean;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: string;
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
  const View = ({
    children,
    testID,
    style,
    pointerEvents,
    accessible,
    accessibilityElementsHidden,
    importantForAccessibility,
  }: MockProps) => {
    const resolved = flattenStyle(style);
    const transform = resolved.transform as
      | Array<{ translateX?: number; translateY?: number }>
      | undefined;
    return createElement(
      'div',
      {
        'data-testid': testID,
        'data-pointer-events': pointerEvents,
        'data-accessible': accessible,
        'data-accessibility-hidden': accessibilityElementsHidden,
        'data-important-for-accessibility': importantForAccessibility,
        'data-width': resolved.width,
        'data-opacity': resolved.opacity,
        'data-left': resolved.left,
        'data-background': resolved.backgroundColor,
        'data-translate-x': transform?.[0]?.translateX,
      },
      children,
    );
  };
  const Text = ({ children, style, accessible }: MockProps) => {
    const resolved = flattenStyle(style);
    return createElement(
      'span',
      {
        'data-accessible': accessible,
        'data-font-family': resolved.fontFamily,
        'data-color': resolved.color,
      },
      children,
    );
  };
  return {
    View,
    Text,
    StyleSheet: { create: <T,>(value: T) => value },
  };
});

vi.mock('react-native-reanimated', async () => {
  const { View } = await import('react-native');
  return {
    default: { View },
    useAnimatedStyle: (callback: () => Record<string, unknown>) => callback(),
  };
});

vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    colors: { text: themeState.text },
  }),
}));

const START = Date.parse('2026-09-21T04:00:00.000Z');
function sharedValue(value: number): SharedValue<number> {
  return { value } as unknown as SharedValue<number>;
}

function programme(id: string, startMinutes: number, durationMinutes = 5): Programme {
  return {
    id,
    channelId: 'one',
    title: 'Herhaalde editie',
    startAt: new Date(START + startMinutes * 60_000).toISOString(),
    endAt: new Date(START + (startMinutes + durationMinutes) * 60_000).toISOString(),
  };
}

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  themeState.text = '#111';
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

describe('TotaalMicroProgrammeOverlay', () => {
  it('renders only the bounded member subset while shared geometry keeps the complete run bounds', async () => {
    const programmes = Array.from({ length: 20 }, (_, index) =>
      programme(`p-${index}`, index * 10, 10),
    );
    const run = deriveTotaalMicroProgrammeMetadata(
      new Map([['one', programmes]]),
      3,
      1,
    ).repeatedTitleRuns[0]!;
    const boundedProgrammes = programmes.slice(8, 12);

    await act(async () => {
      root.render(
        <TotaalMicroProgrammeOverlay
          runPresentations={[{ run, programmes: boundedProgrammes }]}
          channelRowIndex={new Map([['one', 0]])}
          windowStartMs={START}
          minuteWidth={3}
          rowHeight={76}
          viewportWidth={300}
          scrollX={sharedValue(120)}
          scrollY={sharedValue(0)}
          contentTopInset={100}
          collapseProgress={sharedValue(0)}
          fontScale={1}
          reduceMotion={false}
        />,
      );
    });

    expect(container.querySelectorAll('[data-testid^="totaal-run-micro-"]')).toHaveLength(0);

    const runViewport = container.querySelector<HTMLElement>(
      `[data-testid="totaal-repeated-run-${run.id}"]`,
    );
    expect(runViewport?.dataset.width).toBe('300');
    expect(run.programmes).toHaveLength(20);

    await act(async () => {
      root.render(
        <TotaalMicroProgrammeOverlay
          runPresentations={[{ run, programmes: [] }]}
          channelRowIndex={new Map([['one', 0]])}
          windowStartMs={START}
          minuteWidth={3}
          rowHeight={76}
          viewportWidth={300}
          scrollX={sharedValue(120)}
          scrollY={sharedValue(0)}
          contentTopInset={100}
          collapseProgress={sharedValue(0)}
          fontScale={1}
          reduceMotion={false}
        />,
      );
    });

    expect(
      container.querySelector(`[data-testid="totaal-repeated-run-${run.id}"]`),
    ).toBeNull();
  });

  it('keeps shared-title presentation pointer-transparent, accessibility-hidden and Medium', async () => {
    const programmes = [
      programme('a', 0),
      programme('b', 5),
      programme('c', 10),
      programme('d', 15),
    ];
    const run = deriveTotaalMicroProgrammeMetadata(
      new Map([['one', programmes]]),
      3,
      1,
    ).repeatedTitleRuns[0]!;
    const scrollX = sharedValue(0);
    const scrollY = sharedValue(0);
    const collapseProgress = sharedValue(0);

    await act(async () => {
      root.render(
        <TotaalMicroProgrammeOverlay
          runPresentations={[{ run, programmes: run.programmes }]}
          channelRowIndex={new Map([['one', 0]])}
          windowStartMs={START}
          minuteWidth={3}
          rowHeight={76}
          viewportWidth={300}
          scrollX={scrollX}
          scrollY={scrollY}
          contentTopInset={100}
          collapseProgress={collapseProgress}
          fontScale={1}
          reduceMotion={false}
        />,
      );
    });

    const rootOverlay = container.querySelector<HTMLElement>(
      '[data-testid="totaal-micro-programme-overlay"]',
    );
    const title = container.querySelector<HTMLElement>(
      `[data-testid="totaal-repeated-title-${run.id}"]`,
    );
    expect(rootOverlay?.dataset.pointerEvents).toBe('none');
    expect(rootOverlay?.dataset.accessibilityHidden).toBe('true');
    expect(rootOverlay?.dataset.importantForAccessibility).toBe('no-hide-descendants');
    expect(title?.dataset.opacity).toBe('1');
    expect(title?.dataset.pointerEvents).toBe('none');
    expect(title?.dataset.accessible).toBe('false');
    expect(title?.dataset.left).toBe('6');
    expect(title?.dataset.background).toBeUndefined();
    expect(title?.querySelector('span')?.dataset.fontFamily).toBe(
      TOTAAL_TYPOGRAPHY.programmeTitle.fontFamily,
    );
    expect(title?.querySelector('span')?.dataset.color).toBe('#111');
  });

  it('uses the semantic primary text token in dark appearance without changing run geometry', async () => {
    themeState.text = '#f5f5f2';
    const programmes = [
      programme('a', 0),
      programme('b', 5),
      programme('c', 10),
      programme('d', 15),
    ];
    const run = deriveTotaalMicroProgrammeMetadata(
      new Map([['one', programmes]]),
      3,
      1,
    ).repeatedTitleRuns[0]!;

    await act(async () => {
      root.render(
        <TotaalMicroProgrammeOverlay
          runPresentations={[{ run, programmes: run.programmes }]}
          channelRowIndex={new Map([['one', 0]])}
          windowStartMs={START}
          minuteWidth={3}
          rowHeight={76}
          viewportWidth={300}
          scrollX={sharedValue(0)}
          scrollY={sharedValue(0)}
          contentTopInset={100}
          collapseProgress={sharedValue(0)}
          fontScale={1}
          reduceMotion={false}
        />,
      );
    });

    const title = container.querySelector<HTMLElement>(
      `[data-testid="totaal-repeated-title-${run.id}"]`,
    );
    expect(title?.dataset.width).toBeUndefined();
    expect(title?.querySelector('span')?.dataset.color).toBe('#f5f5f2');
    expect(title?.querySelector('span')?.dataset.fontFamily).toBe(
      TOTAAL_TYPOGRAPHY.programmeTitle.fontFamily,
    );
  });

  it('keeps a sub-threshold repeated-run remainder visually quiet when its members are ultra-micro', async () => {
    const programmes = [
      programme('a', 0),
      programme('b', 5),
      programme('c', 10),
      programme('d', 15),
    ];
    const run = deriveTotaalMicroProgrammeMetadata(
      new Map([['one', programmes]]),
      3,
      1,
    ).repeatedTitleRuns[0]!;
    const scrollX = sharedValue(20);

    await act(async () => {
      root.render(
        <TotaalMicroProgrammeOverlay
          runPresentations={[{ run, programmes: run.programmes }]}
          channelRowIndex={new Map([['one', 0]])}
          windowStartMs={START}
          minuteWidth={3}
          rowHeight={76}
          viewportWidth={40}
          scrollX={scrollX}
          scrollY={sharedValue(0)}
          contentTopInset={100}
          collapseProgress={sharedValue(0)}
          fontScale={1}
          reduceMotion={false}
        />,
      );
    });

    expect(
      container.querySelector<HTMLElement>(
        `[data-testid="totaal-repeated-title-${run.id}"]`,
      )?.dataset.opacity,
    ).toBe('0');
    expect(
      container.querySelector(`[data-testid="totaal-repeated-run-ellipses-${run.id}"]`),
    ).toBeNull();
    expect(
      container.querySelectorAll('[data-testid^="totaal-run-micro-"]'),
    ).toHaveLength(0);
    expect(run.programmes).toHaveLength(4);
  });
});
