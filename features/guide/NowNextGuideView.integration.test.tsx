// @vitest-environment jsdom
import {
  act,
  createElement,
  forwardRef,
  type ReactNode,
  useImperativeHandle,
  useState,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GuideSchedule, Programme } from '@/data/domain/epg';

import { NowNextGuideView } from './NowNextGuideView';

type ScrollProps = {
  children?: ReactNode;
  testID?: string;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: (event: unknown) => void;
  onMomentumScrollEnd?: (event: unknown) => void;
  onScroll?: (event: unknown) => void;
  contentContainerStyle?: unknown;
};

const runtime = vi.hoisted(() => ({
  schedule: null as GuideSchedule | null,
}));
const clock = vi.hoisted(() => ({
  nowMs: Date.parse('2026-09-18T18:15:00.000Z'),
}));
const viewport = vi.hoisted(() => ({
  width: 390,
  fontScale: 1,
  platform: 'ios',
  reduceMotion: false,
}));
const native = vi.hoisted(() => ({
  scrollProps: new Map<string, ScrollProps>(),
  railScrollTo: vi.fn(),
}));

vi.mock('@/data/runtime/guideScheduleRuntime', () => ({
  runtimeGuideScheduleFor: () => runtime.schedule,
}));
vi.mock('@/data/fixtures/runtimeGuideFixture', () => ({
  buildRuntimeGuideFixture: () => runtime.schedule,
}));
vi.mock('./useGuideClock', () => ({
  useGuideClock: () => clock.nowMs,
}));
vi.mock('@/theme/useTeeveeTheme', async () => {
  const { lightTheme } = await import('@/theme/tokens');
  return { useTeeveeTheme: () => lightTheme };
});
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
}));
vi.mock('./ChannelIdentity', () => ({
  ChannelIdentity: ({ channel }: { channel: { displayName: string } }) =>
    createElement('span', { 'data-channel-identity': channel.displayName }),
}));

vi.mock('react-native', async () => {
  const React = await import('react');
  type HostProps = {
    children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    testID?: string;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: { selected?: boolean; disabled?: boolean };
    onPress?: () => void;
    style?: unknown | ((state: { pressed: boolean }) => unknown);
    pointerEvents?: string;
  };

  const View = ({ children, testID, accessibilityLabel }: HostProps) =>
    createElement(
      'div',
      {
        'data-testid': testID,
        'aria-label': accessibilityLabel,
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );

  const Text = ({ children, testID }: HostProps) =>
    createElement('span', { 'data-testid': testID }, children);

  const Pressable = ({
    children,
    testID,
    accessibilityLabel,
    accessibilityState,
    onPress,
  }: HostProps) =>
    createElement(
      'button',
      {
        'data-testid': testID,
        'aria-label': accessibilityLabel,
        'aria-selected': accessibilityState?.selected,
        'aria-disabled': accessibilityState?.disabled,
        onClick: onPress,
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );

  const ScrollView = forwardRef(function MockScrollView(
    props: ScrollProps,
    ref: React.ForwardedRef<{ scrollTo: (options: unknown) => void }>,
  ) {
    if (props.testID) native.scrollProps.set(props.testID, props);
    useImperativeHandle(
      ref,
      () => ({
        scrollTo: (options: unknown) => {
          if (props.testID === 'now-next-time-rail') {
            native.railScrollTo(options);
          }
        },
      }),
      [props.testID],
    );
    return createElement(
      'div',
      {
        'data-testid': props.testID,
      },
      props.children,
    );
  });

  return {
    Platform: {
      get OS() {
        return viewport.platform;
      },
    },
    View,
    Text,
    Pressable,
    ScrollView,
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

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  const RN = await import('react-native');

  return {
    default: {
      View: RN.View,
      ScrollView: RN.ScrollView,
      Text: RN.Text,
    },
    useSharedValue: <T,>(initial: T) => {
      const [value] = React.useState(() => ({ value: initial }));
      return value;
    },
    useReducedMotion: () => viewport.reduceMotion,
    useAnimatedStyle: (callback: () => unknown) => callback(),
    useAnimatedReaction: vi.fn(),
    useAnimatedScrollHandler: (handlers: {
      onScroll?: (event: { contentOffset: { x: number; y: number } }) => void;
    }) => (event: {
      nativeEvent?: { contentOffset: { x: number; y: number } };
      contentOffset?: { x: number; y: number };
    }) => {
      const payload = event.nativeEvent ?? event;
      handlers.onScroll?.(payload);
    },
  };
});
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    callback(...args),
}));

