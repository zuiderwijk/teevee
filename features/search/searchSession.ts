import { useSyncExternalStore } from 'react';

import { guideTelevisionDayStart } from '@/data/domain/guideTime';
import {
  guideSearchChannelManagementIntent,
  normalizeGuideSearchText,
} from '@/data/domain/search';
import {
  GUIDE_SEARCH_MAX_QUERY_LENGTH,
  GUIDE_SEARCH_MIN_QUERY_LENGTH,
  type GuideSearchApi,
  type GuideSearchApiResponse,
} from '@/services/api/guideSearchContract';
import { HostedGuideSearchClient } from '@/services/api/hostedGuideSearchClient';

export const GUIDE_SEARCH_DEBOUNCE_MS = 220;

export type GuideSearchReadyResponse = Extract<
  GuideSearchApiResponse,
  { status: 'ok' }
>;

export type GuideSearchSessionPhase =
  | 'idle'
  | 'pending'
  | 'loading'
  | 'ready'
  | 'unavailable';

export type GuideSearchSessionSnapshot = {
  query: string;
  phase: GuideSearchSessionPhase;
  response: GuideSearchReadyResponse | null;
};

type Listener = () => void;

function searchableQuery(query: string): boolean {
  if (guideSearchChannelManagementIntent(query)) return false;
  const length = normalizeGuideSearchText(query).length;
  return (
    length >= GUIDE_SEARCH_MIN_QUERY_LENGTH &&
    length <= GUIDE_SEARCH_MAX_QUERY_LENGTH
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export class GuideSearchSession {
  private snapshot: GuideSearchSessionSnapshot = {
    query: '',
    phase: 'idle',
    response: null,
  };
  private readonly listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private controller: AbortController | null = null;
  private requestVersion = 0;
  private requestedTelevisionDayStartMs: number | null = null;

  constructor(
    private readonly api: GuideSearchApi,
    private readonly debounceMs = GUIDE_SEARCH_DEBOUNCE_MS,
  ) {}

  readonly getSnapshot = (): GuideSearchSessionSnapshot => this.snapshot;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly setQuery = (query: string): void => {
    if (query === this.snapshot.query) return;
    this.requestVersion += 1;
    this.cancelTransport();

    if (!searchableQuery(query)) {
      this.publish({ query, phase: 'idle', response: null });
      return;
    }

    this.publish({ query, phase: 'pending', response: null });
    this.schedule(query, this.requestVersion, this.debounceMs);
  };

  readonly retry = (): void => {
    const { query } = this.snapshot;
    if (!searchableQuery(query)) return;

    this.requestVersion += 1;
    this.cancelTransport();
    this.publish({ query, phase: 'loading', response: null });
    void this.execute(query, this.requestVersion);
  };

  readonly refreshForTelevisionDay = (nowMs: number): void => {
    if (
      this.snapshot.phase !== 'loading' &&
      this.snapshot.phase !== 'ready' &&
      this.snapshot.phase !== 'unavailable'
    ) {
      return;
    }
    if (!searchableQuery(this.snapshot.query)) return;

    const dayStartMs = guideTelevisionDayStart(nowMs);
    if (dayStartMs === this.requestedTelevisionDayStartMs) return;

    this.requestVersion += 1;
    this.cancelTransport();
    this.publish({
      query: this.snapshot.query,
      phase: 'loading',
      response: null,
    });
    void this.execute(this.snapshot.query, this.requestVersion, dayStartMs);
  };

  readonly clear = (): void => {
    this.requestVersion += 1;
    this.cancelTransport();
    this.requestedTelevisionDayStartMs = null;
    this.publish({ query: '', phase: 'idle', response: null });
  };

  private publish(snapshot: GuideSearchSessionSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }

  private cancelTransport(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  private schedule(query: string, version: number, delayMs: number): void {
    this.timer = setTimeout(() => {
      this.timer = null;
      if (version !== this.requestVersion) return;
      this.publish({ query, phase: 'loading', response: null });
      void this.execute(query, version);
    }, delayMs);
  }

  private async execute(
    query: string,
    version: number,
    televisionDayStartMs = guideTelevisionDayStart(Date.now()),
  ): Promise<void> {
    const controller = new AbortController();
    this.controller = controller;
    this.requestedTelevisionDayStartMs = televisionDayStartMs;

    try {
      const response = await this.api.search(
        { query },
        { signal: controller.signal },
      );
      if (version !== this.requestVersion || controller.signal.aborted) return;

      if (response.status === 'unavailable') {
        this.publish({ query, phase: 'unavailable', response: null });
        return;
      }

      this.publish({ query, phase: 'ready', response });
    } catch (error) {
      if (
        version !== this.requestVersion ||
        controller.signal.aborted ||
        isAbortError(error)
      ) {
        return;
      }
      this.publish({ query, phase: 'unavailable', response: null });
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }
}

/**
 * Process-local active Search context only.
 * Deliberately not persisted: this is query/result continuity, not Search history.
 */
export const guideSearchSession = new GuideSearchSession(
  new HostedGuideSearchClient(),
);

export function useGuideSearchSession(): GuideSearchSessionSnapshot {
  return useSyncExternalStore(
    guideSearchSession.subscribe,
    guideSearchSession.getSnapshot,
    guideSearchSession.getSnapshot,
  );
}
