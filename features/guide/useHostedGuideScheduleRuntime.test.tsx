// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GuideSchedule } from '@/data/domain/epg';
import {
  clearRuntimeGuideSchedule,
  runtimeGuideScheduleFor,
  runtimeProgrammeEditorialSignalsFor,
} from '@/data/runtime/guideScheduleRuntime';
import type { GuideScheduleApi } from '@/services/api/guideScheduleContract';

import { useHostedGuideScheduleRuntime } from './useHostedGuideScheduleRuntime';

type AppStateValue = 'active' | 'background' | 'inactive';

const lifecycle = vi.hoisted(() => ({
  nowMs: Date.parse('2026-09-14T21:30:00Z'), // 23:30 CEST
  frame: null as FrameRequestCallback | null,
  interval: null as (() => void) | null,
  appStateListener: null as ((state: AppStateValue) => void) | null,
  remove: vi.fn(),
  cancelFrame: vi.fn(),
  clearInterval: vi.fn(),
}));

const loader = vi.hoisted(() => ({
  load: vi.fn(),
}));

vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, listener: (state: AppStateValue) => void) => {
      lifecycle.appStateListener = listener;
      return {
        remove: () => {
          lifecycle.remove();
          lifecycle.appStateListener = null;
        },
      };
    },
  },
}));

vi.mock('@/services/api/guideScheduleLoader', () => ({
  loadTwoTelevisionDayGuideScheduleBundle: loader.load,
}));

const api: GuideScheduleApi = {
  async getSchedule() {
    return { status: 'unavailable' };
  },
};

function canonicalSchedule(
  id: string,
  generatedAt = '2026-09-14T20:00:00Z',
): GuideSchedule {
  return {
    generatedAt,
    timezone: 'Europe/Amsterdam',
    channels: [
      {
        id: 'nl-npo-1',
        name: 'NPO 1',
        displayName: 'NPO 1',
        sortOrder: 0,
        isActive: true,
      },
    ],
    programmes: [
      {
        id,
        channelId: 'nl-npo-1',
        startAt: '2026-09-14T20:00:00Z',
        endAt: '2026-09-14T21:00:00Z',
        title: id,
      },
    ],
  };
}

function bundle(
  schedule: GuideSchedule,
  editorialSignals: {
    programmeId: string;
    type: 'kijktip';
    source: 'tvgids';
    sourceItemId: string;
    matchedBy: 'channel-title-start';
  }[] = [],
) {
  return { schedule, editorialSignals };
}

