import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GuideScheduleApi } from '@/services/api/guideScheduleContract';
import type { ProgrammeClassificationApi } from '@/services/api/programmeClassificationContract';
import {
  clearRuntimeGuideSchedule,
  installRuntimeGuideSchedule,
  runtimeGuideScheduleFor,
} from '@/data/runtime/guideScheduleRuntime';

import { TonightRuntime } from './tonightRuntime';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function schedule(programmeCount = 1) {
  const channel = {
    id: 'nl-npo-1',
    name: 'NPO 1',
    displayName: 'NPO 1',
    sortOrder: 0,
    isActive: true,
  };
  return {
    generatedAt: '2026-09-23T12:00:00.000Z',
    timezone: 'Europe/Amsterdam' as const,
    channels: [channel],
    programmes: Array.from({ length: programmeCount }, (_, index) => ({
      id: `programme-${index}`,
      channelId: channel.id,
      startAt: new Date(
        Date.parse('2026-09-23T19:00:00+02:00') + index * 60_000,
      ).toISOString(),
      endAt: new Date(
        Date.parse('2026-09-23T20:00:00+02:00') + index * 60_000,
      ).toISOString(),
      title: `Programma ${index}`,
    })),
  };
}

function highOther(programmeId: string) {
  return {
    programmeId,
    contentType: 'other' as const,
    seriesType: 'unknown' as const,
    audience: 'unknown' as const,
    sportType: 'unknown' as const,
    liveStatus: 'unknown' as const,
    repeatStatus: 'unknown' as const,
    confidence: 'high' as const,
  };
}

afterEach(() => {
  clearRuntimeGuideSchedule();
  vi.restoreAllMocks();
});

