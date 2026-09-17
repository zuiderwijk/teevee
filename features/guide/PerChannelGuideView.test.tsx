// @vitest-environment jsdom
import { act, createElement, forwardRef, type ReactNode, useImperativeHandle } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GuideFixture } from '@/data/domain/epg';
import { guideTargetForNow, guideTargetForPrimetime } from './guideDaySelection';
import {
  PER_CHANNEL_VIEWED_TIME_ANCHOR_INSET,
  perChannelMinuteHeightForFontScale,
  scheduleYForTime,
} from './perChannel';
import { PerChannelGuideView } from './PerChannelGuideView';

const testState = vi.hoisted(() => ({
  reduceMotion: false,
  selectDay: vi.fn(),
  scrollCalls: [] as Array<{ testID: string | undefined; args: { x?: number; y?: number; animated?: boolean } }>,
  scrollProps: new Map<string, Record<string, unknown>>(),
}));

const nowMs = Date.parse('2026-09-17T18:15:00.000Z');
const selectedDayStartMs = Date.parse('2026-09-17T04:00:00.000Z');
const nextDayStartMs = Date.parse('2026-09-18T04:00:00.000Z');

const fixture: GuideFixture = {
  generatedAt: '2026-09-17T18:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels: [
    { id: 'npo-1', name: 'NPO 1', displayName: 'NPO 1', shortName: '1', sortOrder: 0, isActive: true },
    { id: 'npo-2', name: 'NPO 2', displayName: 'NPO 2', shortName: '2', sortOrder: 1, isActive: true },
    { id: 'npo-3', name: 'NPO 3', displayName: 'NPO 3', shortName: '3', sortOrder: 2, isActive: true },
  ],
  programmes: [
    {
      id: 'npo1-current', channelId: 'npo-1', title: 'Actueel op NPO 1',
      startAt: '2026-09-17T18:00:00.000Z', endAt: '2026-09-17T19:00:00.000Z',
      description: 'Beschrijving voor het lopende programma.',
    },
    {
      id: 'npo1-next', channelId: 'npo-1', title: 'Hierna op NPO 1',
      startAt: '2026-09-17T19:00:00.000Z', endAt: '2026-09-17T20:00:00.000Z',
    },
    {
      id: 'npo2-current', channelId: 'npo-2', title: 'Actueel op NPO 2',
      startAt: '2026-09-17T18:00:00.000Z', endAt: '2026-09-17T19:30:00.000Z',
      description: 'Lange huidige uitzending met voldoende geometrie voor detail.',
    },
    {
      id: 'npo3-current', channelId: 'npo-3', title: 'Actueel op NPO 3',
      startAt: '2026-09-17T18:00:00.000Z', endAt: '2026-09-17T19:30:00.000Z',
    },
  ],
};

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/features/guide/useGuideClock', () => ({ useGuideClock: () => nowMs }));
vi.mock('@/features/guide/useGuideDaySelection', () => ({
  useGuideDaySelection: () => ({ selectedDayStartMs, selectDay: testState.selectDay }),
}));
vi.mock('@/features/guide/useSelectedGuideDaySchedule', () => ({
  useSelectedGuideDaySchedule: () => ({ schedule: fixture, loading: false, unavailable: false }),
}));
vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    dark: false,
    colors: {
      background: '#fff', surface: '#fff', surfaceElevated: '#f5f5f5',
      text: '#111', textSecondary: '#555', textMuted: '#777', border: '#ddd',
      accent: '#111', currentTime: '#d44', programme: '#eee', programmeCurrent: '#ddd',
    },
  }),
}));
vi.mock('./GuideDaySelector', () => ({
  GuideDaySelector: ({ compactPrefix, onSelectDay }: { compactPrefix?: string; onSelectDay: (value: number) => void }) =>
    createElement('button', {
      'data-testid': 'guide-day-selector',
      'data-compact-prefix': compactPrefix,
      onClick: () => onSelectDay(nextDayStartMs),
    }, 'day'),
}));

