// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GuideSchedule } from '@/data/domain/epg';
import type { ProgrammeClassification } from '@/data/domain/programmeClassification';
import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  programmeSnapshot,
  withProgrammeSaved,
  type ProgrammePersonalState,
} from '@/features/guide/programmePersonalState';
import type { TonightRuntimeSnapshot } from './tonightRuntime';

const router = vi.hoisted(() => ({ push: vi.fn() }));
const runtimeActions = vi.hoisted(() => ({
  refresh: vi.fn(),
  ensureTelevisionDay: vi.fn(),
}));
const runtimeState = vi.hoisted(() => ({
  snapshot: {
    phase: 'idle',
    televisionDayStartMs: null,
    data: null,
  } as TonightRuntimeSnapshot,
}));
const personal = vi.hoisted(() => ({
  state: null as ProgrammePersonalState | null,
}));
const clock = vi.hoisted(() => ({
  nowMs: Date.parse('2026-09-23T20:30:00+02:00'),
}));

vi.mock('expo-router', async () => {
  const React = await import('react');
  return {
    useRouter: () => router,
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(callback, [callback]);
    },
  };
});
vi.mock('@/features/guide/useGuideClock', () => ({
  useGuideClock: () => clock.nowMs,
}));
vi.mock('./tonightRuntime', async () => {
  const actual = await vi.importActual<typeof import('./tonightRuntime')>(
    './tonightRuntime',
  );
  return {
    ...actual,
    tonightRuntime: runtimeActions,
    useTonightRuntime: () => runtimeState.snapshot,
  };
});
vi.mock('@/services/storage/programmePersonalStateStorage', () => ({
  readProgrammePersonalState: () =>
    personal.state ?? EMPTY_PROGRAMME_PERSONAL_STATE,
}));
vi.mock('@/theme/useTeeveeTheme', async () => {
  const { lightTheme } = await import('@/theme/tokens');
  return { useTeeveeTheme: () => lightTheme };
});
vi.mock('@/components/SettingsButton', () => ({
  SettingsButton: () => createElement('button', null, 'Instellingen'),
}));
vi.mock('@/features/guide/ChannelIdentity', () => ({
  ChannelIdentity: ({ channel }: { channel: { displayName: string } }) =>
    createElement('span', null, channel.displayName),
}));
vi.mock('@/features/guide/ProgrammeDetail', () => ({
  ProgrammeDetail: ({
    state,
    onClose,
  }: {
    state: {
      visible: boolean;
      selection: { programme: { id: string } } | null;
    };
    onClose: () => void;
  }) =>
    state.visible
      ? createElement(
          'button',
          {
            'data-testid': 'tonight-detail-open',
            onClick: onClose,
          },
          state.selection?.programme.id ?? 'detail',
        )
      : null,
}));

vi.mock('react-native', async () => {
  type HostProps = {
    children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    testID?: string;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityLiveRegion?: string;
    accessible?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
  };

  const childrenFor = (children: HostProps['children']) =>
    typeof children === 'function' ? children({ pressed: false }) : children;

  const View = ({
    children,
    testID,
    accessibilityLabel,
    accessible,
    accessibilityLiveRegion,
  }: HostProps) =>
    createElement(
      'div',
      {
        'data-testid': testID,
        'aria-label': accessibilityLabel,
        'aria-hidden': accessible === false ? true : undefined,
        'aria-live':
          accessibilityLiveRegion === 'polite' ? 'polite' : undefined,
      },
      childrenFor(children),
    );

  const Text = ({
    children,
    testID,
    accessibilityRole,
    accessibilityLabel,
    onLongPress,
  }: HostProps) =>
    createElement(
      accessibilityRole === 'header' ? 'h2' : 'span',
      {
        'data-testid': testID,
        'aria-label': accessibilityLabel,
        onDoubleClick: onLongPress,
      },
      childrenFor(children),
    );

  const Pressable = ({
    children,
    testID,
    accessibilityLabel,
    accessibilityHint,
    onPress,
  }: HostProps) =>
    createElement(
      'button',
      {
        'data-testid': testID,
        'aria-label': accessibilityLabel,
        'data-accessibility-hint': accessibilityHint,
        onClick: onPress,
      },
      childrenFor(children),
    );

  const ScrollView = ({ children, testID }: HostProps) =>
    createElement('div', { 'data-testid': testID }, childrenFor(children));

  return {
    AppState: {
      addEventListener: () => ({ remove: vi.fn() }),
    },
    Pressable,
    ScrollView,
    StyleSheet: {
      create: <T,>(styles: T) => styles,
      hairlineWidth: 1,
    },
    Text,
    useWindowDimensions: () => ({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    }),
    View,
  };
});
vi.mock('react-native-safe-area-context', async () => ({
  SafeAreaView: (await import('react-native')).View,
}));

