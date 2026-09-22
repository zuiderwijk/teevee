// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { guideClockDelayToNextBoundary, useGuideClock } from './useGuideClock';

const appState = vi.hoisted(() => ({
  handler: null as ((state: string) => void) | null,
  remove: vi.fn(),
}));

vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, handler: (state: string) => void) => {
      appState.handler = handler;
      return { remove: appState.remove };
    },
  },
}));

function ClockHarness() {
  return createElement('span', { 'data-testid': 'clock' }, String(useGuideClock()));
}

let container: HTMLDivElement;
let root: Root;

function renderedNow(): number {
  return Number(
    container.querySelector<HTMLElement>('[data-testid="clock"]')?.textContent ??
      'NaN',
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-22T00:57:14.000Z'));
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  appState.handler = null;
  appState.remove.mockReset();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useGuideClock wall-clock alignment', () => {
  it('aligns xx:xx:14 mount to the next :30 and then the next :00', async () => {
    expect(guideClockDelayToNextBoundary(Date.now(), 30_000)).toBe(16_000);

    await act(async () => root.render(<ClockHarness />));
    expect(new Date(renderedNow()).toISOString()).toBe(
      '2026-09-22T00:57:14.000Z',
    );

    await act(async () => vi.advanceTimersByTime(15_999));
    expect(new Date(renderedNow()).toISOString()).toBe(
      '2026-09-22T00:57:14.000Z',
    );

    await act(async () => vi.advanceTimersByTime(1));
    expect(new Date(renderedNow()).toISOString()).toBe(
      '2026-09-22T00:57:30.000Z',
    );

    await act(async () => vi.advanceTimersByTime(30_000));
    expect(new Date(renderedNow()).toISOString()).toBe(
      '2026-09-22T00:58:00.000Z',
    );
    expect(new Date(renderedNow()).toISOString().slice(11, 16)).toBe('00:58');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('refreshes immediately on active and realigns without duplicate timers', async () => {
    await act(async () => root.render(<ClockHarness />));
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => appState.handler?.('background'));
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => vi.advanceTimersByTime(40_000));
    expect(new Date(renderedNow()).toISOString()).toBe(
      '2026-09-22T00:57:14.000Z',
    );

    await act(async () => appState.handler?.('active'));
    expect(new Date(renderedNow()).toISOString()).toBe(
      '2026-09-22T00:57:54.000Z',
    );
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => appState.handler?.('active'));
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => vi.advanceTimersByTime(5_999));
    expect(new Date(renderedNow()).toISOString()).toBe(
      '2026-09-22T00:57:54.000Z',
    );

    await act(async () => vi.advanceTimersByTime(1));
    expect(new Date(renderedNow()).toISOString()).toBe(
      '2026-09-22T00:58:00.000Z',
    );
  });

  it('cleans up the aligned timeout and AppState subscription', async () => {
    await act(async () => root.render(<ClockHarness />));
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
    expect(appState.remove).toHaveBeenCalledTimes(1);

    root = createRoot(container);
  });
});
