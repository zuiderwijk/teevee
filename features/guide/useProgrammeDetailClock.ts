import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type ProgrammeDetailClock = {
  now: () => number;
  setTimer: (
    callback: () => void,
    delayMs: number,
  ) => ReturnType<typeof setTimeout>;
  clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
  subscribeResume: (callback: () => void) => () => void;
};

export type ProgrammeDetailTemporalState = {
  reminderAvailable: boolean;
  current: boolean;
  nextBoundaryMs: number | null;
};

export const SYSTEM_PROGRAMME_DETAIL_CLOCK: ProgrammeDetailClock = {
  now: () => Date.now(),
  setTimer: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimer: (timer) => clearTimeout(timer),
  subscribeResume: (callback) => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') callback();
    });
    return () => subscription.remove();
  },
};

export function programmeDetailTemporalState(
  startAt: string,
  endAt: string,
  nowMs: number,
): ProgrammeDetailTemporalState {
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    !Number.isFinite(nowMs) ||
    endMs <= startMs
  ) {
    return { reminderAvailable: false, current: false, nextBoundaryMs: null };
  }

  const reminderAvailable = startMs > nowMs;
  const current = startMs <= nowMs && nowMs < endMs;
  const nextBoundaryMs =
    startMs > nowMs ? startMs : endMs > nowMs ? endMs : null;

  return { reminderAvailable, current, nextBoundaryMs };
}

export function useProgrammeDetailNow(
  startAt: string | null,
  endAt: string | null,
  visible: boolean,
  clock: ProgrammeDetailClock = SYSTEM_PROGRAMME_DETAIL_CLOCK,
): number {
  const [nowMs, setNowMs] = useState(() => clock.now());

  useEffect(() => {
    if (!visible || !startAt || !endAt) return;

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      if (disposed) return;
      if (timer !== null) {
        clock.clearTimer(timer);
        timer = null;
      }

      const nextNowMs = clock.now();
      setNowMs(nextNowMs);
      const nextBoundaryMs = programmeDetailTemporalState(
        startAt,
        endAt,
        nextNowMs,
      ).nextBoundaryMs;
      if (nextBoundaryMs !== null) {
        timer = clock.setTimer(refresh, Math.max(1, nextBoundaryMs - nextNowMs));
      }
    };

    refresh();
    const unsubscribeResume = clock.subscribeResume(refresh);
    return () => {
      disposed = true;
      if (timer !== null) clock.clearTimer(timer);
      unsubscribeResume();
    };
  }, [clock, endAt, startAt, visible]);

  return nowMs;
}
