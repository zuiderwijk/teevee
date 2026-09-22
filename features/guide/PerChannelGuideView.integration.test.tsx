// @vitest-environment jsdom
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Channel, Programme } from '@/data/domain/epg';
import type { PerChannelProgrammeRow } from './perChannel';
import { SchedulePage } from './PerChannelGuideView';

type HostProps = {
  children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
  testID?: string;
  accessibilityLabel?: string;
  accessible?: boolean;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: string;
  style?: unknown | ((state: { pressed: boolean }) => unknown);
  numberOfLines?: number;
  onPress?: () => void;
};

vi.mock('@/theme/useTeeveeTheme', async () => {
  const { lightTheme } = await import('@/theme/tokens');
  return { useTeeveeTheme: () => lightTheme };
});

vi.mock('./ChannelIdentity', () => ({
  ChannelIdentity: () => null,
}));
vi.mock('./GuideChrome', () => ({
  GuideChrome: () => null,
}));
vi.mock('./GuideDaySelector', () => ({
  GuideDaySelector: () => null,
}));
vi.mock('./useGuideClock', () => ({
  useGuideClock: () => Date.parse('2026-09-22T18:45:00.000Z'),
}));
vi.mock('./useGuideDaySelection', () => ({
  useGuideDaySelection: () => ({
    selectedDayStartMs: Date.parse('2026-09-22T04:00:00.000Z'),
    selectDay: vi.fn(),
  }),
}));
vi.mock('./useSelectedGuideDaySchedule', () => ({
  useSelectedGuideDaySchedule: () => ({
    schedule: null,
    editorialSignals: [],
    loading: false,
    unavailable: false,
  }),
}));

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
}));

vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    callback(...args),
}));

