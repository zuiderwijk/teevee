// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  startupFrame: null as FrameRequestCallback | null,
  nowNextMounts: 0,
  totalMounts: 0,
  preferredPresentation: 'now-next' as 'total' | 'per-channel' | 'now-next',
  runtimeVersion: 0,
  writtenPresentations: [] as string[],
}));

vi.mock('react-native', () => ({
  View: ({ children, testID }: { children?: ReactNode; testID?: string }) =>
    createElement('div', { 'data-testid': testID }, children),
  StyleSheet: { create: <T,>(styles: T) => styles },
}));

vi.mock('@/components/SettingsButton', () => ({
  SettingsButton: () => createElement('button', null, 'Settings'),
}));
vi.mock('@/features/guide/GuideView', async () => {
  const React = await import('react');
  const channel = {
    id: 'one',
    name: 'NPO 1',
    displayName: 'NPO 1',
    sortOrder: 0,
    isActive: true,
  };
  const programme = {
    id: 'total-programme',
    channelId: channel.id,
    title: 'Totaal programme',
    startAt: '2026-09-18T18:00:00.000Z',
    endAt: '2026-09-18T18:30:00.000Z',
  };
  return {
    GuideView: ({
      presentationNavigation,
      onSelectProgramme,
    }: {
      presentationNavigation: ReactNode;
      onSelectProgramme: (selection: { channel: typeof channel; programme: typeof programme }) => void;
    }) => {
      React.useEffect(() => {
        state.totalMounts += 1;
      }, []);
      return React.createElement(
        'div',
        { 'data-testid': 'mock-total' },
        presentationNavigation,
        React.createElement(
          'button',
          {
            'data-testid': 'mock-total-programme',
            onClick: () => onSelectProgramme({ channel, programme }),
          },
          'Totaal programme',
        ),
      );
    },
  };
});
vi.mock('@/features/guide/PerChannelGuideView', () => ({
  PerChannelGuideView: () =>
    createElement('div', { 'data-testid': 'mock-per-channel' }, 'Per zender'),
}));
vi.mock('@/features/guide/ProgrammeDetail', async () => {
  const React = await import('react');
  return {
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
        ? React.createElement(
            'button',
            {
              'data-testid': 'mock-detail-open',
              onClick: onClose,
            },
            state.selection?.programme.id ?? 'detail',
          )
        : React.createElement('div', { 'data-testid': 'mock-detail-closed' }),
  };
});
vi.mock('@/features/guide/NowNextLoadErrorNotice', () => ({
  NowNextLoadErrorNotice: () =>
    createElement('div', { 'data-testid': 'mock-now-next-error' }),
}));
vi.mock('@/features/guide/useHostedGuideScheduleRuntime', () => ({
  useHostedGuideScheduleRuntime: () => state.runtimeVersion,
}));
vi.mock('@/services/storage/appPreferencesStorage', () => ({
  readAppPreferences: () => ({
    version: 1,
    guidePresentation: state.preferredPresentation,
    appearance: 'system',
  }),
  writeAppPreferences: (value: { guidePresentation: string }) => {
    state.writtenPresentations.push(value.guidePresentation);
    return true;
  },
}));
vi.mock('@/features/guide/GuidePresentationSelector', () => ({
  GuidePresentationSelector: ({
    selected,
    variant = 'pill',
    onSelect,
  }: {
    selected: string;
    variant?: 'pill' | 'tabs';
    onSelect: (value: 'total' | 'per-channel' | 'now-next') => void;
  }) =>
    createElement(
      'nav',
      {
        'data-testid': `mock-presentation-selector-${variant}`,
        'data-selected': selected,
      },
      createElement(
        'button',
        { 'data-testid': 'select-total', onClick: () => onSelect('total') },
        'Totaal',
      ),
      createElement(
        'button',
        { 'data-testid': 'select-now-next', onClick: () => onSelect('now-next') },
        'Nu & Straks',
      ),
    ),
}));

vi.mock('@/features/guide/NowNextGuideView', async () => {
  const React = await import('react');
  const channel = {
    id: 'one',
    name: 'NPO 1',
    displayName: 'NPO 1',
    sortOrder: 0,
    isActive: true,
  };
  const reference = {
    id: 'reference',
    channelId: channel.id,
    title: 'Reference',
    startAt: '2026-09-18T18:00:00.000Z',
    endAt: '2026-09-18T18:30:00.000Z',
  };
  const following = {
    id: 'following',
    channelId: channel.id,
    title: 'Following',
    startAt: '2026-09-18T18:30:00.000Z',
    endAt: '2026-09-18T19:00:00.000Z',
  };

  return {
    NowNextGuideView: ({
      presentationNavigation,
      onSelectProgramme,
    }: {
      presentationNavigation: ReactNode;
      onSelectProgramme: (selection: {
        channel: typeof channel;
        programme: typeof reference;
      }) => void;
    }) => {
      React.useEffect(() => {
        state.nowNextMounts += 1;
      }, []);
      return React.createElement(
        'div',
        { 'data-testid': 'mock-now-next' },
        presentationNavigation,
        React.createElement(
          'button',
          {
            'data-testid': 'mock-now-next-reference',
            onClick: () => onSelectProgramme({ channel, programme: reference }),
          },
          'Reference',
        ),
        React.createElement(
          'button',
          {
            'data-testid': 'mock-now-next-following',
            onClick: () => onSelectProgramme({ channel, programme: following }),
          },
          'Following',
        ),
      );
    },
  };
});

