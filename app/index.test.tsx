// @vitest-environment jsdom
import { act, createElement, useEffect, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  startupFrame: null as FrameRequestCallback | null,
  nowNextMounts: 0,
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
vi.mock('@/features/guide/GuideView', () => ({
  GuideView: () => createElement('div', { 'data-testid': 'mock-total' }, 'Totaal'),
}));
vi.mock('@/features/guide/PerChannelGuideView', () => ({
  PerChannelGuideView: () =>
    createElement('div', { 'data-testid': 'mock-per-channel' }, 'Per zender'),
}));
vi.mock('@/features/guide/ProgrammeDetail', () => ({
  ProgrammeDetail: () => createElement('div', { 'data-testid': 'mock-detail' }),
}));
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
    guidePresentation: 'now-next',
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

vi.mock('@/features/guide/NowNextGuideView', () => ({
  NowNextGuideView: ({
    presentationNavigation,
  }: {
    presentationNavigation: ReactNode;
  }) => {
    useEffect(() => {
      state.nowNextMounts += 1;
    }, []);
    return createElement(
      'div',
      { 'data-testid': 'mock-now-next' },
      presentationNavigation,
    );
  },
}));

import GuideScreen from './index';

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  state.startupFrame = null;
  state.nowNextMounts = 0;
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
