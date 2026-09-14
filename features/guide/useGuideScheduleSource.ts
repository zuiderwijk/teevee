import { useEffect, useState } from 'react';

import type { GuideSchedule } from '@/data/domain/epg';
import { guideDayStart } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture } from '@/data/fixtures/runtimeGuideFixture';
import { loadHostedGuideSchedule } from '@/services/api/hostedGuideScheduleClient';

import { useGuideClock } from './useGuideClock';

type GuideScheduleSourceState = {
  dayStartMs: number;
  schedule: GuideSchedule;
  source: 'fixture' | 'hosted';
};

function initialState(): GuideScheduleSourceState {
  const nowMs = Date.now();
  return {
    dayStartMs: guideDayStart(nowMs, 0),
    schedule: buildRuntimeGuideFixture(nowMs),
    source: 'fixture',
  };
}

/**
 * Single screen-level schedule source for every Guide presentation.
 *
 * The deterministic fixture renders immediately and remains the fallback whenever
 * any hosted day chunk is unavailable or invalid. Remote data replaces the entire
 * two-day horizon atomically; Teevee never mixes partial hosted data with fixtures.
 */
export function useGuideScheduleSource(): GuideSchedule {
  const nowMs = useGuideClock();
  const currentDayStartMs = guideDayStart(nowMs, 0);
  const [state, setState] = useState<GuideScheduleSourceState>(initialState);

  useEffect(() => {
    let cancelled = false;

    setState((current) => {
      if (current.dayStartMs === currentDayStartMs) return current;
      return {
        dayStartMs: currentDayStartMs,
        schedule: buildRuntimeGuideFixture(currentDayStartMs),
        source: 'fixture',
      };
    });

    void loadHostedGuideSchedule(currentDayStartMs)
      .then((schedule) => {
        if (cancelled || schedule === null) return;
        setState({ dayStartMs: currentDayStartMs, schedule, source: 'hosted' });
      })
      .catch(() => {
        // Fixture fallback is deliberate. A later source-status treatment can surface
        // stale/offline state once persistent schedule caching exists.
      });

    return () => {
      cancelled = true;
    };
  }, [currentDayStartMs]);

  return state.schedule;
}
