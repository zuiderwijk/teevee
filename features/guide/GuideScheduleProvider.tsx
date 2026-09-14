import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { GuideSchedule } from '@/data/domain/epg';
import { guideDayStart } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture } from '@/data/fixtures/runtimeGuideFixture';
import type { GuideScheduleApi } from '@/services/api/guideScheduleContract';
import { HostedGuideScheduleClient } from '@/services/api/hostedGuideScheduleClient';
import { loadTwoDayGuideSchedule } from '@/services/api/guideScheduleLoader';

type GuideScheduleSource = 'fixture' | 'hosted';

type GuideScheduleState = {
  schedule: GuideSchedule;
  anchorMs: number;
  source: GuideScheduleSource;
};

export type GuideScheduleData = GuideScheduleState & {
  refresh: (anchorMs?: number) => void;
};

type GuideScheduleProviderProps = {
  children: ReactNode;
  api?: GuideScheduleApi;
};

const hostedApi = new HostedGuideScheduleClient();
const GuideScheduleContext = createContext<GuideScheduleData | null>(null);

function fixtureState(anchorMs: number): GuideScheduleState {
  return {
    schedule: buildRuntimeGuideFixture(anchorMs),
    anchorMs,
    source: 'fixture',
  };
}

export function guideScheduleNeedsRefresh(anchorMs: number, nowMs: number): boolean {
  return guideDayStart(anchorMs) !== guideDayStart(nowMs);
}

export function GuideScheduleProvider({ children, api = hostedApi }: GuideScheduleProviderProps) {
  const initialAnchorRef = useRef(Date.now());
  const [state, setState] = useState<GuideScheduleState>(() => fixtureState(initialAnchorRef.current));
  const requestVersionRef = useRef(0);

  const refresh = useCallback(
    (nextAnchorMs = Date.now()) => {
      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;
      setState(fixtureState(nextAnchorMs));

      void loadTwoDayGuideSchedule(api, nextAnchorMs)
        .then((schedule) => {
          if (requestVersionRef.current !== requestVersion) return;
          if (!schedule || schedule.channels.length === 0 || schedule.programmes.length === 0) return;
          setState({ schedule, anchorMs: nextAnchorMs, source: 'hosted' });
        })
        .catch(() => {
          // Development/offline fallback is intentionally the deterministic fixture.
        });
    },
    [api],
  );

  useEffect(() => {
    refresh(initialAnchorRef.current);
    return () => {
      requestVersionRef.current += 1;
    };
  }, [refresh]);

  const value = useMemo<GuideScheduleData>(
    () => ({ ...state, refresh }),
    [refresh, state],
  );

  return <GuideScheduleContext.Provider value={value}>{children}</GuideScheduleContext.Provider>;
}

/**
 * Guide components keep a local deterministic fallback when rendered without the app-level
 * provider (component tests/story-like development). The production app mounts one shared
 * provider so Totaal, Per zender and deferred Nu & Straks consume the same canonical data.
 */
export function useGuideScheduleData(): GuideScheduleData {
  const context = useContext(GuideScheduleContext);
  const [fallbackAnchorMs, setFallbackAnchorMs] = useState(() => Date.now());
  const fallbackSchedule = useMemo(
    () => buildRuntimeGuideFixture(fallbackAnchorMs),
    [fallbackAnchorMs],
  );
  const fallbackRefresh = useCallback((anchorMs = Date.now()) => setFallbackAnchorMs(anchorMs), []);
  const fallback = useMemo<GuideScheduleData>(
    () => ({
      schedule: fallbackSchedule,
      anchorMs: fallbackAnchorMs,
      source: 'fixture',
      refresh: fallbackRefresh,
    }),
    [fallbackAnchorMs, fallbackRefresh, fallbackSchedule],
  );
  return context ?? fallback;
}