function coveredEmptyCanonicalSchedule(
  generatedAt = '2026-09-14T20:00:00Z',
): GuideSchedule {
  return {
    ...canonicalSchedule('covered-empty', generatedAt),
    programmes: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

function RuntimeProbe() {
  const version = useHostedGuideScheduleRuntime(api);
  return <div data-testid="runtime-version" data-version={String(version)} />;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  lifecycle.nowMs = Date.parse('2026-09-14T21:30:00Z');
  lifecycle.frame = null;
  lifecycle.interval = null;
  lifecycle.appStateListener = null;
  lifecycle.remove.mockClear();
  lifecycle.cancelFrame.mockClear();
  lifecycle.clearInterval.mockClear();
  loader.load.mockReset();
  clearRuntimeGuideSchedule();

  vi.spyOn(Date, 'now').mockImplementation(() => lifecycle.nowMs);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    lifecycle.frame = callback;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
    lifecycle.cancelFrame(handle);
  });
  vi.stubGlobal('setInterval', (callback: () => void) => {
    lifecycle.interval = callback;
    return 1;
  });
  vi.stubGlobal('clearInterval', (handle: number) => {
    lifecycle.clearInterval(handle);
  });

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  clearRuntimeGuideSchedule();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function runtimeVersion(): number {
  const probe = container.querySelector<HTMLElement>('[data-testid="runtime-version"]');
  if (!probe) throw new Error('Runtime probe is not rendered');
  return Number(probe.dataset.version);
}

async function runStartupFrame() {
  const frame = lifecycle.frame;
  if (!frame) throw new Error('Startup frame was not scheduled');
  lifecycle.frame = null;
  await act(async () => {
    frame(0);
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function runDayCheck() {
  const interval = lifecycle.interval;
  if (!interval) throw new Error('Day-change interval was not installed');
  await act(async () => {
    interval();
    await Promise.resolve();
  });
}

async function sendAppState(state: AppStateValue) {
  await act(async () => {
    lifecycle.appStateListener?.(state);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useHostedGuideScheduleRuntime television-day lifecycle', () => {
  it('preserves fixture-first startup, does not roll at midnight/05:59, and rolls at 06:00', async () => {
    const firstSchedule = canonicalSchedule('first');
    const nextDaySchedule = deferred<ReturnType<typeof bundle> | null>();
    loader.load
      .mockResolvedValueOnce(bundle(firstSchedule))
      .mockImplementationOnce(() => nextDaySchedule.promise);

    await act(async () => root.render(<RuntimeProbe />));

    expect(runtimeVersion()).toBe(0);
    expect(loader.load).not.toHaveBeenCalled();

    await runStartupFrame();
    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(runtimeVersion()).toBe(1);

    lifecycle.nowMs = Date.parse('2026-09-14T22:00:00Z'); // exact 00:00 CEST
    await runDayCheck();
    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(runtimeVersion()).toBe(1);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBe(firstSchedule);

    lifecycle.nowMs = Date.parse('2026-09-15T03:59:00Z'); // 05:59 CEST
    await runDayCheck();
    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(runtimeVersion()).toBe(1);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBe(firstSchedule);

    lifecycle.nowMs = Date.parse('2026-09-15T04:00:00Z'); // exact 06:00 CEST
    await runDayCheck();
    expect(loader.load).toHaveBeenCalledTimes(2);
    expect(runtimeVersion()).toBe(2);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBeNull();

    await act(async () => {
      nextDaySchedule.resolve(
        bundle(canonicalSchedule('next-day', '2026-09-15T04:01:00Z')),
      );
      await nextDaySchedule.promise;
      await Promise.resolve();
    });

    expect(runtimeVersion()).toBe(3);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)?.programmes[0]?.id).toBe('next-day');
  });

  it('installs a covered-empty canonical current schedule as authoritative', async () => {
    const empty = coveredEmptyCanonicalSchedule();
    loader.load.mockResolvedValueOnce(bundle(empty));

    await act(async () => root.render(<RuntimeProbe />));
    await runStartupFrame();

    expect(runtimeVersion()).toBe(1);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBe(empty);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)?.channels).toHaveLength(1);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)?.programmes).toEqual([]);
  });

  it('treats a zero-channel current result as structurally unusable, separately from covered-empty', async () => {
    loader.load.mockResolvedValueOnce(
      bundle({
        ...coveredEmptyCanonicalSchedule(),
        channels: [],
      }),
    );

    await act(async () => root.render(<RuntimeProbe />));
    await runStartupFrame();

    expect(runtimeVersion()).toBe(0);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBeNull();
  });

  it('keeps the installed current schedule when forced revalidation is unavailable or fails', async () => {
    const installed = canonicalSchedule('cached');
    loader.load.mockResolvedValueOnce(bundle(installed));

    await act(async () => root.render(<RuntimeProbe />));
    await runStartupFrame();
    expect(runtimeVersion()).toBe(1);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBe(installed);

    loader.load.mockResolvedValueOnce(null);
    await sendAppState('active');
    expect(runtimeVersion()).toBe(1);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBe(installed);

    loader.load.mockRejectedValueOnce(new Error('offline'));
    await sendAppState('active');
    expect(runtimeVersion()).toBe(1);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBe(installed);
  });

  it('refreshes on resume without remounting for freshness-only hosted data', async () => {
    const firstSchedule = canonicalSchedule('same');
    loader.load.mockResolvedValueOnce(bundle(firstSchedule));

    await act(async () => root.render(<RuntimeProbe />));
    await runStartupFrame();
    expect(runtimeVersion()).toBe(1);

    lifecycle.nowMs = Date.parse('2026-09-14T23:00:00Z'); // 01:00 CEST, same television day
    loader.load.mockResolvedValueOnce(
      bundle({
        ...firstSchedule,
        generatedAt: '2026-09-14T21:00:00Z',
      }),
    );
    await sendAppState('active');

    expect(loader.load).toHaveBeenCalledTimes(2);
    expect(runtimeVersion()).toBe(1);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBe(firstSchedule);
  });


  it('installs editorial signals without remounting when only enrichment changes', async () => {
    const current = canonicalSchedule('same');
    loader.load.mockResolvedValueOnce(bundle(current));

    await act(async () => root.render(<RuntimeProbe />));
    await runStartupFrame();
    expect(runtimeVersion()).toBe(1);
    expect(runtimeProgrammeEditorialSignalsFor(lifecycle.nowMs)).toEqual([]);

    loader.load.mockResolvedValueOnce(
      bundle(current, [
        {
          programmeId: 'same',
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: 'tip-same',
          matchedBy: 'channel-title-start',
        },
      ]),
    );
    await sendAppState('active');

    expect(runtimeVersion()).toBe(1);
    expect(runtimeProgrammeEditorialSignalsFor(lifecycle.nowMs)).toEqual([
      {
        programmeId: 'same',
        type: 'kijktip',
        source: 'tvgids',
        sourceItemId: 'tip-same',
        matchedBy: 'channel-title-start',
      },
    ]);
  });

  it('ignores stale out-of-order hosted responses after a newer resume refresh wins', async () => {
    const initial = canonicalSchedule('initial');
    loader.load.mockResolvedValueOnce(bundle(initial));

    await act(async () => root.render(<RuntimeProbe />));
    await runStartupFrame();
    expect(runtimeVersion()).toBe(1);

    const olderRequest = deferred<ReturnType<typeof bundle> | null>();
    const newerRequest = deferred<ReturnType<typeof bundle> | null>();
    loader.load
      .mockImplementationOnce(() => olderRequest.promise)
      .mockImplementationOnce(() => newerRequest.promise);

    await sendAppState('active');
    await sendAppState('active');
    expect(loader.load).toHaveBeenCalledTimes(3);

    const newerSchedule = canonicalSchedule('newer', '2026-09-14T21:30:00Z');
    await act(async () => {
      newerRequest.resolve(bundle(newerSchedule));
      await newerRequest.promise;
      await Promise.resolve();
    });
    expect(runtimeVersion()).toBe(2);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBe(newerSchedule);

    await act(async () => {
      olderRequest.resolve(
        bundle(canonicalSchedule('older', '2026-09-14T21:15:00Z')),
      );
      await olderRequest.promise;
      await Promise.resolve();
    });

    expect(runtimeVersion()).toBe(2);
    expect(runtimeGuideScheduleFor(lifecycle.nowMs)).toBe(newerSchedule);
  });
});
