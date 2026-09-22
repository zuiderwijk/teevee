// @vitest-environment jsdom
import {
  act,
  createElement,
  forwardRef,
  type ForwardedRef,
  type ReactNode,
  useImperativeHandle,
  useState,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';
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
  fixture: null as GuideSchedule | null,
  signals: [] as ProgrammeEditorialSignal[],
  editorialListeners: new Set<() => void>(),
}));
const clock = vi.hoisted(() => ({
  nowMs: Date.parse('2026-09-18T18:17:00.000Z'),
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
  runtimeProgrammeEditorialSignalsFor: () => runtime.signals,
  subscribeRuntimeProgrammeEditorialSignals: (listener: () => void) => {
    runtime.editorialListeners.add(listener);
    return () => runtime.editorialListeners.delete(listener);
  },
}));
vi.mock('@/data/fixtures/runtimeGuideFixture', () => ({
  buildRuntimeGuideFixture: () => runtime.fixture,
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
  ChannelIdentity: ({
    channel,
    accessible = true,
  }: {
    channel: { displayName: string };
    accessible?: boolean;
  }) =>
    createElement('span', {
      'data-channel-identity': channel.displayName,
      'data-channel-accessible': String(accessible),
      'aria-label': accessible ? channel.displayName : undefined,
    }),
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
    numberOfLines?: number;
    ellipsizeMode?: string;
    accessible?: boolean;
    accessibilityElementsHidden?: boolean;
    importantForAccessibility?: string;
    onLayout?: (event: { nativeEvent: { layout: { width: number } } }) => void;
    onTextLayout?: (event: {
      nativeEvent: { lines: { text: string }[] };
    }) => void;
  };

  const View = ({
    children,
    testID,
    accessibilityLabel,
    accessible,
    accessibilityElementsHidden,
    importantForAccessibility,
    style,
    onLayout,
  }: HostProps) => {
    React.useEffect(() => {
      if (onLayout && testID?.includes('kijktip')) {
        onLayout({ nativeEvent: { layout: { width: 44 } } });
      }
    }, [onLayout, testID]);

    return createElement(
      'div',
      {
        'data-testid': testID,
        'aria-label': accessibilityLabel,
        'data-accessible': accessible === undefined ? undefined : String(accessible),
        'data-accessibility-elements-hidden':
          accessibilityElementsHidden === undefined
            ? undefined
            : String(accessibilityElementsHidden),
        'data-important-for-accessibility': importantForAccessibility,
        'data-style': JSON.stringify(style),
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );
  };

  const Text = ({
    children,
    testID,
    numberOfLines,
    ellipsizeMode,
    accessible,
    accessibilityElementsHidden,
    importantForAccessibility,
    style,
    onLayout,
    onTextLayout,
  }: HostProps) => {
    React.useEffect(() => {
      if (onLayout && testID?.includes('kijktip')) {
        onLayout({ nativeEvent: { layout: { width: 44 } } });
      }
    }, [onLayout, testID]);

    React.useEffect(() => {
      if (
        onTextLayout &&
        testID?.includes('kijktip-measure') &&
        typeof children === 'string'
      ) {
        const words = children.split(' ');
        const firstLine = words.slice(0, Math.max(1, words.length - 1)).join(' ');
        const secondLine = words.slice(Math.max(1, words.length - 1)).join(' ');
        onTextLayout({
          nativeEvent: {
            lines: secondLine
              ? [{ text: firstLine }, { text: secondLine }]
              : [{ text: firstLine }],
          },
        });
      }
    }, [children, onTextLayout, testID]);

    return createElement(
      'span',
      {
        'data-testid': testID,
        'data-number-of-lines': numberOfLines,
        'data-ellipsize-mode': ellipsizeMode,
        'data-accessible': accessible === undefined ? undefined : String(accessible),
        'data-accessibility-elements-hidden':
          accessibilityElementsHidden === undefined
            ? undefined
            : String(accessibilityElementsHidden),
        'data-important-for-accessibility': importantForAccessibility,
        'data-style': JSON.stringify(style),
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );
  };

  const Pressable = ({
    children,
    testID,
    accessibilityLabel,
    accessibilityState,
    onPress,
    style,
  }: HostProps) =>
    createElement(
      'button',
      {
        'data-testid': testID,
        'aria-label': accessibilityLabel,
        'aria-selected': accessibilityState?.selected,
        'aria-disabled': accessibilityState?.disabled,
        'data-style': JSON.stringify(
          typeof style === 'function' ? style({ pressed: false }) : style,
        ),
        onClick: onPress,
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );

  const ScrollView = forwardRef(function MockScrollView(
    props: ScrollProps,
    ref: ForwardedRef<{ scrollTo: (options: unknown) => void }>,
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
      const payload = event.nativeEvent ?? {
        contentOffset: event.contentOffset ?? { x: 0, y: 0 },
      };
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

const genericFixture: GuideSchedule = {
  ...schedule,
  generatedAt: '2026-09-18T15:01:00.000Z',
  channels: [
    {
      id: 'fixture-only',
      name: 'Generic fixture',
      displayName: 'Generic fixture',
      sortOrder: 0,
      isActive: true,
    },
  ],
  programmes: [],
};

function kijktipSignal(programmeId: string): ProgrammeEditorialSignal {
  return {
    programmeId,
    type: 'kijktip',
    source: 'tvgids',
    sourceItemId: 'tip-' + programmeId,
    matchedBy: 'channel-title-start',
  };
}

async function publishEditorialSignals(signals: ProgrammeEditorialSignal[]) {
  await act(async () => {
    runtime.signals = signals;
    runtime.editorialListeners.forEach((listener) => listener());
    await Promise.resolve();
  });
}

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

function flattenedStyle(node: HTMLElement): Record<string, unknown> {
  const serialized = node.getAttribute('data-style');
  if (!serialized) return {};
  const value = JSON.parse(serialized) as unknown;
  const output: Record<string, unknown> = {};

  const merge = (entry: unknown) => {
    if (Array.isArray(entry)) {
      entry.forEach(merge);
      return;
    }
    if (entry && typeof entry === 'object') {
      Object.assign(output, entry);
    }
  };

  merge(value);
  return output;
}

function withProgrammeTitle(programmeId: string, title: string): GuideSchedule {
  return {
    ...schedule,
    programmes: schedule.programmes.map((programme) =>
      programme.id === programmeId ? { ...programme, title } : programme,
    ),
  };
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
  runtime.fixture = schedule;
  runtime.signals = [];
  runtime.editorialListeners.clear();
  clock.nowMs = Date.parse('2026-09-18T18:17:00.000Z');
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
    const utilityContext = getByTestId(container, 'now-next-utility-context');
    expect(utilityContext.getAttribute('data-style')).toContain('"height":52');
    expect(
      container.querySelector('[data-testid="now-next-reference-time"]'),
    ).toBeNull();
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

  it('renders reference and following Kijktips from runtime signals with one programme focus target', async () => {
    runtime.signals = [
      kijktipSignal('one-ref'),
      kijktipSignal('one-follow-1'),
      kijktipSignal('one-follow-2'),
      kijktipSignal('one-follow-3'),
    ];

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const reference = getByTestId(container, 'now-next-reference-one-one-ref');
    expect(
      getByTestId(container, 'now-next-reference-kijktip-one-ref').textContent,
    ).toBe('Kijktip');
    expect(
      getByTestId(container, 'now-next-reference-kijktip-one-ref').getAttribute(
        'data-accessible',
      ),
    ).toBe('false');
    const referenceLabel = getByTestId(
      container,
      'now-next-reference-kijktip-one-ref',
    );
    expect(
      referenceLabel.getAttribute('data-accessibility-elements-hidden'),
    ).toBe('true');
    expect(flattenedStyle(referenceLabel)).toMatchObject({
      height: 16,
      paddingHorizontal: 6,
      paddingVertical: 0,
      borderRadius: 4,
      backgroundColor: '#EEECE7',
    });
    expect(
      flattenedStyle(
        getByTestId(container, 'now-next-reference-kijktip-text-one-ref'),
      ).color,
    ).toBe('#315A63');
    expect(reference.getAttribute('aria-label')).toBe(
      'NPO 1, Referentieprogramma, Kijktip, 20:00 tot 20:30, nu bezig',
    );
    expect(reference.getAttribute('aria-label')?.match(/Kijktip/g)).toHaveLength(1);

    for (const id of ['one-follow-1', 'one-follow-2', 'one-follow-3']) {
      const label = getByTestId(container, `now-next-following-kijktip-${id}`);
      expect(label.textContent).toBe('Kijktip');
      expect(label.getAttribute('data-accessible')).toBe('false');
      expect(label.getAttribute('data-accessibility-elements-hidden')).toBe('true');
      expect(label.getAttribute('data-important-for-accessibility')).toBe(
        'no-hide-descendants',
      );
      expect(flattenedStyle(label)).toMatchObject({
        height: 16,
        paddingHorizontal: 6,
        paddingVertical: 0,
        borderRadius: 4,
        marginLeft: 8,
        backgroundColor: '#EEECE7',
      });
      expect(
        flattenedStyle(
          getByTestId(container, `now-next-following-kijktip-text-${id}`),
        ).color,
      ).toBe('#315A63');
    }

    expect(
      getByTestId(
        container,
        'now-next-following-one-0-one-follow-1',
      ).getAttribute('aria-label'),
    ).toBe('NPO 1, Volgend één, Kijktip, 20:30 tot 21:00');
    expect(
      getByTestId(
        container,
        'now-next-following-one-0-one-follow-1',
      ).getAttribute('aria-label')?.match(/Kijktip/g),
    ).toHaveLength(1);

    expect(
      getByTestId(
        container,
        'now-next-following-one-0-one-follow-1',
      ).getAttribute('data-style'),
    ).toContain('"height":44');
  });

  it('keeps a short following Kijktip title intrinsic-width-first with an exact 8-pt label gap', async () => {
    runtime.schedule = withProgrammeTitle('one-follow-1', 'Kort');
    runtime.fixture = runtime.schedule;
    runtime.signals = [kijktipSignal('one-follow-1')];

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const title = getByTestId(
      container,
      'now-next-following-title-one-follow-1',
    );
    const label = getByTestId(
      container,
      'now-next-following-kijktip-one-follow-1',
    );
    const titleStyle = flattenedStyle(title);
    const labelStyle = flattenedStyle(label);

    expect(title.textContent).toBe('Kort');
    expect(titleStyle.flexGrow).toBe(0);
    expect(titleStyle.flex).toBeUndefined();
    expect(titleStyle.flexShrink).toBe(1);
    expect(titleStyle.maxWidth).toBe(154);
    expect(labelStyle).toMatchObject({
      marginLeft: 8,
      paddingHorizontal: 6,
      paddingVertical: 0,
      borderRadius: 4,
      height: 16,
      backgroundColor: '#EEECE7',
    });
  });

  it('bounds a long following title by the protected budget while keeping tail ellipsis ownership', async () => {
    runtime.schedule = withProgrammeTitle(
      'one-follow-1',
      'Een zeer lange programmanaam die nooit de Kijktip mag verdringen',
    );
    runtime.fixture = runtime.schedule;
    runtime.signals = [kijktipSignal('one-follow-1')];

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const title = getByTestId(
      container,
      'now-next-following-title-one-follow-1',
    );
    const label = getByTestId(
      container,
      'now-next-following-kijktip-one-follow-1',
    );

    expect(flattenedStyle(title)).toMatchObject({
      flexGrow: 0,
      flexShrink: 1,
      maxWidth: 154,
    });
    expect(title.getAttribute('data-number-of-lines')).toBe('1');
    expect(title.getAttribute('data-ellipsize-mode')).toBe('tail');
    expect(flattenedStyle(label)).toMatchObject({
      marginLeft: 8,
      paddingHorizontal: 6,
      borderRadius: 4,
      height: 16,
      backgroundColor: '#EEECE7',
    });
  });

  it('keeps the title visible at the exact 48-pt protected boundary', async () => {
    viewport.width = 284;
    runtime.schedule = withProgrammeTitle('one-follow-1', 'Grens');
    runtime.fixture = runtime.schedule;
    runtime.signals = [kijktipSignal('one-follow-1')];

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const title = getByTestId(
      container,
      'now-next-following-title-one-follow-1',
    );
    const label = getByTestId(
      container,
      'now-next-following-kijktip-one-follow-1',
    );

    expect(title.textContent).toBe('Grens');
    expect(flattenedStyle(title).maxWidth).toBe(48);
    expect(flattenedStyle(title).flexGrow).toBe(0);
    expect(flattenedStyle(label)).toMatchObject({
      marginLeft: 8,
      paddingHorizontal: 6,
      borderRadius: 4,
      height: 16,
      backgroundColor: '#EEECE7',
    });
    expect(label.textContent).toBe('Kijktip');
  });

  it('renders one deliberate ellipsis below the 48-pt title budget and keeps the 8-pt Kijktip gap', async () => {
    viewport.width = 283;
    runtime.schedule = withProgrammeTitle('one-follow-1', 'Te smal');
    runtime.fixture = runtime.schedule;
    runtime.signals = [kijktipSignal('one-follow-1')];

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const title = getByTestId(
      container,
      'now-next-following-title-one-follow-1',
    );
    const label = getByTestId(
      container,
      'now-next-following-kijktip-one-follow-1',
    );

    expect(title.textContent).toBe('…');
    expect(flattenedStyle(title).maxWidth).toBe(48);
    expect(flattenedStyle(title).flexGrow).toBe(0);
    expect(flattenedStyle(label)).toMatchObject({
      marginLeft: 8,
      paddingHorizontal: 6,
      borderRadius: 4,
      height: 16,
      backgroundColor: '#EEECE7',
    });
    expect(label.textContent).toBe('Kijktip');
  });

  it('reacts to editorial-only runtime changes without replacing schedule ownership', async () => {
    const originalSchedule = runtime.schedule;

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );
    expect(
      container.querySelector('[data-testid="now-next-reference-kijktip-one-ref"]'),
    ).toBeNull();

    await publishEditorialSignals([kijktipSignal('one-ref')]);

    expect(runtime.schedule).toBe(originalSchedule);
    expect(
      getByTestId(container, 'now-next-reference-kijktip-one-ref').textContent,
    ).toBe('Kijktip');
  });

  it('keeps non-Kijktip programmes visually and semantically unchanged', async () => {
    runtime.signals = [kijktipSignal('unrelated-programme')];

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    expect(
      container.querySelector('[data-testid^="now-next-reference-kijktip-"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid^="now-next-following-kijktip-"]'),
    ).toBeNull();
    expect(
      getByTestId(container, 'now-next-reference-one-one-ref').getAttribute(
        'aria-label',
      ),
    ).toBe('NPO 1, Referentieprogramma, 20:00 tot 20:30, nu bezig');
  });

  it.each([1, 2, 3])(
    'renders %i following Kijktip disclosures independently',
    async (count) => {
      runtime.signals = ['one-follow-1', 'one-follow-2', 'one-follow-3']
        .slice(0, count)
        .map(kijktipSignal);

      await act(async () =>
        root.render(
          <NowNextGuideView
            guideDataVersion={1}
            presentationNavigation={<span />}
            onSelectProgramme={vi.fn()}
          />,
        ),
      );

      expect(
        container.querySelectorAll(
          '[data-testid^="now-next-following-kijktip-one-follow-"]',
        ),
      ).toHaveLength(count);
    },
  );

  it('keeps one Kijktip semantic disclosure when the same programme moves from following to reference', async () => {
    runtime.signals = [kijktipSignal('one-follow-1')];

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const following = getByTestId(
      container,
      'now-next-following-one-0-one-follow-1',
    );
    expect(following.getAttribute('aria-label')).toBe(
      'NPO 1, Volgend één, Kijktip, 20:30 tot 21:00',
    );
    expect(following.getAttribute('aria-label')?.match(/Kijktip/g)).toHaveLength(1);

    clock.nowMs = Date.parse('2026-09-18T18:31:00.000Z');
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const reference = getByTestId(
      container,
      'now-next-reference-one-one-follow-1',
    );
    expect(reference.getAttribute('aria-label')).toBe(
      'NPO 1, Volgend één, Kijktip, 20:30 tot 21:00, nu bezig',
    );
    expect(reference.getAttribute('aria-label')?.match(/Kijktip/g)).toHaveLength(1);
    expect(
      container.querySelector(
        '[data-testid="now-next-following-kijktip-one-follow-1"]',
      ),
    ).toBeNull();
    expect(
      getByTestId(
        container,
        'now-next-reference-kijktip-one-follow-1',
      ).textContent,
    ).toBe('Kijktip');
  });

  it('keeps following Kijktip on the final visible title line in Larger Text without target growth beyond the frozen formula', async () => {
    viewport.fontScale = 1.8;
    runtime.signals = [kijktipSignal('one-follow-1')];

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );
    await act(async () => Promise.resolve());

    expect(
      getByTestId(
        container,
        'now-next-following-one-0-one-follow-1',
      ).getAttribute('data-style'),
    ).toContain('"height":80');
    const firstLine = getByTestId(
      container,
      'now-next-following-title-first-line-one-follow-1',
    );
    const finalLine = getByTestId(
      container,
      'now-next-following-title-one-follow-1',
    );
    expect(firstLine.textContent).toBe('Volgend');
    expect(flattenedStyle(firstLine).flex).toBe(1);
    expect(flattenedStyle(firstLine).maxWidth).toBeUndefined();
    expect(finalLine.textContent).toBe('één');
    expect(flattenedStyle(finalLine)).toMatchObject({
      flexGrow: 0,
      flexShrink: 1,
      maxWidth: 154,
    });
    const largerTextLabel = getByTestId(
      container,
      'now-next-following-kijktip-one-follow-1',
    );
    expect(largerTextLabel.textContent).toBe('Kijktip');
    expect(flattenedStyle(largerTextLabel).height).toBeCloseTo(28.8, 6);
  });

  it('keeps Kijktip inline with the title in the >2.0/<180 stacked fallback', async () => {
    viewport.fontScale = 2.1;
    viewport.width = 300;
    runtime.signals = [kijktipSignal('one-follow-1')];

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );
    await act(async () => Promise.resolve());

    const target = getByTestId(
      container,
      'now-next-following-one-0-one-follow-1',
    );
    expect(target.getAttribute('data-style')).toContain('"height":137');
    const stackedTitle = getByTestId(
      container,
      'now-next-following-title-one-follow-1',
    );
    const stackedLabel = getByTestId(
      container,
      'now-next-following-kijktip-one-follow-1',
    );
    expect(stackedLabel.textContent).toBe('Kijktip');
    expect(flattenedStyle(stackedTitle)).toMatchObject({
      flexGrow: 0,
      flexShrink: 1,
      maxWidth: 124,
    });
    expect(flattenedStyle(stackedLabel).marginLeft).toBe(8);
    expect(
      getByTestId(
        container,
        'now-next-following-content-one-0',
      ).getAttribute('data-style'),
    ).toContain('"justifyContent":"center"');
  });

  it('renders the refined rail labels/ticks and keeps exact live/reference accessibility semantics', async () => {
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    expect(
      container.querySelector('[data-testid="now-next-reference-time"]'),
    ).toBeNull();
    expect(
      getByTestId(container, 'now-next-time-slot-57').getAttribute(
        'aria-selected',
      ),
    ).toBe('true');
    expect(native.railScrollTo).toHaveBeenCalledWith({
      x: 57 * 48,
      animated: false,
    });
    expect(container.textContent).not.toContain('Referentietijd');

    const railTargets = [
      ...container.querySelectorAll<HTMLButtonElement>(
        'button[data-testid^="now-next-time-slot-"]',
      ),
    ];
    expect(railTargets).toHaveLength(96);
    expect(
      railTargets.every((target) =>
        target.getAttribute('aria-label')?.startsWith('Tijd '),
      ),
    ).toBe(true);

    expect(getByTestId(container, 'now-next-time-label-56').textContent).toBe(
      '20:00',
    );
    expect(
      container.querySelector('[data-testid="now-next-time-label-57"]'),
    ).toBeNull();
    expect(getByTestId(container, 'now-next-time-slot-57').getAttribute('aria-label')).toBe(
      'Tijd 20:15',
    );
    expect(getByTestId(container, 'now-next-time-label-58').textContent).toBe(
      '20:30',
    );
    expect(
      container.querySelector('[data-testid="now-next-time-label-59"]'),
    ).toBeNull();

    expect(getByTestId(container, 'now-next-time-tick-56')).toBeDefined();
    expect(getByTestId(container, 'now-next-time-tick-57')).toBeDefined();

    const reference = getByTestId(
      container,
      'now-next-reference-one-one-ref',
    );
    expect(reference.textContent).toBe('Referentieprogramma');
    expect(reference.textContent).not.toContain('tot');
    expect(reference.getAttribute('aria-label')).toBe(
      'NPO 1, Referentieprogramma, 20:00 tot 20:30, nu bezig',
    );

    expect(getByTestId(container, 'now-next-now-current')).toBeDefined();
    expect(
      container.querySelector('[data-testid="now-next-now-return"]'),
    ).toBeNull();
    expect(getByTestId(container, 'now-next-now').getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('wires the PR #100 railTick and larger-text presentation into the rendered view', async () => {
    viewport.fontScale = 1.8;
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    expect(
      getByTestId(container, 'now-next-utility-context').getAttribute(
        'data-style',
      ),
    ).toContain('"height":52');
    expect(
      container.querySelector('[data-testid="now-next-reference-time"]'),
    ).toBeNull();

    const baselineStyle = getByTestId(
      container,
      'now-next-time-rail-baseline',
    ).getAttribute('data-style');
    expect(baselineStyle).toContain('"height":1');
    expect(baselineStyle).toContain('"backgroundColor":"#80807A"');
    expect(baselineStyle).toContain('"opacity":0.78');

    const majorTickStyle = getByTestId(
      container,
      'now-next-time-tick-56',
    ).getAttribute('data-style');
    const quarterTickStyle = getByTestId(
      container,
      'now-next-time-tick-57',
    ).getAttribute('data-style');
    expect(majorTickStyle).toContain('"backgroundColor":"#80807A"');
    expect(majorTickStyle).toContain('"opacity":1');
    expect(quarterTickStyle).toContain('"backgroundColor":"#80807A"');
    expect(quarterTickStyle).toContain('"opacity":0.78');

    const followingTitle = getByTestId(
      container,
      'now-next-following-one-0-one-follow-1',
    ).querySelector('span:last-child');
    expect(followingTitle?.getAttribute('data-number-of-lines')).toBe('2');

    for (const slot of [0, 1, 2]) {
      const contentStyle = getByTestId(
        container,
        `now-next-following-content-one-${slot}`,
      ).getAttribute('data-style');
      expect(contentStyle).toContain('"justifyContent":"center"');
      expect(contentStyle).toContain('"paddingTop":0');
    }
  });

  it('bottom-aligns the reference title and applies standard iOS following offsets inside unchanged targets', async () => {
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    const referenceStyle = getByTestId(
      container,
      'now-next-reference-one-one-ref',
    ).getAttribute('data-style');
    expect(referenceStyle).toContain('"justifyContent":"flex-end"');

    const identityStyle = flattenedStyle(
      getByTestId(container, 'now-next-channel-identity-one'),
    );
    expect(identityStyle).toMatchObject({
      width: 64,
      height: 64,
      marginRight: 16,
      alignItems: 'center',
      justifyContent: 'flex-end',
    });
    expect(
      flattenedStyle(getByTestId(container, 'now-next-channel-one')),
    ).toMatchObject({
      height: 216,
      paddingTop: 8,
      paddingLeft: 20,
      paddingRight: 24,
    });
    expect(
      flattenedStyle(getByTestId(container, 'now-next-channel-identity-two')),
    ).toMatchObject({
      width: 64,
      height: 64,
      marginRight: 16,
      justifyContent: 'flex-end',
    });

    const expectedOffsets = [16, 8, 0];
    for (const slot of [0, 1, 2]) {
      const contentStyle = getByTestId(
        container,
        `now-next-following-content-one-${slot}`,
      ).getAttribute('data-style');
      expect(contentStyle).toContain('"justifyContent":"flex-start"');
      expect(contentStyle).toContain(
        `"paddingTop":${expectedOffsets[slot]}`,
      );

      const targetStyle = getByTestId(
        container,
        `now-next-following-one-${slot}-one-follow-${slot + 1}`,
      ).getAttribute('data-style');
      expect(targetStyle).toContain('"height":44');
    }
  });

  it('recentres live rail exactly once when the nearest quarter changes while exact live semantics continue advancing', async () => {
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
    expect(
      getByTestId(container, 'now-next-time-slot-57').getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      getByTestId(container, 'now-next-reference-one-one-ref').getAttribute(
        'aria-label',
      ),
    ).toContain('nu bezig');

    clock.nowMs = Date.parse('2026-09-18T18:23:00.000Z');
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls + 1);
    expect(native.railScrollTo).toHaveBeenLastCalledWith({
      x: 58 * 48,
      animated: false,
    });
    expect(
      getByTestId(container, 'now-next-time-slot-58').getAttribute('aria-selected'),
    ).toBe('true');

    clock.nowMs = Date.parse('2026-09-18T18:24:00.000Z');
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls + 1);

    clock.nowMs = Date.parse('2026-09-18T18:31:00.000Z');
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls + 1);
    expect(
      getByTestId(
        container,
        'now-next-reference-one-one-follow-1',
      ).getAttribute('aria-label'),
    ).toContain('nu bezig');
  });

  it('stops clock-driven live recentering synchronously when native browse drag begins', async () => {
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
    if (!rail?.onScrollBeginDrag || !rail.onMomentumScrollEnd) {
      throw new Error('Rail interaction handlers missing');
    }
    const initialScrollCalls = native.railScrollTo.mock.calls.length;

    await act(async () => {
      rail.onScrollBeginDrag?.();
    });

    clock.nowMs = Date.parse('2026-09-18T18:23:00.000Z');
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={<span />}
          onSelectProgramme={vi.fn()}
        />,
      ),
    );

    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls);
    expect(
      getByTestId(container, 'now-next-time-slot-57').getAttribute('aria-selected'),
    ).toBe('true');

    await act(async () => {
      rail.onMomentumScrollEnd?.(scrollEvent(58 * 48, 1));
    });
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls);
    expect(
      getByTestId(container, 'now-next-time-slot-58').getAttribute('aria-selected'),
    ).toBe('true');
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
      rail.onMomentumScrollEnd?.(scrollEvent(56 * 48, 1));
    });

    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls);
    expect(
      getByTestId(container, 'now-next-time-slot-56').getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('lets native momentum own a hard fling and reversal until the final settled slot', async () => {
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
    if (
      !rail?.onScrollBeginDrag ||
      !rail.onScrollEndDrag ||
      !rail.onMomentumScrollEnd
    ) {
      throw new Error('Rail momentum handlers missing');
    }

    const initialScrollCalls = native.railScrollTo.mock.calls.length;

    await act(async () => {
      rail.onScrollBeginDrag?.();
      rail.onScrollEndDrag?.(scrollEvent(70 * 48, 2.4));
    });

    // A hard fling has native momentum still in flight. The provisional drag-end
    // offset must not become the semantic reference and must not trigger recentering.
    expect(
      getByTestId(container, 'now-next-time-slot-57').getAttribute('aria-selected'),
    ).toBe('true');
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls);

    await act(async () => {
      // Model a reversal: native momentum ultimately settles before the
      // provisional drag-end offset. Only this final snapped slot may commit.
      rail.onMomentumScrollEnd?.(scrollEvent(54 * 48, -1.2));
    });

    expect(
      getByTestId(container, 'now-next-time-slot-54').getAttribute('aria-selected'),
    ).toBe('true');
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls);
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
      rail.onScrollEndDrag?.(scrollEvent(57 * 48, 0));
    });

    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls);
    expect(
      getByTestId(container, 'now-next-time-slot-57').getAttribute('aria-selected'),
    ).toBe('true');
    const browsedReference = getByTestId(
      container,
      'now-next-reference-one-one-ref',
    );
    expect(browsedReference.textContent).toBe('Referentieprogramma');
    expect(browsedReference.getAttribute('aria-label')).toBe(
      'NPO 1, Referentieprogramma, 20:00 tot 20:30',
    );
    expect(getByTestId(container, 'now-next-now-return')).toBeDefined();
    expect(getByTestId(container, 'now-next-now').getAttribute('aria-selected')).toBe(
      'false',
    );

    await act(async () => {
      getByTestId(container, 'now-next-time-slot-58').click();
    });
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls + 1);
    expect(
      getByTestId(container, 'now-next-time-slot-58').getAttribute('aria-selected'),
    ).toBe('true');

    await act(async () => {
      getByTestId(container, 'now-next-now').click();
    });
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls + 2);
    expect(
      getByTestId(container, 'now-next-time-slot-57').getAttribute('aria-selected'),
    ).toBe('true');
    expect(getByTestId(container, 'now-next-now-current')).toBeDefined();
    expect(getByTestId(container, 'now-next-now').getAttribute('aria-selected')).toBe(
      'true',
    );

    await act(async () => {
      getByTestId(container, 'now-next-primetime').click();
    });
    expect(native.railScrollTo).toHaveBeenCalledTimes(initialScrollCalls + 3);
    expect(
      getByTestId(container, 'now-next-time-slot-58').getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('restores Nu deterministically on the same television day using the frozen wall clock', async () => {
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
    await act(async () => {
      rail.onScrollBeginDrag?.();
      rail.onScrollEndDrag?.(scrollEvent(58 * 48, 0));
    });

    clock.nowMs = Date.parse('2026-09-18T18:17:00.000Z');
    expect(Date.now()).toBe(clock.nowMs);
    const beforeNow = native.railScrollTo.mock.calls.length;
    await act(async () => getByTestId(container, 'now-next-now').click());

    expect(native.railScrollTo).toHaveBeenCalledTimes(beforeNow + 1);
    expect(native.railScrollTo).toHaveBeenLastCalledWith({
      x: 57 * 48,
      animated: true,
    });
    expect(
      getByTestId(container, 'now-next-time-slot-57').getAttribute('aria-selected'),
    ).toBe('true');
    expect(getByTestId(container, 'now-next-now-current')).toBeDefined();
  });

  it('restores Nu deterministically across the 06:00 television-day boundary', async () => {
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
    await act(async () => {
      rail.onScrollBeginDrag?.();
      rail.onScrollEndDrag?.(scrollEvent(58 * 48, 0));
    });

    clock.nowMs = Date.parse('2026-09-19T04:02:00.000Z');
    expect(Date.now()).toBe(clock.nowMs);
    const beforeNow = native.railScrollTo.mock.calls.length;
    await act(async () => getByTestId(container, 'now-next-now').click());

    expect(native.railScrollTo).toHaveBeenCalledTimes(beforeNow + 1);
    expect(native.railScrollTo).toHaveBeenLastCalledWith({
      x: 0,
      animated: false,
    });
    expect(
      getByTestId(container, 'now-next-time-slot-0').getAttribute('aria-selected'),
    ).toBe('true');
    expect(getByTestId(container, 'now-next-now-current')).toBeDefined();
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
      rail.onMomentumScrollEnd?.(scrollEvent(58 * 48, 1));
    });
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);

    await act(async () => getByTestId(container, 'now-next-now').click());
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);

    await act(async () => getByTestId(container, 'now-next-primetime').click());
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);

    await act(async () => getByTestId(container, 'now-next-now').click());
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);

    const settledRail = getByTestId(container, 'now-next-time-rail');
    settledRail.scrollLeft = 57 * 48;
    expect(
      container.querySelector('[data-testid="now-next-reference-time"]'),
    ).toBeNull();

    await act(async () => {
      getByTestId(container, 'now-next-reference-one-one-ref').click();
    });
    expect(selected.at(-1)?.id).toBe('one-ref');
    expect(getByTestId(container, 'mock-detail-close')).toBeDefined();
    await act(async () => getByTestId(container, 'mock-detail-close').click());
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(420);
    expect(getByTestId(container, 'now-next-time-rail')).toBe(settledRail);
    expect(settledRail.scrollLeft).toBe(57 * 48);
    expect(
      container.querySelector('[data-testid="now-next-reference-time"]'),
    ).toBeNull();

    for (const [slot, id] of [
      [0, 'one-follow-1'],
      [1, 'one-follow-2'],
      [2, 'one-follow-3'],
    ] as const) {
      await act(async () => {
        getByTestId(container, `now-next-following-one-${slot}-${id}`).click();
      });
      expect(selected.at(-1)?.id).toBe(id);
      await act(async () => getByTestId(container, 'mock-detail-close').click());
      expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
      expect(channelScroll.scrollTop).toBe(420);
      expect(getByTestId(container, 'now-next-time-rail')).toBe(settledRail);
      expect(settledRail.scrollLeft).toBe(57 * 48);
      expect(
        container.querySelector('[data-testid="now-next-reference-time"]'),
      ).toBeNull();
    }
  });

  it('preserves browse/reference and vertical channel context across fixture-to-hosted replacement', async () => {
    runtime.schedule = null;
    runtime.fixture = schedule;

    const onSelectProgramme = vi.fn();
    const navigation = <span data-testid="shared-presentation-nav">Shared navigation</span>;
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={0}
          presentationNavigation={navigation}
          onSelectProgramme={onSelectProgramme}
        />,
      ),
    );

    const channelScroll = getByTestId(container, 'now-next-channel-scroll');
    channelScroll.scrollTop = 360;
    const rail = native.scrollProps.get('now-next-time-rail');
    if (!rail?.onScrollBeginDrag || !rail.onMomentumScrollEnd) {
      throw new Error('Rail interaction handlers missing');
    }
    await act(async () => {
      rail.onScrollBeginDrag?.();
      rail.onMomentumScrollEnd?.(scrollEvent(58 * 48, 1));
    });
    expect(
      getByTestId(container, 'now-next-time-slot-58').getAttribute('aria-selected'),
    ).toBe('true');

    runtime.schedule = {
      ...schedule,
      generatedAt: '2026-09-18T18:20:00.000Z',
      programmes: schedule.programmes.map((programme) =>
        programme.id === 'one-follow-1'
          ? { ...programme, title: 'Gecorrigeerd volgend programma' }
          : programme,
      ),
    };
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={navigation}
          onSelectProgramme={onSelectProgramme}
        />,
      ),
    );

    expect(
      getByTestId(container, 'now-next-time-slot-58').getAttribute('aria-selected'),
    ).toBe('true');
    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(360);
    expect(container.textContent).toContain('Gecorrigeerd volgend programma');
  });

  it('keeps the established channel catalogue visible through schedule unavailability and recovery', async () => {
    const navigation = (
      <span data-testid="shared-presentation-nav">Shared navigation</span>
    );
    const onSelectProgramme = vi.fn();

    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={0}
          presentationNavigation={navigation}
          onSelectProgramme={onSelectProgramme}
        />,
      ),
    );

    const channelScroll = getByTestId(container, 'now-next-channel-scroll');
    const utilityContext = getByTestId(container, 'now-next-utility-context');
    channelScroll.scrollTop = 360;

    expect(
      container.querySelectorAll('[data-channel-identity][aria-label]'),
    ).toHaveLength(0);

    await act(async () => {
      getByTestId(container, 'now-next-time-slot-58').click();
    });
    expect(
      getByTestId(container, 'now-next-time-slot-58').getAttribute('aria-selected'),
    ).toBe('true');

    runtime.schedule = null;
    runtime.fixture = genericFixture;
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={1}
          presentationNavigation={navigation}
          onSelectProgramme={onSelectProgramme}
        />,
      ),
    );

    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(360);
    expect(getByTestId(container, 'now-next-utility-context')).toBe(
      utilityContext,
    );
    expect(
      getByTestId(container, 'now-next-time-slot-58').getAttribute('aria-selected'),
    ).toBe('true');

    const identities = [
      ...container.querySelectorAll<HTMLElement>('[data-channel-identity]'),
    ].map((node) => node.getAttribute('data-channel-identity'));
    expect(identities).toEqual(['NPO 1', 'NPO 2']);
    expect(identities).not.toContain('Generic fixture');
    expect(
      container.querySelectorAll('[data-channel-identity][aria-label="NPO 1"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-channel-identity][aria-label="NPO 2"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll(
        '[data-testid="now-next-schedule-state-unavailable"]',
      ),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll(
        'button[data-testid^="now-next-reference-"]',
      ),
    ).toHaveLength(0);
    expect(
      container.querySelectorAll(
        'button[data-testid^="now-next-following-"]',
      ),
    ).toHaveLength(0);

    runtime.schedule = {
      ...schedule,
      generatedAt: '2026-09-18T18:30:00.000Z',
    };
    await act(async () =>
      root.render(
        <NowNextGuideView
          guideDataVersion={2}
          presentationNavigation={navigation}
          onSelectProgramme={onSelectProgramme}
        />,
      ),
    );

    expect(getByTestId(container, 'now-next-channel-scroll')).toBe(channelScroll);
    expect(channelScroll.scrollTop).toBe(360);
    expect(getByTestId(container, 'now-next-utility-context')).toBe(
      utilityContext,
    );
    expect(
      getByTestId(container, 'now-next-time-slot-58').getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      container.querySelectorAll(
        '[data-testid="now-next-schedule-state-unavailable"]',
      ),
    ).toHaveLength(0);
    expect(
      container.querySelectorAll('[data-channel-identity][aria-label]'),
    ).toHaveLength(0);
    expect(
      container.querySelectorAll(
        'button[data-testid^="now-next-reference-"]',
      ).length,
    ).toBeGreaterThan(0);
  });

  it('keeps production shell and a single calm data state when canonical programme data is unavailable', async () => {
    runtime.schedule = null;
    runtime.fixture = null;

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
    expect(getByTestId(container, 'now-next-utility-context')).toBeDefined();
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
      x: 58 * 48,
      animated: false,
    });
  });
});
