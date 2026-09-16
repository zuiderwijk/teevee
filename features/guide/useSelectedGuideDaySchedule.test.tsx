// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GuideSchedule } from '@/data/domain/epg';
import { guideTelevisionDayStart } from '@/data/domain/guideTime';
import {
  clearRuntimeGuideSchedule,
  installRuntimeGuideSchedule,
} from '@/data/runtime/guideScheduleRuntime';
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

function coveredEmptySchedule(generatedAt = '2026-09-15T08:00:00Z'): GuideSchedule {
  return {
    ...schedule('covered-empty', generatedAt),
    programmes: [],
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
  includeFollowingDay?: boolean;
};

function Probe({ dayStartMs, version = 0, api, includeFollowingDay = false }: ProbeProps) {
  const state = useSelectedGuideDaySchedule(dayStartMs, version, api, includeFollowingDay);
  return (
    <div
      data-testid="probe"
      data-id={state.schedule?.programmes[0]?.id ?? ''}
      data-count={String(state.schedule?.programmes.length ?? 0)}
      data-channel-count={String(state.schedule?.channels.length ?? 0)}
      data-has-schedule={String(state.schedule !== null)}
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

async function backgroundAndResume() {
  await act(async () => {
    lifecycle.listener?.('background');
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

  it('loads only the selected non-current day for Per zender', async () => {
    const selectedDay = guideTelevisionDayStart(lifecycle.nowMs, 2);
    const api = {
      getSchedule: vi.fn().mockResolvedValue({ status: 'ok', schedule: schedule('selected') }),
    } satisfies GuideScheduleApi;

    await renderProbe({ dayStartMs: selectedDay, api });
    await act(async () => Promise.resolve());

    expect(api.getSchedule).toHaveBeenCalledTimes(1);
    expect(api.getSchedule).toHaveBeenCalledWith({
      from: new Date(selectedDay).toISOString(),
      to: new Date(guideTelevisionDayStart(selectedDay, 1)).toISOString(),
    });
    expect(probe().id).toBe('selected');
  });

  it('keeps a covered-empty canonical selected day authoritative', async () => {
    const selectedDay = guideTelevisionDayStart(lifecycle.nowMs, 2);
    const empty = coveredEmptySchedule();
    const api = {
      getSchedule: vi.fn().mockResolvedValue({ status: 'ok', schedule: empty }),
    } satisfies GuideScheduleApi;

    await renderProbe({ dayStartMs: selectedDay, api });
    await act(async () => Promise.resolve());

    expect(probe().hasSchedule).toBe('true');
    expect(probe().channelCount).toBe('1');
    expect(probe().count).toBe('0');
    expect(probe().unavailable).toBe('false');
  });

  it('treats a zero-channel ok result as structurally unusable, separately from covered-empty', async () => {
    const selectedDay = guideTelevisionDayStart(lifecycle.nowMs, 2);
    const api = {
      getSchedule: vi.fn().mockResolvedValue({
        status: 'ok',
        schedule: { ...coveredEmptySchedule(), channels: [] },
      }),
    } satisfies GuideScheduleApi;

    await renderProbe({ dayStartMs: selectedDay, api });
    await act(async () => Promise.resolve());

    expect(probe().hasSchedule).toBe('false');
    expect(probe().unavailable).toBe('true');
  });

  it('loads Totaal as two independent bounded day reads for continuous 06:00 browsing', async () => {
    const selectedDay = guideTelevisionDayStart(lifecycle.nowMs, 2);
    const nextDay = guideTelevisionDayStart(selectedDay, 1);
    const api = {
      getSchedule: vi
        .fn()
        .mockResolvedValueOnce({ status: 'ok', schedule: schedule('selected') })
        .mockResolvedValueOnce({ status: 'ok', schedule: schedule('following', '2026-09-15T09:00:00Z') }),
    } satisfies GuideScheduleApi;

    await renderProbe({ dayStartMs: selectedDay, api, includeFollowingDay: true });
    await act(async () => Promise.resolve());

    expect(api.getSchedule).toHaveBeenCalledTimes(2);
    expect(api.getSchedule).toHaveBeenNthCalledWith(1, {
      from: new Date(selectedDay).toISOString(),
      to: new Date(nextDay).toISOString(),
    });
    expect(api.getSchedule).toHaveBeenNthCalledWith(2, {
      from: new Date(nextDay).toISOString(),
      to: new Date(guideTelevisionDayStart(nextDay, 1)).toISOString(),
    });
    expect(probe().count).toBe('2');
  });

  it('reports initial unavailable/network failure without inventing canonical data', async () => {
    const unavailableApi = {
      getSchedule: vi.fn().mockResolvedValue({ status: 'unavailable' }),
    } satisfies GuideScheduleApi;
    const futureDay = guideTelevisionDayStart(lifecycle.nowMs, 2);

    await renderProbe({ dayStartMs: futureDay, api: unavailableApi });
    await act(async () => Promise.resolve());
    expect(unavailableApi.getSchedule).toHaveBeenCalledTimes(1);
    expect(probe().hasSchedule).toBe('false');
    expect(probe().unavailable).toBe('true');

    const failingApi = {
      getSchedule: vi.fn().mockRejectedValue(new Error('offline')),
    } satisfies GuideScheduleApi;
    await renderProbe({ dayStartMs: guideTelevisionDayStart(lifecycle.nowMs, 3), api: failingApi });
    await act(async () => Promise.resolve());
    expect(probe().hasSchedule).toBe('false');
    expect(probe().unavailable).toBe('true');
  });

  it('keeps cached selected data when forced revalidation becomes unavailable or fails', async () => {
    const selectedDay = guideTelevisionDayStart(lifecycle.nowMs, 2);
    const first = schedule('cached');
    const api = {
      getSchedule: vi
        .fn()
        .mockResolvedValueOnce({ status: 'ok', schedule: first })
        .mockResolvedValueOnce({ status: 'unavailable' })
        .mockRejectedValueOnce(new Error('offline')),
    } satisfies GuideScheduleApi;

    await renderProbe({ dayStartMs: selectedDay, api });
    await act(async () => Promise.resolve());
    expect(probe().id).toBe('cached');
    expect(probe().unavailable).toBe('false');

    await resume();
    expect(probe().id).toBe('cached');
    expect(probe().unavailable).toBe('true');

    await resume();
    expect(api.getSchedule).toHaveBeenCalledTimes(3);
    expect(probe().id).toBe('cached');
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

  it('hands an unchanged Totaal window from current runtime ownership to non-current resume revalidation at 06:00', async () => {
    lifecycle.nowMs = Date.parse('2026-09-15T03:59:00Z'); // 05:59 CEST
    const selectedDay = guideTelevisionDayStart(lifecycle.nowMs);
    installRuntimeGuideSchedule(schedule('current-runtime'), lifecycle.nowMs);
    const api = {
      getSchedule: vi
        .fn()
        .mockResolvedValueOnce({ status: 'ok', schedule: schedule('historical-selected') })
        .mockResolvedValueOnce({ status: 'ok', schedule: schedule('historical-following') }),
    } satisfies GuideScheduleApi;
    const props = { dayStartMs: selectedDay, api, includeFollowingDay: true };

    await renderProbe(props);

    expect(guideTelevisionDayStart(lifecycle.nowMs)).toBe(selectedDay);
    expect(api.getSchedule).not.toHaveBeenCalled();
    expect(lifecycle.listener).toBeNull();
    expect(probe().id).toBe('current-runtime');

    lifecycle.nowMs = Date.parse('2026-09-15T04:00:00Z'); // 06:00 CEST
    const newCurrentDay = guideTelevisionDayStart(lifecycle.nowMs);
    expect(newCurrentDay).not.toBe(selectedDay);

    // The selected Totaal window itself is deliberately unchanged. Rerendering represents
    // the Guide clock/runtime version update that makes its ownership relation non-current.
    await renderProbe(props);

    expect(props.dayStartMs).toBe(selectedDay);
    expect(api.getSchedule).not.toHaveBeenCalled();
    expect(lifecycle.listener).not.toBeNull();
    expect(probe().id).toBe('current-runtime');

    await backgroundAndResume();

    expect(api.getSchedule).toHaveBeenCalledTimes(2);
    expect(api.getSchedule).toHaveBeenNthCalledWith(1, {
      from: new Date(selectedDay).toISOString(),
      to: new Date(guideTelevisionDayStart(selectedDay, 1)).toISOString(),
    });
    expect(api.getSchedule).toHaveBeenNthCalledWith(2, {
      from: new Date(guideTelevisionDayStart(selectedDay, 1)).toISOString(),
      to: new Date(guideTelevisionDayStart(selectedDay, 2)).toISOString(),
    });
    expect(probe().hasSchedule).toBe('true');
    expect(probe().count).toBe('2');
  });
});
