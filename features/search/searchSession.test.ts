import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  GuideSearchApi,
  GuideSearchApiResponse,
} from '@/services/api/guideSearchContract';

import {
  GUIDE_SEARCH_DEBOUNCE_MS,
  GuideSearchSession,
} from './searchSession';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function okResponse(title = 'De slimste mens'): GuideSearchApiResponse {
  return {
    status: 'ok',
    programmeCoverage: 'complete',
    channelMatches: [],
    programmeMatches: [
      {
        programme: {
          id: 'programme-1',
          channelId: 'nl-npo-1',
          startAt: '2026-09-23T18:30:00Z',
          endAt: '2026-09-23T19:30:00Z',
          title,
        },
        channel: {
          id: 'nl-npo-1',
          name: 'NPO 1',
          displayName: 'NPO 1',
          sortOrder: 1,
          isActive: true,
        },
      },
    ],
    editorialSignals: [],
  };
}

describe('GuideSearchSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps short queries neutral and does not call the hosted API', async () => {
    const search = vi.fn<GuideSearchApi['search']>();
    const session = new GuideSearchSession({ search });

    session.setQuery('N');

    expect(session.getSnapshot()).toEqual({
      query: 'N',
      phase: 'idle',
      response: null,
    });

    await vi.advanceTimersByTimeAsync(GUIDE_SEARCH_DEBOUNCE_MS * 2);
    expect(search).not.toHaveBeenCalled();
  });

  it('keeps an overlong query out of transport instead of reporting availability failure', async () => {
    const search = vi.fn<GuideSearchApi['search']>();
    const session = new GuideSearchSession({ search });

    session.setQuery('a'.repeat(81));

    expect(session.getSnapshot()).toEqual({
      query: 'a'.repeat(81),
      phase: 'idle',
      response: null,
    });

    await vi.advanceTimersByTimeAsync(GUIDE_SEARCH_DEBOUNCE_MS * 2);
    expect(search).not.toHaveBeenCalled();
  });

  it('debounces a meaningful query and publishes the bounded response', async () => {
    const search = vi.fn<GuideSearchApi['search']>().mockResolvedValue(okResponse());
    const session = new GuideSearchSession({ search });

    session.setQuery('De slimste mens');
    expect(session.getSnapshot().phase).toBe('pending');

    await vi.advanceTimersByTimeAsync(GUIDE_SEARCH_DEBOUNCE_MS - 1);
    expect(search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0]?.[0]).toEqual({ query: 'De slimste mens' });
    expect(search.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);

    await vi.runAllTicks();
    expect(session.getSnapshot()).toMatchObject({
      query: 'De slimste mens',
      phase: 'ready',
      response: { status: 'ok' },
    });
  });

  it('aborts the previous transport and ignores a late stale response', async () => {
    const first = deferred<GuideSearchApiResponse>();
    const second = deferred<GuideSearchApiResponse>();
    const search = vi
      .fn<GuideSearchApi['search']>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const session = new GuideSearchSession({ search });

    session.setQuery('slimste');
    await vi.advanceTimersByTimeAsync(GUIDE_SEARCH_DEBOUNCE_MS);
    const firstSignal = search.mock.calls[0]?.[1]?.signal;
    expect(firstSignal?.aborted).toBe(false);

    session.setQuery('journaal');
    expect(firstSignal?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(GUIDE_SEARCH_DEBOUNCE_MS);

    second.resolve(okResponse('NOS Journaal'));
    await vi.runAllTicks();
    expect(session.getSnapshot().response?.programmeMatches[0]?.programme.title).toBe(
      'NOS Journaal',
    );

    first.resolve(okResponse('De slimste mens'));
    await vi.runAllTicks();
    expect(session.getSnapshot().response?.programmeMatches[0]?.programme.title).toBe(
      'NOS Journaal',
    );
  });

  it('turns unavailable/network failure into a retryable availability state', async () => {
    const search = vi
      .fn<GuideSearchApi['search']>()
      .mockResolvedValueOnce({ status: 'unavailable' })
      .mockResolvedValueOnce(okResponse());
    const session = new GuideSearchSession({ search });

    session.setQuery('NPO');
    await vi.advanceTimersByTimeAsync(GUIDE_SEARCH_DEBOUNCE_MS);
    await vi.runAllTicks();
    expect(session.getSnapshot().phase).toBe('unavailable');

    session.retry();
    expect(session.getSnapshot().phase).toBe('loading');
    await vi.runAllTicks();
    expect(session.getSnapshot().phase).toBe('ready');
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('requeries a retained result exactly when the 06:00 television day changes', async () => {
    vi.setSystemTime(new Date('2026-09-23T03:59:30.000Z'));
    const search = vi
      .fn<GuideSearchApi['search']>()
      .mockResolvedValue(okResponse());
    const session = new GuideSearchSession({ search });

    session.setQuery('slimste');
    await vi.advanceTimersByTimeAsync(GUIDE_SEARCH_DEBOUNCE_MS);
    await vi.runAllTicks();
    expect(session.getSnapshot().phase).toBe('ready');
    expect(search).toHaveBeenCalledTimes(1);

    session.refreshForTelevisionDay(Date.parse('2026-09-23T03:59:59.000Z'));
    expect(search).toHaveBeenCalledTimes(1);

    session.refreshForTelevisionDay(Date.parse('2026-09-23T04:00:01.000Z'));
    expect(session.getSnapshot().phase).toBe('loading');
    await vi.runAllTicks();

    expect(search).toHaveBeenCalledTimes(2);
    expect(session.getSnapshot().phase).toBe('ready');

    session.refreshForTelevisionDay(Date.parse('2026-09-23T04:30:00.000Z'));
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('retains query/results across subscriber teardown within the app session', async () => {
    const search = vi.fn<GuideSearchApi['search']>().mockResolvedValue(okResponse());
    const session = new GuideSearchSession({ search });
    const listener = vi.fn();
    const unsubscribe = session.subscribe(listener);

    session.setQuery('slimste');
    await vi.advanceTimersByTimeAsync(GUIDE_SEARCH_DEBOUNCE_MS);
    await vi.runAllTicks();
    unsubscribe();

    expect(session.getSnapshot()).toMatchObject({
      query: 'slimste',
      phase: 'ready',
      response: { status: 'ok' },
    });

    const nextListener = vi.fn();
    const unsubscribeAgain = session.subscribe(nextListener);
    expect(session.getSnapshot().response?.programmeMatches).toHaveLength(1);
    unsubscribeAgain();
  });

  it('clear aborts active work and resets the session without persisting history', async () => {
    const pending = deferred<GuideSearchApiResponse>();
    const search = vi.fn<GuideSearchApi['search']>().mockImplementation(() => pending.promise);
    const session = new GuideSearchSession({ search });

    session.setQuery('slimste');
    await vi.advanceTimersByTimeAsync(GUIDE_SEARCH_DEBOUNCE_MS);
    const signal = search.mock.calls[0]?.[1]?.signal;

    session.clear();

    expect(signal?.aborted).toBe(true);
    expect(session.getSnapshot()).toEqual({
      query: '',
      phase: 'idle',
      response: null,
    });
  });
});
