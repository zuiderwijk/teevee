// @vitest-environment jsdom
// Real Search presentation with native hosts/router/session boundaries mocked.
// This validates observable state/navigation/accessibility wiring, not native layout.
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GuideSearchReadyResponse, GuideSearchSessionSnapshot } from './searchSession';

const router = vi.hoisted(() => ({ push: vi.fn() }));
const navigation = vi.hoisted(() => ({ publish: vi.fn() }));
const sessionActions = vi.hoisted(() => ({
  setQuery: vi.fn(),
  clear: vi.fn(),
  retry: vi.fn(),
  refreshForTelevisionDay: vi.fn(),
}));
const sessionState = vi.hoisted(() => ({
  snapshot: {
    query: '',
    phase: 'idle',
    response: null,
  } as GuideSearchSessionSnapshot,
}));

vi.mock('expo-router', () => ({ useRouter: () => router }));
vi.mock('@/features/guide/guideNavigationIntent', () => ({
  publishGuideNavigationIntent: navigation.publish,
}));
vi.mock('@/features/guide/useGuideClock', () => ({
  useGuideClock: () => Date.parse('2026-09-23T06:50:00.000Z'),
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
    state: { visible: boolean; selection: { programme: { id: string } } | null };
    onClose: () => void;
  }) =>
    state.visible
      ? createElement(
          'button',
          {
            'data-testid': 'search-detail-open',
            onClick: onClose,
          },
          state.selection?.programme.id ?? 'detail',
        )
      : null,
}));
vi.mock('./searchSession', async () => {
  const actual = await vi.importActual<typeof import('./searchSession')>('./searchSession');
  return {
    ...actual,
    guideSearchSession: sessionActions,
    useGuideSearchSession: () => sessionState.snapshot,
  };
});