vi.mock('react-native', async () => {
  type HostProps = {
    children?: ReactNode;
    testID?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: string;
    accessibilityState?: { selected?: boolean };
    accessibilityElementsHidden?: boolean;
    importantForAccessibility?: string;
    onPress?: () => void;
    onLayout?: (event: { nativeEvent: { layout: { height: number; y?: number } } }) => void;
    onMomentumScrollEnd?: (event: { nativeEvent: { contentOffset: { x: number; y: number } } }) => void;
    onScroll?: unknown;
    source?: { uri?: string };
    onError?: () => void;
    maxFontSizeMultiplier?: number;
    onTextLayout?: (event: { nativeEvent: { lines: unknown[] } }) => void;
  };
  const { useLayoutEffect } = await import('react');
  const host = (tag: string, props: HostProps) => createElement(tag, {
    'data-testid': props.testID,
    'data-max-font-scale': props.maxFontSizeMultiplier,
    'aria-label': props.accessibilityLabel,
    'aria-selected': props.accessibilityState?.selected,
    'data-accessibility-hint': props.accessibilityHint,
    'aria-hidden': props.accessibilityElementsHidden || props.importantForAccessibility === 'no-hide-descendants' ? true : undefined,
    role: props.accessibilityRole,
    onClick: props.onPress,
  }, props.children);
  function View(props: HostProps) {
    useLayoutEffect(() => props.onLayout?.({ nativeEvent: { layout: { height: 62, y: 0 } } }), [props.onLayout]);
    return host('div', props);
  }
  function Text(props: HostProps) {
    useLayoutEffect(() => props.onTextLayout?.({ nativeEvent: { lines: [{}] } }), [props.onTextLayout]);
    return host('span', props);
  }
  const Pressable = (props: HostProps) => host('button', props);
  const Image = (props: HostProps) => createElement('img', { src: props.source?.uri, onError: props.onError });
  const ScrollView = forwardRef(function MockScrollView(props: HostProps, ref) {
    if (props.testID) testState.scrollProps.set(props.testID, props as Record<string, unknown>);
    useImperativeHandle(ref, () => ({
      scrollTo: (args: { x?: number; y?: number; animated?: boolean }) => {
        testState.scrollCalls.push({ testID: props.testID, args });
      },
    }), [props.testID]);
    return host('div', props);
  });
  return {
    View, Text, Pressable, Image, ScrollView, SafeAreaView: View,
    Platform: { OS: 'ios' },
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
    StyleSheet: { create: <T,>(value: T) => value, hairlineWidth: 1, absoluteFill: {} },
  };
});

vi.mock('react-native-reanimated', async () => {
  const { useState } = await import('react');
  const { ScrollView, View } = await import('react-native');
  return {
    default: { ScrollView, View },
    ReduceMotion: { System: 'system' },
    useReducedMotion: () => testState.reduceMotion,
    useSharedValue: function useSharedValue<T>(initial: T) {
      const [value] = useState(() => ({ value: initial }));
      return value;
    },
    useAnimatedScrollHandler: (handlers: unknown) => handlers,
    useAnimatedStyle: (callback: () => unknown) => callback(),
    withSpring: (target: number) => target,
  };
});
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(Date, 'now').mockReturnValue(nowMs);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  testState.reduceMotion = false;
  testState.selectDay.mockReset();
  testState.scrollCalls.length = 0;
  testState.scrollProps.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function getByTestId(id: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!node) throw new Error(`Missing ${id}`);
  return node;
}

async function renderView() {
  await act(async () => {
    root.render(
      <PerChannelGuideView
        guideDataVersion={1}
        headerAction={<div data-testid="presentation-tabs">tabs</div>}
        onSelectProgramme={vi.fn()}
      />,
    );
  });
}

function scheduleHandler() {
  const schedule = testState.scrollProps.get('per-channel-schedule-scroll');
  const handler = schedule?.onScroll as {
    onBeginDrag?: () => void;
    onScroll?: (event: { contentOffset: { y: number } }) => void;
  } | undefined;
  if (!handler?.onScroll) throw new Error('Missing schedule scroll handler');
  return handler;
}

function initialScheduleY() {
  return testState.scrollCalls.find((call) => call.testID === 'per-channel-schedule-scroll')?.args.y ?? 0;
}

