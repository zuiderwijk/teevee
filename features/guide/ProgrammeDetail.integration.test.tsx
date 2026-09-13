// @vitest-environment jsdom
// Actual React components with mocked native hosts, gestures and animation.
// These tests do NOT measure native gesture arbitration, layout or latency.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GuideScreen from '@/app/index';
import { guideFixture } from '@/data/fixtures/guideFixture';
import { useGuideClock } from '@/features/guide/useGuideClock';

import { MISSING_DESCRIPTION, ProgrammeDetail } from './ProgrammeDetail';

type PanEvent = { translationY: number; velocityY: number; numberOfPointers: number };
type GestureCallbacks = {
  begin?: () => void;
  start?: () => void;
  update?: (event: PanEvent) => void;
  end?: (event: PanEvent, success: boolean) => void;
  finalize?: () => void;
  touches?: (event: { numberOfTouches: number }) => void;
};
type TestGesture = { config: Record<string, unknown>; handlers: GestureCallbacks };
const motion = vi.hoisted(() => ({
  gesture: null as TestGesture | null,
  readStyle: null as (() => { transform: { translateY: number }[] }) | null,
  spring: vi.fn((target: number) => target),
  cancel: vi.fn(),
}));

vi.mock('@/features/guide/useGuideClock', () => ({
  useGuideClock: vi.fn(() => Date.parse('2026-09-13T08:00:00+02:00')),
}));
vi.mock('@/theme/useTeeveeTheme', async () => {
  const { lightTheme } = await import('@/theme/tokens');
  return { useTeeveeTheme: () => lightTheme };
});
vi.mock('react-native', async () => {
  const { createElement, forwardRef, useEffect, useLayoutEffect } = await import('react');
  type HostProps = {
    children?: ReactNode;
    testID?: string;
    onPress?: () => void;
    onRequestClose?: () => void;
    onShow?: () => void;
    onLayout?: (event: { nativeEvent: { layout: { height: number } } }) => void;
    visible?: boolean;
    animationType?: string;
    accessibilityLabel?: string;
    onAccessibilityEscape?: () => void;
    source?: { uri?: string };
    onError?: () => void;
  };
  function View({ children, testID, onLayout, onAccessibilityEscape }: HostProps) {
    useLayoutEffect(() => { onLayout?.({ nativeEvent: { layout: { height: 320 } } }); }, [onLayout]);
    return createElement('div', { 'data-testid': testID, onKeyDown: (event: { key: string }) => {
      if (event.key === 'Escape') onAccessibilityEscape?.();
    } }, children);
  }
  const Text = ({ children }: HostProps) => createElement('span', null, children);
  const Pressable = ({ children, testID, onPress, accessibilityLabel }: HostProps) => createElement('button', {
    'data-testid': testID, 'aria-label': accessibilityLabel, onClick: onPress,
  }, children);
  const Image = ({ testID, source, onError }: HostProps) => createElement('img', {
    'data-testid': testID,
    src: source?.uri,
    onError,
  });
  const ScrollView = forwardRef<HTMLDivElement, HostProps>(function MockScrollView({ children, testID }, ref) {
    return createElement('div', { ref, 'data-testid': testID }, children);
  });
  function Modal({ children, visible, onRequestClose, onShow, animationType }: HostProps) {
    // Native onShow arrives after presentation, not during the parent's layout effect.
    useEffect(() => { if (visible) onShow?.(); }, [visible, onShow]);
    return visible ? createElement('section', { role: 'dialog', 'data-animation': animationType },
      createElement('button', { 'data-testid': 'native-request-close', onClick: onRequestClose }, 'Native close'),
      children,
    ) : null;
  }
  return {
    View, Text, Image, Pressable, ScrollView, Modal, SafeAreaView: View,
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
    StyleSheet: { create: <T,>(value: T) => value, hairlineWidth: 1, absoluteFill: {} },
  };
});
vi.mock('react-native-gesture-handler', async () => {
  const { View } = await import('react-native');
  class MockPan {
    config: Record<string, unknown> = {};
    handlers: GestureCallbacks = {};
    enabled(value: boolean) { this.config.enabled = value; return this; }
    maxPointers(value: number) { this.config.maxPointers = value; return this; }
    activeOffsetY(value: number) { this.config.activeOffsetY = value; return this; }
    failOffsetX(value: number[]) { this.config.failOffsetX = value; return this; }
    failOffsetY(value: number[]) { this.config.failOffsetY = value; return this; }
    shouldCancelWhenOutside(value: boolean) { this.config.shouldCancelWhenOutside = value; return this; }
    onBegin(callback: NonNullable<GestureCallbacks['begin']>) { this.handlers.begin = callback; return this; }
    onStart(callback: NonNullable<GestureCallbacks['start']>) { this.handlers.start = callback; return this; }
    onUpdate(callback: NonNullable<GestureCallbacks['update']>) { this.handlers.update = callback; return this; }
    onEnd(callback: NonNullable<GestureCallbacks['end']>) { this.handlers.end = callback; return this; }
    onFinalize(callback: NonNullable<GestureCallbacks['finalize']>) { this.handlers.finalize = callback; return this; }
    onTouchesDown(callback: NonNullable<GestureCallbacks['touches']>) { this.handlers.touches = callback; return this; }
  }
  return {
    Gesture: { Pan: () => new MockPan() },
    GestureHandlerRootView: View,
    GestureDetector: ({ children, gesture }: { children: ReactNode; gesture: TestGesture }) => {
      motion.gesture = gesture;
      return children;
    },
  };
});
vi.mock('react-native-reanimated', async () => {
  const { useState } = await import('react');
  const { ScrollView, Text, View } = await import('react-native');
  return {
    default: { View, ScrollView, Text },
    useSharedValue: function useSharedValue<T>(initial: T) {
      const [value] = useState(() => ({ value: initial }));
      return value;
    },
    useAnimatedScrollHandler: (handlers: unknown) => handlers,
    useAnimatedReaction: vi.fn(),
    useAnimatedStyle: (callback: NonNullable<typeof motion.readStyle>) => {
      motion.readStyle = callback;
      return callback();
    },
    withSpring: motion.spring,
    cancelAnimation: motion.cancel,
    ReduceMotion: { System: 'system' },
  };
});
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    queueMicrotask(() => callback(...args)),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-13T08:00:00+02:00'));
  vi.mocked(useGuideClock).mockClear();
  motion.gesture = null;
  motion.readStyle = null;
  motion.spring.mockClear();
  motion.cancel.mockClear();
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
  const element = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!element) throw new Error(`Missing test node: ${id}`);
  return element;
}
async function click(id: string) { await act(async () => getByTestId(id).click()); }
function getGesture(): TestGesture {
  if (!motion.gesture) throw new Error('No attached detail pan gesture');
  return motion.gesture;
}
function offsetY() { return motion.readStyle?.().transform[0]?.translateY; }
async function swipe(distance: number, velocity = 0, success = true, pointers = 1) {
  const { handlers } = getGesture();
  const event = { translationY: distance, velocityY: velocity, numberOfPointers: pointers };
  await act(async () => {
    handlers.begin?.();
    handlers.start?.();
    if (pointers > 1) handlers.touches?.({ numberOfTouches: pointers });
    handlers.update?.(event);
    handlers.end?.(event, success);
    handlers.finalize?.();
  });
}