vi.mock('react-native', async () => {
  const React = await import('react');

  const View = ({ children, testID, style }: HostProps) =>
    createElement(
      'div',
      {
        'data-testid': testID,
        'data-style': JSON.stringify(style),
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );

  const Text = ({
    children,
    testID,
    accessible,
    accessibilityElementsHidden,
    importantForAccessibility,
    style,
    numberOfLines,
  }: HostProps) =>
    createElement(
      'span',
      {
        'data-testid': testID,
        'data-accessible':
          accessible === undefined ? undefined : String(accessible),
        'data-accessibility-elements-hidden':
          accessibilityElementsHidden === undefined
            ? undefined
            : String(accessibilityElementsHidden),
        'data-important-for-accessibility': importantForAccessibility,
        'data-number-of-lines': numberOfLines,
        'data-style': JSON.stringify(style),
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );

  const Pressable = ({
    children,
    testID,
    accessibilityLabel,
    onPress,
    style,
  }: HostProps) =>
    createElement(
      'button',
      {
        'data-testid': testID,
        'aria-label': accessibilityLabel,
        'data-style': JSON.stringify(
          typeof style === 'function' ? style({ pressed: false }) : style,
        ),
        onClick: onPress,
      },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );

  const ScrollView = forwardRef(function MockScrollView(
    { children, testID }: HostProps,
    _ref,
  ) {
    return createElement(
      'div',
      { 'data-testid': testID },
      typeof children === 'function' ? children({ pressed: false }) : children,
    );
  });

  return {
    Platform: { OS: 'ios' },
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet: {
      create: <T,>(styles: T) => styles,
      hairlineWidth: 1,
    },
    useWindowDimensions: () => ({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    }),
  };
});

vi.mock('react-native-reanimated', async () => {
  const RN = await import('react-native');
  return {
    default: {
      View: RN.View,
      ScrollView: RN.ScrollView,
    },
    useAnimatedReaction: vi.fn(),
    useAnimatedScrollHandler: vi.fn(() => vi.fn()),
    useAnimatedStyle: (callback: () => unknown) => callback(),
    useReducedMotion: () => false,
    useSharedValue: <T,>(value: T) => ({ value }),
  };
});

const channel: Channel = {
  id: 'nl-npo-1',
  name: 'NPO 1',
  displayName: 'NPO 1',
  sortOrder: 0,
  isActive: true,
};

function programme(
  id: string,
  title = 'Programmatitel',
  description?: string,
): Programme {
  return {
    id,
    channelId: channel.id,
    startAt: '2026-09-22T18:30:00.000Z',
    endAt: '2026-09-22T19:30:00.000Z',
    title,
    ...(description ? { description } : {}),
  };
}

function row(
  id: string,
  top: number,
  current = false,
): PerChannelProgrammeRow {
  return {
    programme: programme(
      id,
      'Programma ' + id,
      current ? 'Beschrijving van het actuele programma.' : undefined,
    ),
    top,
    height: current ? 176 : 52,
    current,
    progress: current ? 0.5 : 0,
  };
}

function getByTestId(container: HTMLElement, testID: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(
    `[data-testid="${testID}"]`,
  );
  if (!node) throw new Error('Missing test node: ' + testID);
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
    if (entry && typeof entry === 'object') Object.assign(output, entry);
  };

  merge(value);
  return output;
}

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
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

async function renderPage(
  rows: PerChannelProgrammeRow[],
  ids: ReadonlySet<string>,
  fontScale = 1,
) {
  await act(async () => {
    root.render(
      <SchedulePage
        channel={channel}
        rows={rows}
        width={390}
        fontScale={fontScale}
        kijktipProgrammeIds={ids}
        onSelectProgramme={vi.fn()}
      />,
    );
  });
}

describe('Per-zender Kijktip production presentation', () => {
  it('renders the exact S1 standard-row stack without changing row height', async () => {
    const rows = [row('tip', 0)];

    await renderPage(rows, new Set(['tip']));

    const programmeRow = getByTestId(container, 'per-channel-programme-tip');
    const timeStack = getByTestId(
      container,
      'per-channel-kijktip-time-stack-tip',
    );
    const titleCell = getByTestId(container, 'per-channel-title-cell-tip');
    const content = getByTestId(container, 'per-channel-kijktip-content-tip');
    const time = getByTestId(container, 'per-channel-kijktip-time-tip');
    const label = getByTestId(container, 'per-channel-kijktip-tip');

    expect(programmeRow.getAttribute('data-style')).toContain('"height":52');
    expect(flattenedStyle(timeStack)).toMatchObject({
      left: 16,
      top: 0,
      height: 52,
      minWidth: 56,
      paddingHorizontal: 8,
      paddingTop: 7,
      paddingBottom: 7,
      borderRadius: 6,
      alignItems: 'flex-start',
      backgroundColor: '#E4ECEE',
    });
    expect(flattenedStyle(timeStack).width).toBeUndefined();
    expect(16 + flattenedStyle(timeStack).paddingHorizontal).toBe(24);
    expect(flattenedStyle(content)).toMatchObject({
      alignItems: 'center',
    });
    expect(flattenedStyle(time)).toMatchObject({
      alignSelf: 'flex-start',
      color: '#315A63',
    });
    expect(flattenedStyle(label)).toMatchObject({
      marginTop: 2,
      color: '#315A63',
    });
    expect(flattenedStyle(titleCell)).toMatchObject({
      left: 100,
      right: 24,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    });
    expect(label.getAttribute('data-accessible')).toBe('false');
    expect(label.getAttribute('data-accessibility-elements-hidden')).toBe('true');
    expect(label.getAttribute('data-important-for-accessibility')).toBe('no');
    expect(programmeRow.getAttribute('aria-label')).toBe(
      'NPO 1, Programma tip, Kijktip, 20:30 tot 21:30',
    );
    expect(programmeRow.getAttribute('aria-label')?.match(/Kijktip/g)).toHaveLength(1);
  });

  it('leaves a non-Kijktip row on the existing geometry and semantics', async () => {
    const rows = [row('plain', 0)];

    await renderPage(rows, new Set());

    const programmeRow = getByTestId(container, 'per-channel-programme-plain');
    const timeCell = getByTestId(container, 'per-channel-time-cell-plain');
    const titleCell = getByTestId(container, 'per-channel-title-cell-plain');
    expect(programmeRow.getAttribute('data-style')).toContain('"height":52');
    expect(flattenedStyle(timeCell).left).toBe(24);
    expect(flattenedStyle(titleCell)).toMatchObject({
      left: 100,
      right: 24,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    });
    expect(
      container.querySelector('[data-testid="per-channel-kijktip-plain"]'),
    ).toBeNull();
    expect(programmeRow.getAttribute('aria-label')).toBe(
      'NPO 1, Programma plain, 20:30 tot 21:30',
    );
  });

  it('adds current Kijktip at Y36 while preserving the 176-pt current composition', async () => {
    const rows = [row('current', 0, true)];

    await renderPage(rows, new Set(['current']));

    const programmeRow = getByTestId(
      container,
      'per-channel-programme-current',
    );
    const timeStack = getByTestId(
      container,
      'per-channel-kijktip-time-stack-current',
    );
    const content = getByTestId(container, 'per-channel-kijktip-content-current');
    const time = getByTestId(container, 'per-channel-kijktip-time-current');
    const label = getByTestId(container, 'per-channel-kijktip-current');
    const currentContent = getByTestId(
      container,
      'per-channel-current-content-current',
    );

    expect(programmeRow.getAttribute('data-style')).toContain('"height":176');
    expect(flattenedStyle(timeStack)).toMatchObject({
      left: 16,
      top: 14,
      height: 52,
      minWidth: 56,
      paddingHorizontal: 8,
      paddingTop: 7,
      paddingBottom: 7,
      borderRadius: 6,
      alignItems: 'flex-start',
      backgroundColor: '#E4ECEE',
    });
    expect(flattenedStyle(timeStack).width).toBeUndefined();
    expect(16 + flattenedStyle(timeStack).paddingHorizontal).toBe(24);
    expect(flattenedStyle(content)).toMatchObject({
      alignItems: 'center',
    });
    expect(flattenedStyle(time)).toMatchObject({
      alignSelf: 'flex-start',
      color: '#315A63',
    });
    expect(flattenedStyle(label)).toMatchObject({
      marginTop: 2,
      color: '#315A63',
    });
    expect(flattenedStyle(currentContent)).toMatchObject({
      left: 100,
      right: 24,
      top: 14,
    });
    expect(
      getByTestId(container, 'per-channel-progress-current'),
    ).toBeDefined();
    expect(programmeRow.getAttribute('aria-label')).toBe(
      'NPO 1, Programma current, Kijktip, 20:30 tot 21:30, nu bezig',
    );
  });

  it('renders three independent Kijktips without cumulative row/anchor changes', async () => {
    const rows = [row('one', 0), row('two', 52), row('three', 104)];

    await renderPage(rows, new Set(['one', 'two', 'three']));

    expect(
      container.querySelectorAll(
        'span[data-testid^="per-channel-kijktip-"]:not([data-testid^="per-channel-kijktip-time-"])',
      ),
    ).toHaveLength(3);
    expect(
      getByTestId(container, 'per-channel-programme-one').getAttribute(
        'data-style',
      ),
    ).toContain('"top":0');
    expect(
      getByTestId(container, 'per-channel-programme-two').getAttribute(
        'data-style',
      ),
    ).toContain('"top":52');
    expect(
      getByTestId(container, 'per-channel-programme-three').getAttribute(
        'data-style',
      ),
    ).toContain('"top":104');
  });

  it('updates visible editorial state with the same row objects', async () => {
    const rows = [row('stable', 0)];

    await renderPage(rows, new Set());
    expect(
      container.querySelector('[data-testid="per-channel-kijktip-stable"]'),
    ).toBeNull();

    await renderPage(rows, new Set(['stable']));

    expect(getByTestId(container, 'per-channel-kijktip-stable').textContent).toBe(
      'Kijktip',
    );
    expect(rows[0]?.programme.id).toBe('stable');
    expect(rows[0]?.height).toBe(52);
  });
});
