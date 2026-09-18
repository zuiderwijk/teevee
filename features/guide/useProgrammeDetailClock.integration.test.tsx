// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useProgrammeDetailNow,
  type ProgrammeDetailClock,
} from './useProgrammeDetailClock';

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
  vi.unstubAllGlobals();
});

function createClock(initialNowMs: number) {
  let nowMs = initialNowMs;
  let timerCallback: (() => void) | null = null;
  let resumeCallback: (() => void) | null = null;
  const token = 1 as unknown as ReturnType<typeof setTimeout>;

  const clock: ProgrammeDetailClock = {
    now: () => nowMs,
    setTimer: (callback) => {
      timerCallback = callback;
      return token;
    },
    clearTimer: () => {
      timerCallback = null;
    },
    subscribeResume: (callback) => {
      resumeCallback = callback;
      return () => {
        if (resumeCallback === callback) resumeCallback = null;
      };
    },
  };

  return {
    clock,
    setNow(value: number) {
      nowMs = value;
    },
    async fireBoundary() {
      const callback = timerCallback;
      timerCallback = null;
      await act(async () => callback?.());
    },
    async resume() {
      await act(async () => resumeCallback?.());
    },
  };
}

function Probe({
  startAt,
  endAt,
  clock,
}: {
  startAt: string;
  endAt: string;
  clock: ProgrammeDetailClock;
}) {
  const nowMs = useProgrammeDetailNow(startAt, endAt, true, clock);
  return <span data-testid="now">{nowMs}</span>;
}

describe('Programme Detail boundary-driven clock', () => {
  it('refreshes at start and end boundaries without unrelated renders', async () => {
    const startMs = Date.parse('2026-09-18T18:00:00.000Z');
    const endMs = startMs + 60_000;
    const controlled = createClock(startMs - 1_000);

    await act(async () =>
      root.render(
        <Probe
          startAt={new Date(startMs).toISOString()}
          endAt={new Date(endMs).toISOString()}
          clock={controlled.clock}
        />,
      ),
    );
    expect(container.textContent).toBe(String(startMs - 1_000));

    controlled.setNow(startMs);
    await controlled.fireBoundary();
    expect(container.textContent).toBe(String(startMs));

    controlled.setNow(endMs);
    await controlled.fireBoundary();
    expect(container.textContent).toBe(String(endMs));
  });

  it('refreshes immediately on resume so a crossed start boundary is restored', async () => {
    const startMs = Date.parse('2026-09-18T18:00:00.000Z');
    const controlled = createClock(startMs - 60_000);

    await act(async () =>
      root.render(
        <Probe
          startAt={new Date(startMs).toISOString()}
          endAt={new Date(startMs + 60_000).toISOString()}
          clock={controlled.clock}
        />,
      ),
    );

    controlled.setNow(startMs + 1);
    await controlled.resume();
    expect(container.textContent).toBe(String(startMs + 1));
  });
});