vi.mock('react-native', async () => {
  const React = await import('react');

  type HostProps = {
    children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    testID?: string;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityLiveRegion?: string;
    accessible?: boolean;
    onPress?: () => void;
    onChangeText?: (value: string) => void;
    onSubmitEditing?: () => void;
    value?: string;
    placeholder?: string;
    maxLength?: number;
  };

  const childrenFor = (children: HostProps['children']) =>
    typeof children === 'function' ? children({ pressed: false }) : children;

  const View = ({
    children,
    testID,
    accessibilityLiveRegion,
  }: HostProps) =>
    createElement(
      'div',
      {
        'data-testid': testID,
        'aria-live': accessibilityLiveRegion === 'polite' ? 'polite' : undefined,
      },
      childrenFor(children),
    );

  const Text = ({
    children,
    accessibilityRole,
    accessibilityLabel,
    accessibilityLiveRegion,
    accessible,
  }: HostProps) =>
    createElement(
      accessibilityRole === 'header' ? 'h2' : 'span',
      {
        'aria-label': accessibilityLabel,
        'aria-live': accessibilityLiveRegion === 'polite' ? 'polite' : undefined,
        'aria-hidden': accessible === false ? true : undefined,
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

  const TextInput = ({
    testID,
    accessibilityLabel,
    value,
    placeholder,
    maxLength,
    onChangeText,
  }: HostProps) =>
    createElement('input', {
      'data-testid': testID,
      'aria-label': accessibilityLabel,
      value,
      placeholder,
      maxLength,
      onChange: (event: { currentTarget: { value: string } }) =>
        onChangeText?.(event.currentTarget.value),
    });

  const ScrollView = ({ children, testID }: HostProps) =>
    createElement('div', { 'data-testid': testID }, childrenFor(children));

  return {
    ActivityIndicator: () => createElement('span', { 'data-testid': 'activity' }),
    Keyboard: { dismiss: vi.fn() },
    Pressable,
    ScrollView,
    StyleSheet: {
      create: <T,>(styles: T) => styles,
      hairlineWidth: 1,
    },
    Text,
    TextInput,
    View,
  };
});
vi.mock('react-native-safe-area-context', async () => ({
  SafeAreaView: (await import('react-native')).View,
}));

import { GuideSearchScreen } from './GuideSearchScreen';

const channel = {
  id: 'nl-npo-1',
  name: 'NPO 1',
  displayName: 'NPO 1',
  shortName: 'NPO 1',
  sortOrder: 1,
  isActive: true,
};

const programme = {
  id: 'programme-live',
  channelId: channel.id,
  startAt: '2026-09-23T06:40:00.000Z',
  endAt: '2026-09-23T07:00:00.000Z',
  title: 'Goedemorgen Nederland',
};

function response(
  coverage: GuideSearchReadyResponse['programmeCoverage'] = 'complete',
  withResults = true,
): GuideSearchReadyResponse {
  return {
    status: 'ok',
    programmeCoverage: coverage,
    channelMatches: withResults ? [channel] : [],
    programmeMatches: withResults ? [{ programme, channel }] : [],
    editorialSignals: withResults
      ? [
          {
            programmeId: programme.id,
            type: 'kijktip',
            source: 'tvgids',
            sourceItemId: 'tip-1',
            matchedBy: 'source-id',
          },
        ]
      : [],
  };
}

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-23T06:50:00.000Z'));
  vi.clearAllMocks();
  sessionState.snapshot = {
    query: '',
    phase: 'idle',
    response: null,
  };
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

function textContent(): string {
  return container.textContent ?? '';
}

function getByTestId(id: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!node) throw new Error(`Missing test node: ${id}`);
  return node;
}

async function render() {
  await act(async () => root.render(<GuideSearchScreen />));
}

describe('GuideSearchScreen', () => {
  it('renders bounded accessible results and preserves the query through Programme Detail', async () => {
    sessionState.snapshot = {
      query: 'Goedemorgen',
      phase: 'ready',
      response: response(),
    };
    await render();

    const input = getByTestId('guide-search-input') as HTMLInputElement;
    expect(input.value).toBe('Goedemorgen');
    expect(input.maxLength).toBe(80);

    const programmeRow = getByTestId('search-programme-programme-live');
    expect(programmeRow.getAttribute('aria-label')).toBe(
      'Goedemorgen Nederland, NPO 1, Nu, tot 09:00, Kijktip',
    );
    expect(textContent()).toContain('Nu · tot 09:00 · NPO 1');
    expect(textContent()).toContain('Kijktip');

    await act(async () => programmeRow.click());
    expect(getByTestId('search-detail-open').textContent).toBe('programme-live');
    expect((getByTestId('guide-search-input') as HTMLInputElement).value).toBe(
      'Goedemorgen',
    );

    await act(async () => getByTestId('search-detail-open').click());
    expect(container.querySelector('[data-testid="search-detail-open"]')).toBeNull();
    expect((getByTestId('guide-search-input') as HTMLInputElement).value).toBe(
      'Goedemorgen',
    );
  });

  it('publishes a current-time Per-zender intent for a channel result', async () => {
    sessionState.snapshot = {
      query: 'NPO',
      phase: 'ready',
      response: response(),
    };
    await render();

    await act(async () => getByTestId('search-channel-nl-npo-1').click());

    expect(navigation.publish).toHaveBeenCalledWith({
      type: 'per-channel',
      channelId: 'nl-npo-1',
      referenceAt: '2026-09-23T06:50:00.000Z',
    });
    expect(router.push).toHaveBeenCalledWith('/');
  });

  it('distinguishes complete no-match, partial coverage and unavailable Search', async () => {
    sessionState.snapshot = {
      query: 'onbekend',
      phase: 'ready',
      response: response('complete', false),
    };
    await render();
    expect(textContent()).toContain('Geen resultaten gevonden.');

    sessionState.snapshot = {
      query: 'onbekend',
      phase: 'ready',
      response: response('partial', false),
    };
    await render();
    expect(textContent()).toContain('Niet alle gidsdagen zijn beschikbaar.');
    expect(textContent()).not.toContain('Geen resultaten gevonden.');

    sessionState.snapshot = {
      query: 'onbekend',
      phase: 'unavailable',
      response: null,
    };
    await render();
    expect(textContent()).toContain('Zoeken is tijdelijk niet beschikbaar.');
  });

  it('wires input and clear actions to the session without local query history', async () => {
    sessionState.snapshot = {
      query: 'NPO',
      phase: 'pending',
      response: null,
    };
    await render();

    const input = getByTestId('guide-search-input') as HTMLInputElement;
    await act(async () => {
      const nativeValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      nativeValueSetter?.call(input, 'RTL');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(sessionActions.setQuery).toHaveBeenCalledWith('RTL');

    await act(async () => getByTestId('guide-search-clear').click());
    expect(sessionActions.clear).toHaveBeenCalledOnce();
  });
});
