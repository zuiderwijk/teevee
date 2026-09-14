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

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@/features/guide/useHostedGuideScheduleRuntime', () => ({
  useHostedGuideScheduleRuntime: () => 0,
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
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityElementsHidden?: boolean;
    importantForAccessibility?: string;
    onAccessibilityEscape?: () => void;
    source?: { uri?: string };
    onError?: () => void;
  };
  function View({
    children,
    testID,
    onLayout,
    onAccessibilityEscape,
    accessibilityElementsHidden,
    importantForAccessibility,
  }: HostProps) {
    useLayoutEffect(() => { onLayout?.({ nativeEvent: { layout: { height: 320 } } }); }, [onLayout]);
    const hidden = accessibilityElementsHidden || importantForAccessibility === 'no-hide-descendants';
    return createElement('div', {
      'data-testid': testID,
      'aria-hidden': hidden ? true : undefined,
      'data-important-for-accessibility': importantForAccessibility,
      onKeyDown: (event: { key: string }) => {
        if (event.key === 'Escape') onAccessibilityEscape?.();
      },
    }, children);
  }
  const Text = ({ children, accessible }: HostProps) => createElement('span', {
    'aria-hidden': accessible === false ? true : undefined,
  }, children);
  const Pressable = ({ children, testID, onPress, accessibilityLabel, accessibilityHint }: HostProps) => createElement('button', {
    'data-testid': testID,
    'aria-label': accessibilityLabel,
    'data-accessibility-hint': accessibilityHint,
    onClick: onPress,
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

function click(element: Element | null) {
  expect(element).not.toBeNull();
  act(() => (element as HTMLElement).click());
}

function findByTestId(id: string) {
  return container.querySelector(`[data-testid="${id}"]`);
}

function findButton(label: string) {
  return [...container.querySelectorAll('button')].find((button) => button.textContent === label) ?? null;
}

describe('programme detail rendering boundary', () => {
  it('opens/closes repeatedly without rerendering or remounting the 48-channel Guide', async () => {
    await act(async () => root.render(<GuideScreen />));

    const firstProgramme = guideFixture.programmes[0]!;
    const programmeButton = findByTestId(`programme-${firstProgramme.id}`);
    expect(programmeButton).not.toBeNull();
    const guideBefore = findByTestId('guide-time-scroll');
    expect(guideBefore).not.toBeNull();

    for (let index = 0; index < 3; index += 1) {
      click(programmeButton);
      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
      click(findButton('Sluiten'));
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(findByTestId('guide-time-scroll')).toBe(guideBefore);
    }
  });

  it('exposes self-contained programme labels while hiding duplicated visual rails', async () => {
    await act(async () => root.render(<GuideScreen />));

    const firstProgramme = guideFixture.programmes[0]!;
    const channel = guideFixture.channels.find(({ id }) => id === firstProgramme.channelId)!;
    const programmeButton = findByTestId(`programme-${firstProgramme.id}`);
    expect(programmeButton?.getAttribute('aria-label')).toContain(channel.displayName);
    expect(programmeButton?.getAttribute('data-accessibility-hint')).toBe('Opent programmadetails');
    expect(container.querySelector('[data-testid="guide-channel-scroll"]')?.getAttribute('aria-hidden')).not.toBe('true');
  });

  it('shows the correct next programme and does not dismiss when its text is tapped', async () => {
    await act(async () => root.render(<GuideScreen />));

    const firstProgramme = guideFixture.programmes[0]!;
    click(findByTestId(`programme-${firstProgramme.id}`));

    const channelProgrammes = guideFixture.programmes
      .filter(({ channelId }) => channelId === firstProgramme.channelId)
      .sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt));
    const index = channelProgrammes.findIndex(({ id }) => id === firstProgramme.id);
    const nextProgramme = channelProgrammes[index + 1]!;
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain(nextProgramme.title);

    const titleNode = [...container.querySelectorAll('span')].find((node) => node.textContent === nextProgramme.title);
    titleNode?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe.each([
  ['undefined', undefined],
  ['empty', ''],
  ['whitespace', '   '],
] as const)('programme detail rendering boundary', (_label, description) => {
  it(`handles absent or blank descriptions: ${description ?? 'undefined'}`, async () => {
    const programme = { ...guideFixture.programmes[0]!, description };
    await act(async () => root.render(
      <ProgrammeDetail
        state={{ phase: 'open', selection: { programme, channelName: 'Publiek 1' } }}
        onClose={vi.fn()}
      />,
    ));
    expect(container.textContent).toContain(MISSING_DESCRIPTION);
  });
});

describe('detail swipe wiring with mocked gesture events', () => {
  it('requires a downward start and leaves horizontal/upward starts to fail', async () => {
    const onClose = vi.fn();
    await act(async () => root.render(
      <ProgrammeDetail
        state={{ phase: 'open', selection: { programme: guideFixture.programmes[0]!, channelName: 'Publiek 1' } }}
        onClose={onClose}
      />,
    ));
    expect(motion.gesture?.config.activeOffsetY).toBe(8);
    expect(motion.gesture?.config.failOffsetX).toEqual([-18, 18]);
    expect(motion.gesture?.config.failOffsetY).toEqual([-8, Number.POSITIVE_INFINITY]);
  });

  it('follows the finger, cancels a short drag and retains button/backdrop closing', async () => {
    const onClose = vi.fn();
    await act(async () => root.render(
      <ProgrammeDetail
        state={{ phase: 'open', selection: { programme: guideFixture.programmes[0]!, channelName: 'Publiek 1' } }}
        onClose={onClose}
      />,
    ));
    const gesture = motion.gesture!;
    act(() => gesture.handlers.start?.());
    act(() => gesture.handlers.update?.({ translationY: 54, velocityY: 40, numberOfPointers: 1 }));
    expect(motion.readStyle?.().transform[0]?.translateY).toBe(54);
    act(() => gesture.handlers.end?.({ translationY: 54, velocityY: 40, numberOfPointers: 1 }, true));
    expect(motion.spring).toHaveBeenCalledWith(0);
    expect(onClose).not.toHaveBeenCalled();

    click(findButton('Sluiten'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the panel open after system cancellation', async () => {
    const onClose = vi.fn();
    await act(async () => root.render(
      <ProgrammeDetail
        state={{ phase: 'open', selection: { programme: guideFixture.programmes[0]!, channelName: 'Publiek 1' } }}
        onClose={onClose}
      />,
    ));
    const gesture = motion.gesture!;
    act(() => gesture.handlers.start?.());
    act(() => gesture.handlers.update?.({ translationY: 90, velocityY: 500, numberOfPointers: 1 }));
    act(() => gesture.handlers.end?.({ translationY: 90, velocityY: 500, numberOfPointers: 1 }, false));
    expect(onClose).not.toHaveBeenCalled();
    expect(motion.spring).toHaveBeenCalledWith(0);
  });

  it('keeps the panel open after multiple fingers', async () => {
    const onClose = vi.fn();
    await act(async () => root.render(
      <ProgrammeDetail
        state={{ phase: 'open', selection: { programme: guideFixture.programmes[0]!, channelName: 'Publiek 1' } }}
        onClose={onClose}
      />,
    ));
    const gesture = motion.gesture!;
    act(() => gesture.handlers.start?.());
    act(() => gesture.handlers.update?.({ translationY: 90, velocityY: 500, numberOfPointers: 2 }));
    act(() => gesture.handlers.end?.({ translationY: 90, velocityY: 500, numberOfPointers: 2 }, true));
    expect(onClose).not.toHaveBeenCalled();
    expect(motion.spring).toHaveBeenCalledWith(0);
  });

  it('keeps the panel open after upward reversal', async () => {
    const onClose = vi.fn();
    await act(async () => root.render(
      <ProgrammeDetail
        state={{ phase: 'open', selection: { programme: guideFixture.programmes[0]!, channelName: 'Publiek 1' } }}
        onClose={onClose}
      />,
    ));
    const gesture = motion.gesture!;
    act(() => gesture.handlers.start?.());
    act(() => gesture.handlers.update?.({ translationY: 80, velocityY: 400, numberOfPointers: 1 }));
    act(() => gesture.handlers.update?.({ translationY: -4, velocityY: -120, numberOfPointers: 1 }));
    act(() => gesture.handlers.end?.({ translationY: -4, velocityY: -120, numberOfPointers: 1 }, true));
    expect(onClose).not.toHaveBeenCalled();
    expect(motion.spring).toHaveBeenCalledWith(0);
  });

  it('closes once for a downward flick without a reset or second custom exit animation', async () => {
    const onClose = vi.fn();
    await act(async () => root.render(
      <ProgrammeDetail
        state={{ phase: 'open', selection: { programme: guideFixture.programmes[0]!, channelName: 'Publiek 1' } }}
        onClose={onClose}
      />,
    ));
    const gesture = motion.gesture!;
    act(() => gesture.handlers.start?.());
    act(() => gesture.handlers.update?.({ translationY: 120, velocityY: 900, numberOfPointers: 1 }));
    act(() => gesture.handlers.end?.({ translationY: 120, velocityY: 900, numberOfPointers: 1 }, true));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(motion.spring).not.toHaveBeenCalledWith(0);
  });

  it('keeps accessibility escape available without any swipe', async () => {
    const onClose = vi.fn();
    await act(async () => root.render(
      <ProgrammeDetail
        state={{ phase: 'open', selection: { programme: guideFixture.programmes[0]!, channelName: 'Publiek 1' } }}
        onClose={onClose}
      />,
    ));
    const panel = container.querySelector('[role="dialog"] div');
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
