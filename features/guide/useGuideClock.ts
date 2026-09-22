import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const DEFAULT_TICK_MS = 30_000;

function normaliseTickMs(tickMs: number): number {
  return Number.isFinite(tickMs) && tickMs > 0
    ? Math.max(1, Math.floor(tickMs))
    : DEFAULT_TICK_MS;
}

export function guideClockDelayToNextBoundary(
  nowMs: number,
  tickMs = DEFAULT_TICK_MS,
): number {
  const safeTickMs = normaliseTickMs(tickMs);
  const safeNowMs = Number.isFinite(nowMs) ? Math.max(0, nowMs) : 0;
  const remainder = safeNowMs % safeTickMs;
  return remainder === 0 ? safeTickMs : safeTickMs - remainder;
}

export function useGuideClock(tickMs = DEFAULT_TICK_MS): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const clearScheduledTick = () => {
      if (timeout === null) return;
      clearTimeout(timeout);
      timeout = null;
    };

    const refreshNow = () => setNowMs(Date.now());

    const scheduleNextTick = () => {
      clearScheduledTick();
      if (disposed) return;

      timeout = setTimeout(() => {
        timeout = null;
        if (disposed) return;
        refreshNow();
        scheduleNextTick();
      }, guideClockDelayToNextBoundary(Date.now(), tickMs));
    };

    scheduleNextTick();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshNow();
        scheduleNextTick();
      } else {
        clearScheduledTick();
      }
    });

    return () => {
      disposed = true;
      clearScheduledTick();
      subscription.remove();
    };
  }, [tickMs]);

  return nowMs;
}
