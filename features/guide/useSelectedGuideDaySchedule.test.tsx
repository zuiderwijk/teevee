// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GuideSchedule } from '@/data/domain/epg';
import { guideTelevisionDayStart } from '@/data/domain/guideTime';
import { clearRuntimeGuideSchedule } from '@/data/runtime/guideScheduleRuntime';
import type { GuideScheduleApi } from '@/services/api/guideScheduleContract';

import { useSelectedGuideDaySchedule } from './useSelectedGuideDaySchedule';

type AppStateValue = 'active' | 'background' | 'inactive';

const lifecycle = vi.hoisted(() => ({
  nowMs: Date.parse('2026-09-15T17:00:00Z'),
  listener: null as ((state: AppStateValue) => void) | null,
}));

vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, listener: (state: AppStateValue) => void) => {
      lifecycle.listener = listener;
      return { remove: () => (lifecycle.listener = null) };
    },
  },
}));

function schedule(id: string, generatedAt = '2026-09-15T08:00:00Z'): GuideSchedule {
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
        startAt: '2026-09-16T18:00:00Z',
        endAt: '2026-09-16T19:00:00Z',
        title: id,
      },
    ],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((next, fail) => {
    resolve = next;
    reject = fail;
  });
  return { promise, resolve, reject };
}

type ProbeProps = {
  dayStartMs: number;
  version?: number;
  api: GuideScheduleApi;
};

function Probe({ dayStartMs, version = 0, api }: ProbeProps) {
  const state = useSelectedGuideDaySchedule(dayStartMs, version, api);
  return (
    <div
      data-testid="probe"
      data-id={state.schedule?.programmes[0]?.id ?? ''}
      data-generated-at={state.schedule?.generatedAt ?? ''}
      data-loading={String(state.loading)}
      data-unavailable={String(state.unavailable)}
    />
  );
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  lifecycle.nowMs = Date.parse('2026-09-15T17:00:00Z');
  lifecycle.listener = null;
  vi.spyOn(Date, 'now').mockImplementation(() => lifecycle.nowMs);
  clearRuntimeGuideSchedule();
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

function probe() {
  const node = container.querySelector<HTMLElement>('[data-testid="probe"]');
  if (!node) throw new Error('probe missing');
  return node.dataset;
}

async function renderProbe(props: ProbeProps) {
  await act(async () => {
    root.render(<Probe {...props} />);
    await Promise.resolve();
  });
}

async function resume() {
  await act(async () => {
    lifecycle.listener?.('active');
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useSelectedGuideDaySchedule', () => {
  it('leaves current-day network ownership with the fixture-first shared runtime', async () => {
    const api = { getSchedule: vi.fn() } satisfies GuideScheduleApi;
    const currentDay = guideTelevisionDayStart(lifecycle.nowMs);

    await renderProbe({ dayStartMs: currentDay, api });

    expect(api.getSchedule).not.toHaveBeenCalled();
    expect(probe().loading).toBe('false');
  });

  it('loads only the selected non-current day and reports unavailable/network failure without discarding context', async () => {
    const unavailableApi = {
      getSchedule: vi.fn().mockResolvedValue({ status: 'unavailable' }),
    } satisfies GuideScheduleApi;
    const futureDay = guideTelevisionDayStart(lifecycle.nowMs, 2);

    await renderProbe({ dayStartMs: futureDay, api: unavailableApi });
    await act(async () => Promise.resolve());
    expect(unavailableApi.getSchedule).toHaveBeenCalledTimes(1);
    expect(probe().id).toBe('');
    expect(probe().unavailable).toBe('true');

    const failingApi = {
      getSchedule: vi.fn().mockRejectedValue(new Error('offline')),
    } satisfies GuideScheduleApi;
    await renderProbe({ dayStartMs: guideTelevisionDayStart(lifecycle.nowMs, 3), api: failingApi });
    await act(async () => Promise.resolve());
    expect(probe().id).toBe('');
    expect(probe().unavailable).toBe('true');
  });

  it('reuses a previously visited window immediately when returning to it', async () => {
    const firstDay = guideTelevisionDayStart(lifecycle.nowMs, 2);
    const secondDay = guideTelevisionDayStart(lifecycle.nowMs, 3);
    const api = {
      getSchedule: vi
        .fn()
        .mockResolvedValueOnce({ status: 'ok', schedule: schedule('first') })
        .mockResolvedValueOnce({ status: 'ok', schedule: schedule('second') }),
    } satisfies GuideScheduleApi;

    await renderProbe({ dayStartMs: firstDay, api });
    await act(async () => Promise.resolve());
    expect(probe().id).toBe('first');

    await renderProbe({ dayStartMs: secondDay, api });
    await act(async () => Promise.resolve());
    expect(probe().id).toBe('second');

    await renderProbe({ dayStartMs: firstDay, api });
    expect(probe().id).toBe('first');
    expect(api.getSchedule).toHaveBeenCalledTimes(2);
  });

  it('ignores an older out-of-order response after a rapid day switch', async () => {
    const first = deferred<Awaited<ReturnType<GuideScheduleApi['getSchedule']>>>();
    const second = deferred<Awaited<ReturnType<GuideScheduleApi['getSchedule']>>>();
    const api = {
      getSchedule: vi.fn().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise),
    } satisfies GuideScheduleApi;
    const firstDay = guideTelevisionDayStart(lifecycle.nowMs, 2);
    const secondDay = guideTelevisionDayStart(lifecycle.nowMs, 3);

    await renderProbe({ dayStartMs: firstDay, api });
    expect(probe().loading).toBe('true');
    await renderProbe({ dayStartMs: secondDay, api });

    await act(async () => {
      second.resolve({ status: 'ok', schedule: schedule('newer') });
      await second.promise;
      await Promise.resolve();
    });
    expect(probe().id).toBe('newer');

    await act(async () => {
      first.resolve({ status: 'ok', schedule: schedule('older') });
      await first.promise;
      await Promise.resolve();
    });
    expect(probe().id).toBe('newer');
  });

  it('revalidates a non-current selected day on resume and preserves freshness-only content identity', async () => {
    const selectedDay = guideTelevisionDayStart(lifecycle.nowMs, 2);
    const first = schedule('same', '2026-09-15T08:00:00Z');
    const refreshed = schedule('same', '2026-09-15T09:00:00Z');
    const api = {
      getSchedule: vi
        .fn()
        .mockResolvedValueOnce({ status: 'ok', schedule: first })
        .mockResolvedValueOnce({ status: 'ok', schedule: refreshed }),
    } satisfies GuideScheduleApi;

    await renderProbe({ dayStartMs: selectedDay, api });
    await act(async () => Promise.resolve());
    expect(probe().generatedAt).toBe('2026-09-15T08:00:00Z');

    await resume();

    expect(api.getSchedule).toHaveBeenCalledTimes(2);
    expect(probe().id).toBe('same');
    expect(probe().generatedAt).toBe('2026-09-15T08:00:00Z');
    expect(probe().unavailable).toBe('false');
  });
});