describe('PerChannelGuideView canonical production contract', () => {
  it('selects channels directly and keeps full channel identity accessible', async () => {
    await renderView();
    expect(getByTestId('per-channel-channel-npo-1').getAttribute('aria-selected')).toBe('true');

    await act(async () => getByTestId('per-channel-channel-npo-2').click());
    expect(getByTestId('per-channel-channel-npo-2').getAttribute('aria-selected')).toBe('true');
    expect(getByTestId('per-channel-channel-npo-2').getAttribute('aria-label')).toBe('NPO 2');
  });

  it('pages to the adjacent channel without replacing vertical time geometry', async () => {
    await renderView();
    const pager = testState.scrollProps.get('per-channel-pager');
    const onMomentumScrollEnd = pager?.onMomentumScrollEnd as ((event: unknown) => void) | undefined;
    if (!onMomentumScrollEnd) throw new Error('Missing pager momentum handler');

    await act(async () => onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 780, y: 0 } } }));
    expect(getByTestId('per-channel-channel-npo-2').getAttribute('aria-selected')).toBe('true');
  });

  it('preserves day, Primetime and Nu semantics through the production controls', async () => {
    await renderView();
    await act(async () => getByTestId('guide-day-selector').click());
    expect(testState.selectDay).toHaveBeenCalledWith(nextDayStartMs);

    testState.scrollCalls.length = 0;
    await act(async () => getByTestId('per-channel-primetime').click());
    const primetimeTarget = guideTargetForPrimetime(selectedDayStartMs).timeMs;
    const expectedPrimetimeY = Math.max(
      0,
      scheduleYForTime(primetimeTarget, selectedDayStartMs, perChannelMinuteHeightForFontScale(1)) -
        PER_CHANNEL_VIEWED_TIME_ANCHOR_INSET,
    );
    expect(testState.scrollCalls.at(-1)).toEqual({
      testID: 'per-channel-schedule-scroll',
      args: { y: expectedPrimetimeY, animated: true },
    });

    await act(async () => getByTestId('per-channel-now').click());
    const nowTarget = guideTargetForNow(nowMs).timeMs;
    const expectedNowY = Math.max(
      0,
      scheduleYForTime(nowTarget, selectedDayStartMs, perChannelMinuteHeightForFontScale(1)) -
        PER_CHANNEL_VIEWED_TIME_ANCHOR_INSET,
    );
    expect(testState.scrollCalls.at(-1)).toEqual({
      testID: 'per-channel-schedule-scroll',
      args: { y: expectedNowY, animated: true },
    });
  });

  it('uses direct 56pt collapse from the expanded anchor and restores without direction-based hide/reveal', async () => {
    await renderView();
    const anchorY = initialScheduleY();
    const handler = scheduleHandler();

    await act(async () => {
      handler.onBeginDrag?.();
      handler.onScroll?.({ contentOffset: { y: anchorY + 55 } });
    });
    expect(container.querySelector('[data-testid="per-channel-context-condensed"]')).toBeNull();

    await act(async () => handler.onScroll?.({ contentOffset: { y: anchorY + 56 } }));
    expect(getByTestId('per-channel-context-condensed')).not.toBeNull();
    expect(getByTestId('guide-day-selector').getAttribute('data-compact-prefix')).toBe('NPO 1');

    await act(async () => handler.onScroll?.({ contentOffset: { y: anchorY } }));
    expect(container.querySelector('[data-testid="per-channel-context-condensed"]')).toBeNull();
    expect(getByTestId('guide-day-selector').getAttribute('data-compact-prefix')).toBeNull();

    await act(async () => handler.onScroll?.({ contentOffset: { y: Math.max(0, anchorY - 56) } }));
    expect(container.querySelector('[data-testid="per-channel-context-condensed"]')).toBeNull();
  });

  it('uses the discrete 28pt threshold when Reduce Motion is enabled', async () => {
    testState.reduceMotion = true;
    await renderView();
    const anchorY = initialScheduleY();
    const handler = scheduleHandler();

    await act(async () => {
      handler.onBeginDrag?.();
      handler.onScroll?.({ contentOffset: { y: anchorY + 27 } });
    });
    expect(container.querySelector('[data-testid="per-channel-context-condensed"]')).toBeNull();

    await act(async () => handler.onScroll?.({ contentOffset: { y: anchorY + 28 } }));
    expect(getByTestId('per-channel-context-condensed')).not.toBeNull();

    await act(async () => handler.onScroll?.({ contentOffset: { y: anchorY + 27 } }));
    expect(container.querySelector('[data-testid="per-channel-context-condensed"]')).toBeNull();
  });

  it('uses one local current treatment with geometry-gated progress/detail and full accessibility', async () => {
    await renderView();
    const current = getByTestId('per-channel-programme-npo1-current');
    expect(current.getAttribute('aria-label')).toContain('nu bezig');
    expect(current.textContent).not.toContain('Nu bezig');
    expect(container.querySelector('[data-testid="per-channel-progress-npo1-current"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="per-channel-description-npo1-current"]')).toBeNull();

    expect(container.querySelector('[data-testid="per-channel-progress-npo2-current"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="per-channel-description-npo2-current"]')).not.toBeNull();
  });
});