describe('programme detail rendering boundary', () => {
  it('opens/closes repeatedly without rerendering or remounting the 48-channel Guide', async () => {
    await act(async () => root.render(<GuideScreen />));
    const timeScroll = getByTestId('guide-time-scroll');
    const channelScroll = getByTestId('guide-channel-scroll');
    timeScroll.scrollLeft = 650;
    channelScroll.scrollTop = 900;
    const renderCount = vi.mocked(useGuideClock).mock.calls.length;
    expect(renderCount).toBeGreaterThan(0);
    expect(guideFixture.channels).toHaveLength(48);
    expect(container.querySelectorAll('[data-testid^="programme-channel-"]').length).toBeGreaterThan(1000);

    const first = guideFixture.programmes[0]!;
    for (const closeId of ['programme-detail-close', 'programme-detail-backdrop', 'native-request-close', 'swipe']) {
      await click(`programme-${first.id}`);
      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
      expect(container.querySelector('[role="dialog"]')?.getAttribute('data-animation')).toBe('slide');
      expect(offsetY()).toBe(0);
      expect(getByTestId('programme-detail-sheet').textContent).toContain(first.title);
      expect(getByTestId('programme-detail-sheet').textContent).toContain(MISSING_DESCRIPTION);
      expect(vi.mocked(useGuideClock)).toHaveBeenCalledTimes(renderCount);
      if (closeId === 'swipe') await swipe(100); else await click(closeId);
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(vi.mocked(useGuideClock)).toHaveBeenCalledTimes(renderCount);
      expect(getByTestId('guide-time-scroll')).toBe(timeScroll);
      expect(getByTestId('guide-channel-scroll')).toBe(channelScroll);
      expect(timeScroll.scrollLeft).toBe(650);
      expect(channelScroll.scrollTop).toBe(900);
    }
    await click(`programme-${first.id}`);
    expect(offsetY()).toBe(0);
  });

  it('shows the correct next programme and does not dismiss when its text is tapped', async () => {
    await act(async () => root.render(<GuideScreen />));
    const first = guideFixture.programmes[0]!;
    const second = guideFixture.programmes.find((programme) => programme.description !== undefined)!;
    await click(`programme-${first.id}`);
    await click('programme-detail-close');
    await click(`programme-${second.id}`);
    const sheet = getByTestId('programme-detail-sheet');
    expect(sheet.textContent).toContain(second.title);
    expect(sheet.textContent).toContain(second.description);
    await act(async () => sheet.querySelector('span')!.click());
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it.each([undefined, '', '   '])('handles absent or blank descriptions: %s', async (description) => {
    const programme = { id: 'missing', channelId: 'test', title: 'Zonder tekst', startAt: '2026-09-13T18:00:00Z', endAt: '2026-09-13T19:00:00Z', ...(description === undefined ? {} : { description }) };
    await act(async () => root.render(<ProgrammeDetail state={{ visible: true, selection: { programme, channelName: 'Testzender' } }} onClose={vi.fn()} />));
    expect(getByTestId('programme-detail-sheet').textContent).toContain(MISSING_DESCRIPTION);
  });
});

describe('detail swipe wiring with mocked gesture events', () => {
  async function openDetail(onClose = vi.fn()) {
    await act(async () => root.render(<ProgrammeDetail state={{ visible: true, selection: { programme: guideFixture.programmes[0]!, channelName: 'Testzender' } }} onClose={onClose} />));
    return onClose;
  }

  it('requires a downward start and leaves horizontal/upward starts to fail', async () => {
    await openDetail();
    expect(getGesture().config).toMatchObject({ enabled: true, maxPointers: 1, activeOffsetY: 10, failOffsetX: [-18, 18], failOffsetY: [-10, 100000] });
  });

  it('follows the finger, cancels a short drag and retains button/backdrop closing', async () => {
    const onClose = await openDetail();
    const { handlers } = getGesture();
    await act(async () => {
      handlers.begin?.(); handlers.start?.();
      handlers.update?.({ translationY: 40, velocityY: 0, numberOfPointers: 1 });
    });
    expect(offsetY()).toBe(40);
    await act(async () => {
      handlers.end?.({ translationY: 40, velocityY: 0, numberOfPointers: 1 }, true);
      handlers.finalize?.();
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(offsetY()).toBe(0);
    expect(motion.spring).toHaveBeenCalledWith(0, { overshootClamping: true, reduceMotion: 'system' });
    await click('programme-detail-backdrop');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each(['system cancellation', 'multiple fingers', 'upward reversal'])('keeps the panel open after %s', async (reason) => {
    const onClose = await openDetail();
    await swipe(120, reason === 'upward reversal' ? -500 : 1200, reason !== 'system cancellation', reason === 'multiple fingers' ? 2 : 1);
    expect(onClose).not.toHaveBeenCalled();
    expect(offsetY()).toBe(0);
    expect(motion.spring).toHaveBeenCalled();
  });

  it('closes once for a downward flick without a reset or second custom exit animation', async () => {
    const onClose = await openDetail();
    await swipe(30, 1200);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(offsetY()).toBe(30);
    expect(motion.spring).not.toHaveBeenCalled();
    await click('programme-detail-close');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps accessibility escape available without any swipe', async () => {
    const onClose = await openDetail();
    await act(async () => getByTestId('programme-detail-sheet').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