const schedule: GuideSchedule = {
  generatedAt: '2026-09-18T15:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels: [
    {
      id: 'one',
      name: 'NPO 1',
      displayName: 'NPO 1',
      sortOrder: 0,
      isActive: true,
    },
    {
      id: 'two',
      name: 'NPO 2',
      displayName: 'NPO 2',
      sortOrder: 1,
      isActive: true,
    },
  ],
  programmes: [
    {
      id: 'one-ref',
      channelId: 'one',
      title: 'Referentieprogramma',
      startAt: '2026-09-18T18:00:00.000Z',
      endAt: '2026-09-18T18:30:00.000Z',
    },
    {
      id: 'one-follow-1',
      channelId: 'one',
      title: 'Volgend één',
      startAt: '2026-09-18T18:30:00.000Z',
      endAt: '2026-09-18T19:00:00.000Z',
    },
    {
      id: 'one-follow-2',
      channelId: 'one',
      title: 'Volgend twee',
      startAt: '2026-09-18T19:00:00.000Z',
      endAt: '2026-09-18T19:30:00.000Z',
    },
    {
      id: 'one-follow-3',
      channelId: 'one',
      title: 'Volgend drie',
      startAt: '2026-09-18T19:30:00.000Z',
      endAt: '2026-09-18T20:00:00.000Z',
    },
    {
      id: 'two-ref',
      channelId: 'two',
      title: 'Tweede zender',
      startAt: '2026-09-18T18:00:00.000Z',
      endAt: '2026-09-18T18:45:00.000Z',
    },
    {
      id: 'two-follow',
      channelId: 'two',
      title: 'Daarna op twee',
      startAt: '2026-09-18T18:45:00.000Z',
      endAt: '2026-09-18T19:30:00.000Z',
    },
  ],
};

function scrollEvent(x: number, velocityX = 0) {
  return {
    nativeEvent: {
      contentOffset: { x, y: 0 },
      velocity: { x: velocityX, y: 0 },
    },
  };
}

function getByTestId(container: HTMLElement, id: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!node) throw new Error(`Missing test node: ${id}`);
  return node;
}