describe('Tonight runtime ownership', () => {
  it('owns one active television-day schedule read followed by one bounded classification read', async () => {
    const guide = schedule(3);
    const scheduleApi: GuideScheduleApi = {
      getSchedule: vi.fn().mockResolvedValue({
        status: 'ok',
        schedule: guide,
        editorialSignals: [],
      }),
    };
    const classificationApi: ProgrammeClassificationApi = {
      getClassifications: vi.fn().mockResolvedValue({
        status: 'ok',
        classifications: guide.programmes.map(({ id }) => highOther(id)),
      }),
    };
    const runtime = new TonightRuntime(scheduleApi, classificationApi);
    const anchorMs = Date.parse('2026-09-23T18:00:00+02:00');
    installRuntimeGuideSchedule(guide, anchorMs);
    const installedGuide = runtimeGuideScheduleFor(anchorMs);

    await runtime.refresh(anchorMs);

    expect(scheduleApi.getSchedule).toHaveBeenCalledTimes(1);
    expect(scheduleApi.getSchedule).toHaveBeenCalledWith({
      from: '2026-09-23T04:00:00.000Z',
      to: '2026-09-24T04:00:00.000Z',
    });
    expect(classificationApi.getClassifications).toHaveBeenCalledTimes(1);
    expect(classificationApi.getClassifications).toHaveBeenCalledWith({
      programmeIds: guide.programmes.map(({ id }) => id),
    });
    expect(runtime.getSnapshot().phase).toBe('ready');
    expect(runtimeGuideScheduleFor(anchorMs)).toBe(installedGuide);
  });

  it('publishes loading synchronously without inventing discovery content', async () => {
    const pending = deferred<Awaited<ReturnType<GuideScheduleApi['getSchedule']>>>();
    const scheduleApi: GuideScheduleApi = {
      getSchedule: vi.fn().mockReturnValue(pending.promise),
    };
    const classificationApi: ProgrammeClassificationApi = {
      getClassifications: vi.fn(),
    };
    const runtime = new TonightRuntime(scheduleApi, classificationApi);

    const request = runtime.refresh(Date.parse('2026-09-23T18:00:00+02:00'));
    expect(runtime.getSnapshot()).toMatchObject({
      phase: 'loading',
      data: null,
    });

    pending.resolve({ status: 'unavailable' });
    await request;
  });

  it('preserves schedule/Kijktip content as partial when classification is unavailable', async () => {
    const guide = schedule(1);
    const scheduleApi: GuideScheduleApi = {
      getSchedule: vi.fn().mockResolvedValue({
        status: 'ok',
        schedule: guide,
        editorialSignals: [
          {
            programmeId: guide.programmes[0]!.id,
            type: 'kijktip',
            source: 'tvgids',
            sourceItemId: 'tip',
            matchedBy: 'channel-title-start',
          },
        ],
      }),
    };
    const classificationApi: ProgrammeClassificationApi = {
      getClassifications: vi.fn().mockResolvedValue({ status: 'unavailable' }),
    };
    const runtime = new TonightRuntime(scheduleApi, classificationApi);

    await runtime.refresh(Date.parse('2026-09-23T18:00:00+02:00'));

    expect(runtime.getSnapshot().phase).toBe('partial');
    expect(runtime.getSnapshot().data?.schedule).toBe(guide);
    expect(runtime.getSnapshot().data?.editorialSignals).toHaveLength(1);
    expect(runtime.getSnapshot().data?.classifications).toEqual([]);
  });

  it('fails unavailable without fixture discovery when the active schedule is unavailable', async () => {
    const scheduleApi: GuideScheduleApi = {
      getSchedule: vi.fn().mockResolvedValue({ status: 'unavailable' }),
    };
    const classificationApi: ProgrammeClassificationApi = {
      getClassifications: vi.fn(),
    };
    const runtime = new TonightRuntime(scheduleApi, classificationApi);

    await runtime.refresh(Date.parse('2026-09-23T18:00:00+02:00'));

    expect(runtime.getSnapshot()).toMatchObject({
      phase: 'unavailable',
      data: null,
    });
    expect(classificationApi.getClassifications).not.toHaveBeenCalled();
  });

  it('fails safely rather than widening or chunking the 256-id classification contract', async () => {
    const guide = schedule(257);
    const scheduleApi: GuideScheduleApi = {
      getSchedule: vi.fn().mockResolvedValue({
        status: 'ok',
        schedule: guide,
        editorialSignals: [],
      }),
    };
    const classificationApi: ProgrammeClassificationApi = {
      getClassifications: vi.fn(),
    };
    const runtime = new TonightRuntime(scheduleApi, classificationApi);

    await runtime.refresh(Date.parse('2026-09-23T18:00:00+02:00'));

    expect(runtime.getSnapshot().phase).toBe('partial');
    expect(runtime.getSnapshot().data?.classifications).toEqual([]);
    expect(classificationApi.getClassifications).not.toHaveBeenCalled();
  });

  it('suppresses an old television-day response after exact 06:00 rollover', async () => {
    const first = deferred<Awaited<ReturnType<GuideScheduleApi['getSchedule']>>>();
    const secondGuide = {
      ...schedule(1),
      generatedAt: '2026-09-24T06:00:00.000Z',
      programmes: [
        {
          ...schedule(1).programmes[0]!,
          id: 'new-day',
          startAt: '2026-09-24T19:00:00+02:00',
          endAt: '2026-09-24T20:00:00+02:00',
        },
      ],
    };
    const scheduleApi: GuideScheduleApi = {
      getSchedule: vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockResolvedValueOnce({
          status: 'ok',
          schedule: secondGuide,
          editorialSignals: [],
        }),
    };
    const classificationApi: ProgrammeClassificationApi = {
      getClassifications: vi.fn().mockResolvedValue({
        status: 'ok',
        classifications: [highOther('new-day')],
      }),
    };
    const runtime = new TonightRuntime(scheduleApi, classificationApi);

    const oldRequest = runtime.refresh(
      Date.parse('2026-09-24T05:59:59+02:00'),
    );
    await runtime.refresh(Date.parse('2026-09-24T06:00:00+02:00'));

    first.resolve({
      status: 'ok',
      schedule: schedule(1),
      editorialSignals: [],
    });
    await oldRequest;

    expect(runtime.getSnapshot().televisionDayStartMs).toBe(
      Date.parse('2026-09-24T06:00:00+02:00'),
    );
    expect(runtime.getSnapshot().data?.schedule.programmes[0]!.id).toBe(
      'new-day',
    );
  });

  it('retains reliable same-day data as partial when a later refresh fails and retry can recover', async () => {
    const guide = schedule(1);
    const scheduleApi: GuideScheduleApi = {
      getSchedule: vi
        .fn()
        .mockResolvedValueOnce({
          status: 'ok',
          schedule: guide,
          editorialSignals: [],
        })
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({
          status: 'ok',
          schedule: guide,
          editorialSignals: [],
        }),
    };
    const classificationApi: ProgrammeClassificationApi = {
      getClassifications: vi.fn().mockResolvedValue({
        status: 'ok',
        classifications: [highOther(guide.programmes[0]!.id)],
      }),
    };
    const runtime = new TonightRuntime(scheduleApi, classificationApi);
    const nowMs = Date.parse('2026-09-23T18:00:00+02:00');

    await runtime.refresh(nowMs);
    await runtime.refresh(nowMs);
    expect(runtime.getSnapshot().phase).toBe('partial');
    expect(runtime.getSnapshot().data?.schedule).toBe(guide);

    vi.spyOn(Date, 'now').mockReturnValue(nowMs);
    runtime.retry();
    await vi.waitFor(() => expect(runtime.getSnapshot().phase).toBe('ready'));
    vi.restoreAllMocks();
  });
});