import GuideScreen from '@/app/index';

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  state.startupFrame = null;
  state.nowNextMounts = 0;
  state.totalMounts = 0;
  state.preferredPresentation = 'now-next';
  state.runtimeVersion = 0;
  state.writtenPresentations = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    state.startupFrame = callback;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function getByTestId(id: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!node) throw new Error(`Missing test node: ${id}`);
  return node;
}

describe('GuideScreen Totaal continuity', () => {
  it('uses the shared Guide tabs with no floating pill and keeps the same Totaal instance through Detail and hosted version updates', async () => {
    state.preferredPresentation = 'total';
    await act(async () => root.render(<GuideScreen />));

    const mountedView = getByTestId('mock-total');
    expect(state.totalMounts).toBe(1);
    expect(
      container.querySelectorAll('[data-testid="mock-presentation-selector-tabs"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid="mock-presentation-selector-pill"]'),
    ).toHaveLength(0);

    await act(async () => getByTestId('mock-total-programme').click());
    expect(getByTestId('mock-detail-open').textContent).toBe('total-programme');
    expect(getByTestId('mock-total')).toBe(mountedView);
    await act(async () => getByTestId('mock-detail-open').click());
    expect(getByTestId('mock-total')).toBe(mountedView);

    state.runtimeVersion = 1;
    await act(async () => root.render(<GuideScreen />));
    expect(getByTestId('mock-total')).toBe(mountedView);
    expect(state.totalMounts).toBe(1);
  });
});

describe('GuideScreen Nu & Straks module boundary', () => {
  it('keeps a persisted Nu & Straks preference behind the deferred import/startup-frame boundary', async () => {
    await act(async () => root.render(<GuideScreen />));

    expect(getByTestId('mock-total')).toBeDefined();
    expect(container.querySelector('[data-testid="mock-now-next"]')).toBeNull();
    expect(state.startupFrame).not.toBeNull();

    const frame = state.startupFrame;
    state.startupFrame = null;
    await act(async () => {
      frame?.(0);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getByTestId('mock-now-next')).toBeDefined();
    expect(state.nowNextMounts).toBe(1);
    expect(
      container.querySelectorAll('[data-testid="mock-presentation-selector-tabs"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid="mock-presentation-selector-pill"]'),
    ).toHaveLength(0);
  });

  it('keeps the same deferred Nu & Straks instance through reference and following Programme Detail round-trips', async () => {
    await act(async () => root.render(<GuideScreen />));
    const frame = state.startupFrame;
    await act(async () => {
      frame?.(0);
      await Promise.resolve();
      await Promise.resolve();
    });

    const mountedView = getByTestId('mock-now-next');
    expect(state.nowNextMounts).toBe(1);

    await act(async () => getByTestId('mock-now-next-reference').click());
    expect(getByTestId('mock-detail-open').textContent).toBe('reference');
    expect(getByTestId('mock-now-next')).toBe(mountedView);
    await act(async () => getByTestId('mock-detail-open').click());
    expect(container.querySelector('[data-testid="mock-detail-open"]')).toBeNull();
    expect(getByTestId('mock-now-next')).toBe(mountedView);
    expect(state.nowNextMounts).toBe(1);

    await act(async () => getByTestId('mock-now-next-following').click());
    expect(getByTestId('mock-detail-open').textContent).toBe('following');
    expect(getByTestId('mock-now-next')).toBe(mountedView);
    await act(async () => getByTestId('mock-detail-open').click());
    expect(getByTestId('mock-now-next')).toBe(mountedView);
    expect(state.nowNextMounts).toBe(1);
  });

  it('does not remount Nu & Straks when hosted guide data version changes', async () => {
    await act(async () => root.render(<GuideScreen />));
    const frame = state.startupFrame;
    await act(async () => {
      frame?.(0);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(state.nowNextMounts).toBe(1);

    state.runtimeVersion = 1;
    await act(async () => root.render(<GuideScreen />));

    expect(getByTestId('mock-now-next')).toBeDefined();
    expect(state.nowNextMounts).toBe(1);
  });
});
