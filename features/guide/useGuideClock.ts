import { useEffect, useState } from 'react';

const DEFAULT_TICK_MS = 30_000;

export function useGuideClock(tickMs = DEFAULT_TICK_MS): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), tickMs);
    return () => clearInterval(interval);
  }, [tickMs]);

  return nowMs;
}
