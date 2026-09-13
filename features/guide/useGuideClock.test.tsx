// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGuideClock } from './useGuideClock';

type AppStateValue = 'active' | 'background' | 'inactive';

const clockStore = vi.hoisted(() => ({
  nowMs: Date.parse('2026-09-13T21:59:50+02:00'),
  listener: null as ((state: AppStateValue) => void) | null,
  remove: vi.fn(),
}));

vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, listener: (state: AppStateValue) => void) => {
      clockStore.listener = listener;
      return {
        remove: () => {
          clockStore.remove();
          clockStore.listener = null;
        },
      };
    },
  },
}));

function ClockProbe() {
  const nowMs = useGuideClock(60_000);
  return <div data-testid="clock-probe" data-now={String(nowMs)} />;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  clockStore.nowMs = Date.parse('2026-09-13T21:59:50+02:00');
  clockStore.listener = null;
  clockStore.remove.mockClear();
  vi.spyOn(Date, 'now').mockImplementation(() => clockStore.nowMs);
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

function probeNow() {
  const probe = container.querySelector<HTMLElement>('[data-testid="clock-probe"]');
  if (!probe) throw new Error('Clock probe is not rendered');
  return Number(probe.dataset.now);
}

async function sendAppState(state: AppStateValue) {
  await act(async () => {
    clockStore.listener?.(state);
  });
}

describe('useGuideClock lifecycle refresh', () => {
  it('refreshes immediately when the app becomes active again', async () => {
    await act(async () => root.render(<ClockProbe />));
    expect(probeNow()).toBe(clockStore.nowMs);

    const resumedAt = Date.parse('2026-09-14T08:15:00+02:00');
    clockStore.nowMs = resumedAt;
    await sendAppState('active');

    expect(probeNow()).toBe(resumedAt);
  });

  it('does not advance merely because the app enters background', async () => {
    await act(async () => root.render(<ClockProbe />));
    const renderedAt = probeNow();

    clockStore.nowMs = Date.parse('2026-09-14T08:15:00+02:00');
    await sendAppState('background');

    expect(probeNow()).toBe(renderedAt);
  });

  it('removes the AppState listener on unmount', async () => {
    await act(async () => root.render(<ClockProbe />));
    await act(async () => root.unmount());
    expect(clockStore.remove).toHaveBeenCalledTimes(1);
  });
});
