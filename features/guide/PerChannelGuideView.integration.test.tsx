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
  style?: unknown | ((state: { pressed: boolean }) => unknown);
  numberOfLines?: number;
  onPress?: () => void;
};

vi.mock('@/theme/useTeeveeTheme', async () => {
  const { lightTheme } = await import('@/theme/tokens');
  return { useTeeveeTheme: () => lightTheme };
});

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
    style,
    numberOfLines,
  }: HostProps) =>
    createElement(
      'span',
      {
        'data-testid': testID,
        'data-accessible':
          accessible === undefined ? undefined : String(accessible),
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
    const leading = getByTestId(
      container,
      'per-channel-kijktip-leading-line-tip',
    );
    const label = getByTestId(container, 'per-channel-kijktip-tip');

    expect(programmeRow.getAttribute('data-style')).toContain('"height":52');
    expect(leading.getAttribute('data-style')).toContain('"top":7');
    expect(label.getAttribute('data-style')).toContain('"top":29');
    expect(label.getAttribute('data-accessible')).toBe('false');
    expect(programmeRow.getAttribute('aria-label')).toBe(
      'NPO 1, Programma tip, Kijktip, 20:30 tot 21:30',
    );
    expect(programmeRow.getAttribute('aria-label')?.match(/Kijktip/g)).toHaveLength(1);
  });

  it('leaves a non-Kijktip row on the existing geometry and semantics', async () => {
    const rows = [row('plain', 0)];

    await renderPage(rows, new Set());

    const programmeRow = getByTestId(container, 'per-channel-programme-plain');
    expect(programmeRow.getAttribute('data-style')).toContain('"height":52');
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
    const label = getByTestId(container, 'per-channel-kijktip-current');

    expect(programmeRow.getAttribute('data-style')).toContain('"height":176');
    expect(label.getAttribute('data-style')).toContain('"top":36');
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
      container.querySelectorAll('[data-testid^="per-channel-kijktip-"]:not([data-testid^="per-channel-kijktip-leading-line-"])'),
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
