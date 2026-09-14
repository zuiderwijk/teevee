import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { guideDayStart } from '@/data/domain/guideTime';
import {
  guideScheduleContentEqual,
  installRuntimeGuideSchedule,
  runtimeGuideScheduleFor,
} from '@/data/runtime/guideScheduleRuntime';
import type { GuideScheduleApi } from '@/services/api/guideScheduleContract';
import { HostedGuideScheduleClient } from '@/services/api/hostedGuideScheduleClient';
import { loadTwoDayGuideSchedule } from '@/services/api/guideScheduleLoader';

const hostedGuideScheduleApi = new HostedGuideScheduleClient();
const DAY_CHANGE_CHECK_MS = 30_000;

/**
 * Keep the shared runtime schedule fixture-first and replace it with hosted canonical
 * data when available. The returned version is only used as a React `key` boundary so
 * the existing physically accepted Guide implementations can rebuild when user-visible
 * data really changes, without introducing network state into their scroll/gesture logic.
 */
export function useHostedGuideScheduleRuntime(
  api: GuideScheduleApi = hostedGuideScheduleApi,
): number {
  const [version, setVersion] = useState(0);
  const activeDayStartRef = useRef(guideDayStart(Date.now()));
  const requestVersionRef = useRef(0);

  const refresh = useCallback(
    (anchorMs = Date.now()) => {
      const nextDayStart = guideDayStart(anchorMs);
      if (nextDayStart !== activeDayStartRef.current) {
        activeDayStartRef.current = nextDayStart;
        // The previously installed real schedule belongs to yesterday. Remount now;
        // buildRuntimeGuideFixture will deterministically fall back while the network loads.
        setVersion((current) => current + 1);
      }

      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;
      void loadTwoDayGuideSchedule(api, anchorMs)
        .then((schedule) => {
          if (requestVersionRef.current !== requestVersion) return;
          if (!schedule || schedule.channels.length === 0 || schedule.programmes.length === 0) return;

          const currentSchedule = runtimeGuideScheduleFor(anchorMs);
          if (currentSchedule && guideScheduleContentEqual(currentSchedule, schedule)) {
            // `generatedAt` may advance while all user-visible data stays identical.
            // Keep the same installed object so Guide-local refresh checks also preserve
            // scroll/channel context instead of picking up a freshness-only replacement.
            return;
          }

          installRuntimeGuideSchedule(schedule, anchorMs);
          setVersion((current) => current + 1);
        })
        .catch(() => {
          // Offline/unavailable/invalid hosted data leaves the deterministic fixture usable.
        });
    },
    [api],
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let subscription: ReturnType<typeof AppState.addEventListener> | null = null;

    // Preserve the proven startup path: the first frame always renders immediately from
    // deterministic local data. Network work and lifecycle subscriptions start afterwards.
    const frame = requestAnimationFrame(() => {
      refresh();
      interval = setInterval(() => {
        const nowMs = Date.now();
        if (guideDayStart(nowMs) !== activeDayStartRef.current) refresh(nowMs);
      }, DAY_CHANGE_CHECK_MS);
      subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') refresh(Date.now());
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      if (interval !== null) clearInterval(interval);
      subscription?.remove();
      requestVersionRef.current += 1;
    };
  }, [refresh]);

  return version;
}