import { TonightScreen } from './TonightScreen';

const channels = [
  {
    id: 'npo-1',
    name: 'NPO 1',
    displayName: 'NPO 1',
    shortName: 'NPO 1',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'rtl-4',
    name: 'RTL 4',
    displayName: 'RTL 4',
    shortName: 'RTL 4',
    sortOrder: 2,
    isActive: true,
  },
];

const programmes = [
  {
    id: 'saved-current',
    channelId: 'npo-1',
    startAt: '2026-09-23T20:00:00+02:00',
    endAt: '2026-09-23T21:00:00+02:00',
    title: 'Bewaard programma',
  },
  {
    id: 'tip-current',
    channelId: 'rtl-4',
    startAt: '2026-09-23T20:15:00+02:00',
    endAt: '2026-09-23T21:15:00+02:00',
    title: 'Kijktip programma',
  },
  {
    id: 'film-future',
    channelId: 'npo-1',
    startAt: '2026-09-23T21:15:00+02:00',
    endAt: '2026-09-23T23:00:00+02:00',
    title: 'Film programma',
  },
  {
    id: 'series-future',
    channelId: 'rtl-4',
    startAt: '2026-09-23T22:00:00+02:00',
    endAt: '2026-09-23T23:00:00+02:00',
    title: 'Serie programma',
  },
  {
    id: 'sport-future',
    channelId: 'npo-1',
    startAt: '2026-09-23T23:00:00+02:00',
    endAt: '2026-09-24T00:30:00+02:00',
    title: 'Sport programma',
  },
] as const;

const schedule: GuideSchedule = {
  generatedAt: '2026-09-23T18:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels,
  programmes: [...programmes],
};

function highClassification(
  programmeId: string,
  patch: Partial<ProgrammeClassification>,
): ProgrammeClassification {
  return {
    programmeId,
    contentType: 'other',
    seriesType: 'unknown',
    audience: 'unknown',
    sportType: 'unknown',
    liveStatus: 'unknown',
    repeatStatus: 'unknown',
    confidence: 'high',
    ...patch,
  };
}

const classifications: ProgrammeClassification[] = [
  highClassification('film-future', { contentType: 'film' }),
  highClassification('series-future', {
    contentType: 'series',
    seriesType: 'scripted-episodic',
    audience: 'general-mainstream',
  }),
  highClassification('sport-future', {
    contentType: 'sport',
    sportType: 'event',
  }),
];

function readySnapshot(): TonightRuntimeSnapshot {
  return {
    phase: 'ready',
    televisionDayStartMs: Date.parse('2026-09-23T06:00:00+02:00'),
    data: {
      televisionDayStartMs: Date.parse('2026-09-23T06:00:00+02:00'),
      schedule,
      editorialSignals: [
        {
          programmeId: 'tip-current',
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: 'tip-1',
          matchedBy: 'source-id',
        },
      ],
      classifications,
    },
  };
}

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  clock.nowMs = Date.parse('2026-09-23T20:30:00+02:00');
  runtimeState.snapshot = readySnapshot();
  personal.state = withProgrammeSaved(
    EMPTY_PROGRAMME_PERSONAL_STATE,
    programmes[0],
    true,
  );
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function renderScreen() {
  await act(async () => {
    root.render(<TonightScreen />);
    await Promise.resolve();
  });
}

function getByTestId(id: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(
    `[data-testid="${id}"]`,
  );
  if (!element) throw new Error(`Missing test node: ${id}`);
  return element;
}