function Harness({
  onSelected,
}: {
  onSelected: (programme: Programme) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  return (
    <>
      <NowNextGuideView
        guideDataVersion={1}
        presentationNavigation={<span data-testid="shared-presentation-nav">Shared navigation</span>}
        onSelectProgramme={({ programme }) => {
          onSelected(programme);
          setDetailOpen(true);
        }}
      />
      {detailOpen ? (
        <button data-testid="mock-detail-close" onClick={() => setDetailOpen(false)}>
          Detail sluiten
        </button>
      ) : null}
    </>
  );
}

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(Date, 'now').mockImplementation(() => clock.nowMs);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  runtime.schedule = schedule;
  clock.nowMs = Date.parse('2026-09-18T18:15:00.000Z');
  viewport.width = 390;
  viewport.fontScale = 1;
  viewport.platform = 'ios';
  viewport.reduceMotion = false;
  native.scrollProps.clear();
  native.railScrollTo.mockClear();

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

describe('Nu & Straks production interaction boundary', () => {
  it('uses shared Guide chrome and renders exactly three following slot geometries', async () => {
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span data-testid="shared-presentation-nav">Shared navigation</span>}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    expect(getByTestId(container, 'shared-presentation-nav')).toBeDefined();
    expect(container.textContent).not.toContain('TEEVEE');
    expect(getByTestId(container, 'now-next-reference-context')).toBeDefined();
    expect(getByTestId(container, 'now-next-time-rail-shell')).toBeDefined();

    expect(
      container.querySelectorAll('[data-testid^="now-next-following-one-"]'),
    ).toHaveLength(3);
    expect(
      container.querySelectorAll('[data-testid^="now-next-following-two-"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid^="now-next-following-empty-two-"]'),
    ).toHaveLength(2);
  });

  it('commits native rail momentum semantically without a secondary scrollTo', async () => {
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const initialScrollCalls = native.railScrollTo.mock.calls.length;
    const rail = native.scrollProps.get('now-next-time-rail');
    if (!rail?.onScrollBeginDrag || !rail.onMomentumScrollEnd) {
      throw new Error('Rail interaction handlers missing');
    }

    await act(async () => {
      rail.onScrollBeginDrag?.();
      rail.onMomentumScrollEnd?.(scrollEvent(28 * 76, 1));
    });

    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls);
    expect(getByTestId(container, 'now-next-reference-time').textContent).toBe('20:00');
  });

  it('commits a no-momentum drag and lets explicit slot/Nu/Primetime actions recenter', async () => {
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const rail = native.scrollProps.get('now-next-time-rail');
    if (!rail?.onScrollBeginDrag || !rail.onScrollEndDrag) {
      throw new Error('Rail drag handlers missing');
    }

    const initialScrollCalls = native.railScrollTo.mock.calls.length;
    await act(async () => {
      rail.onScrollBeginDrag?.();
      rail.onScrollEndDrag?.(scrollEvent(27 * 76, 0));
    });

    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls);
    expect(getByTestId(container, 'now-next-reference-time').textContent).toBe('19:30');

    await act(async () => {
      getByTestId(container, 'now-next-time-slot-29').click();
    });
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls + 1);
    expect(getByTestId(container, 'now-next-reference-time').textContent).toBe('20:30');

    await act(async () => {
      getByTestId(container, 'now-next-now').click();
    });
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls + 2);
    expect(getByTestId(container, 'now-next-reference-time').textContent).toBe('Nu · 20:15');

    await act(async () => {
      getByTestId(container, 'now-next-primetime').click();
    });
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls + 3);
    expect(getByTestId(container, 'now-next-reference-time').textContent).toBe('20:30');
  });

  it('preserves vertical channel context through rail, Nu, Primetime and Programme Detail round-trips', async () => {
    const selected: Programme[] = [];
    await act(async () =>
      root.render(<Harness onSelected={(programme) => selected.push(programme)} />),
    );

    const channelScroll = getByTestId(container, 'now-next-channel-scroll');
    channelScroll.scrollTop = 420;

    const rail = native.scrollProps.get('now-next-time-rail');
    if (!rail?.onScrollBeginDrag || !rail.onMomentumScrollEnd) {
      throw new Error('Rail interaction handlers missing');
    }
    await act(async () => {
      rail.onScrollBeginDrag?.();
      rail.onMomentumScrollEnd?.(scrollEvent(29 * 76, 1));
    });
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);

    await act(async () => getByTestId(container, 'now-next-now').click());
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);

    await act(async () => getByTestId(container, 'now-next-primetime').click());
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);

    await act(async () => {
      getByTestId(container, 'now-next-reference-one-one-ref').click();
    });
    expect(selected.at(-1)?.id).toBe('one-ref');
    expect(getByTestId(container, 'mock-detail-close')).toBeDefined();
    await act(async () => getByTestId(container, 'mock-detail-close').click());
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);

    await act(async () => {
      getByTestId(container, 'now-next-following-one-0-one-follow-1').click();
    });
    expect(selected.at(-1)?.id).toBe('one-follow-1');
    await act(async () => getByTestId(container, 'mock-detail-close').click());
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);
  });

  it('keeps production shell and a single calm data state when canonical programme data is unavailable', async () => {
    runtime.schedule = null;

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={2}
          presentationNavigation={<span data-testid="shared-presentation-nav">Shared navigation</span>}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    expect(getByTestId(container, 'shared-presentation-nav')).toBeDefined();
    expect(getByTestId(container, 'now-next-reference-context')).toBeDefined();
    expect(getByTestId(container, 'now-next-time-rail-shell')).toBeDefined();
    expect(
      container.querySelectorAll('[data-testid="now-next-schedule-state-unavailable"]'),
    ).toHaveLength(1);
  });

  it('uses non-animated explicit recentering under Reduce Motion', async () => {
    viewport.reduceMotion = true;
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    native.railScrollTo.mockClear();
    await act(async () => getByTestId(container, 'now-next-primetime').click());
    expect(native.railScrollTo).toHaveBeenCalledWith({
      x: 29 * 76,
      animated: false,
    });
  });
});
