import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const DEFAULT_TICK_MS = 30_000;

export function useGuideClock(tickMs = DEFAULT_TICK_MS): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const refreshNow = () => setNowMs(Date.now());
    const interval = setInterval(refreshNow, tickMs);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshNow();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [tickMs]);

  return nowMs;
}