function text(): string {
  return container.textContent ?? '';
}

describe('TonightScreen production runtime surface', () => {
  it('renders the finite module order from local intent + canonical discovery', async () => {
    await renderScreen();

    const content = text();
    const headings = [
      'Jouw gids',
      'Onze Kijktips',
      'Films vanavond',
      'Series vanavond',
      'Sport vanavond',
    ];
    const positions = headings.map((heading) => content.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));

    expect(getByTestId('tonight-saved-saved-current').textContent).toContain(
      'Nu',
    );
    expect(
      getByTestId('tonight-kijktip-tip-current').getAttribute('aria-label'),
    ).toContain('Kijktip');
    expect(getByTestId('tonight-film-film-future')).toBeDefined();
    expect(getByTestId('tonight-series-series-future')).toBeDefined();
    expect(getByTestId('tonight-sport-sport-future')).toBeDefined();
  });

  it('opens exact resolved broadcasts and leaves an unresolved local snapshot non-actionable', async () => {
    const stale = {
      programmeId: 'stale-id',
      channelId: 'npo-1',
      startAt: '2026-09-23T21:30:00+02:00',
      endAt: '2026-09-23T22:30:00+02:00',
      title: 'Lokale stale snapshot',
    };
    personal.state = {
      ...withProgrammeSaved(
        EMPTY_PROGRAMME_PERSONAL_STATE,
        programmes[0],
        true,
      ),
      saved: {
        'saved-current': programmeSnapshot(programmes[0]),
        'stale-id': stale,
      },
    };

    await renderScreen();

    await act(async () => getByTestId('tonight-saved-saved-current').click());
    expect(getByTestId('tonight-detail-open').textContent).toBe('saved-current');
    await act(async () => getByTestId('tonight-detail-open').click());

    const unresolved = getByTestId('tonight-saved-stale-id');
    expect(unresolved.tagName).toBe('DIV');
    expect(unresolved.getAttribute('aria-label')).toContain(
      'Details tijdelijk niet beschikbaar',
    );
  });

  it('renders the two frozen Jouw-gids empty states without hiding local-first navigation', async () => {
    personal.state = EMPTY_PROGRAMME_PERSONAL_STATE;
    await renderScreen();
    expect(text()).toContain(
      "Bewaar programma's die je vanavond wilt zien. Dan staat je tv-avond hier overzichtelijk bij elkaar.",
    );

    personal.state = {
      ...EMPTY_PROGRAMME_PERSONAL_STATE,
      hasUsedSave: true,
    };
    await act(async () => root.unmount());
    root = createRoot(container);
    await renderScreen();
    expect(text()).toContain('Je hebt voor vanavond nog niets bewaard.');

    await act(async () => getByTestId('tonight-open-guide').click());
    expect(router.push).toHaveBeenCalledWith('/');
  });

  it('keeps Jouw gids during unavailable discovery and exposes one retry action', async () => {
    runtimeState.snapshot = {
      phase: 'unavailable',
      televisionDayStartMs: Date.parse('2026-09-23T06:00:00+02:00'),
      data: null,
    };
    await renderScreen();

    expect(text()).toContain('Jouw gids');
    expect(text()).toContain('Bewaard programma');
    expect(text()).toContain(
      'Kijktips en categorieën zijn tijdelijk niet beschikbaar.',
    );
    expect(text()).not.toContain('Films vanavond');
    expect(text()).not.toContain('Series vanavond');
    expect(text()).not.toContain('Sport vanavond');

    await act(async () => getByTestId('tonight-retry').click());
    expect(runtimeActions.refresh).toHaveBeenCalled();
  });

  it('shows one partial notice while preserving reliable Kijktip/category content', async () => {
    runtimeState.snapshot = {
      ...readySnapshot(),
      phase: 'partial',
    };
    await renderScreen();

    expect(text()).toContain(
      "Niet alle programma's voor vanavond zijn beschikbaar.",
    );
    expect(text()).toContain('Onze Kijktips');
    expect(text()).toContain('Films vanavond');
  });
});
