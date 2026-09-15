import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { GuideSchedule } from '@/data/domain/epg';
import { guideTelevisionDayStart } from '@/data/domain/guideTime';
import {
  guideScheduleContentEqual,
  runtimeGuideScheduleFor,
} from '@/data/runtime/guideScheduleRuntime';
import type { GuideScheduleApi } from '@/services/api/guideScheduleContract';
import { HostedGuideScheduleClient } from '@/services/api/hostedGuideScheduleClient';
import {
  loadTelevisionDayGuideSchedule,
  loadTwoTelevisionDayGuideSchedule,
} from '@/services/api/guideScheduleLoader';

const hostedGuideScheduleApi = new HostedGuideScheduleClient();
const MAX_VISITED_DAY_WINDOWS = 10;

type SelectedGuideDayScheduleState = {
  schedule: GuideSchedule | null;
  loading: boolean;
  unavailable: boolean;
};

function cacheKey(dayStartMs: number, includeFollowingDay: boolean): string {
  return `${dayStartMs}:${includeFollowingDay ? 2 : 1}`;
}

function rememberSchedule(
  cache: Map<string, GuideSchedule>,
  key: string,
  schedule: GuideSchedule,
): boolean {
  const existing = cache.get(key);
  if (existing && guideScheduleContentEqual(existing, schedule)) return false;

  if (!existing && cache.size >= MAX_VISITED_DAY_WINDOWS) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, schedule);
  return true;
}

/**
 * On-demand selected-day loader for Totaal and Per zender.
 *
 * Per zender needs exactly the selected television day. Totaal may request the selected
 * day plus its following day as two independent bounded reads so horizontal browsing can
 * remain continuous when the stable time anchor crosses 06:00. No wider payload is used.
 *
 * Previously visited windows live in a small component-session Map capped at ten entries;
 * there is no persistent cache, eager ten-day payload or provider knowledge. The current
 * television day remains owned by the proven fixture-first shared runtime.
 */
export function useSelectedGuideDaySchedule(
  selectedDayStartMs: number,
  guideDataVersion: number,
  api: GuideScheduleApi = hostedGuideScheduleApi,
  includeFollowingDay = false,
): SelectedGuideDayScheduleState {
  const cacheRef = useRef(new Map<string, GuideSchedule>());
  const requestVersionRef = useRef(0);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [unavailableKey, setUnavailableKey] = useState<string | null>(null);
  const selectedKey = cacheKey(selectedDayStartMs, includeFollowingDay);

  const refresh = useCallback(
    (force: boolean) => {
      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;
      const key = cacheKey(selectedDayStartMs, includeFollowingDay);

      const currentDayStartMs = guideTelevisionDayStart(Date.now());
      const runtimeSchedule = runtimeGuideScheduleFor(selectedDayStartMs);
      if (runtimeSchedule && selectedDayStartMs === currentDayStartMs) {
        // The shared current-day runtime already contains D + D+1. It is valid for both
        // the one-day Per-zender view and the bounded two-day Totaal view.
        if (rememberSchedule(cacheRef.current, key, runtimeSchedule)) {
          setCacheVersion((current) => current + 1);
        }
        setLoadingKey(null);
        setUnavailableKey(null);
        return;
      }

      // The fixture-first shared runtime owns current-day network loading. Starting a
      // second request here would duplicate work and could race the proven runtime path.
      if (selectedDayStartMs === currentDayStartMs) {
        setLoadingKey(null);
        setUnavailableKey(null);
        return;
      }

      if (!force && cacheRef.current.has(key)) {
        setLoadingKey(null);
        setUnavailableKey(null);
        return;
      }

      setLoadingKey(key);
      setUnavailableKey(null);
      const request = includeFollowingDay
        ? loadTwoTelevisionDayGuideSchedule(api, selectedDayStartMs)
        : loadTelevisionDayGuideSchedule(api, selectedDayStartMs);

      void request
        .then((schedule) => {
          if (requestVersionRef.current !== requestVersion) return;
          setLoadingKey(null);
          if (!schedule || schedule.channels.length === 0 || schedule.programmes.length === 0) {
            setUnavailableKey(key);
            return;
          }

          if (rememberSchedule(cacheRef.current, key, schedule)) {
            setCacheVersion((current) => current + 1);
          }
        })
        .catch(() => {
          if (requestVersionRef.current !== requestVersion) return;
          setLoadingKey(null);
          setUnavailableKey(key);
        });
    },
    [api, includeFollowingDay, selectedDayStartMs],
  );

  // Selection/API/window-width changes invalidate the previous selected-window request.
  // Runtime-version changes deliberately do not: a current-day refresh must not cancel an
  // in-flight non-current selected-day revalidation after app resume.
  useEffect(() => {
    refresh(false);
    return () => {
      requestVersionRef.current += 1;
    };
  }, [refresh]);

  useEffect(() => {
    const currentDayStartMs = guideTelevisionDayStart(Date.now());
    if (selectedDayStartMs !== currentDayStartMs) return;
    const runtimeSchedule = runtimeGuideScheduleFor(selectedDayStartMs);
    if (!runtimeSchedule) return;
    const key = cacheKey(selectedDayStartMs, includeFollowingDay);
    if (rememberSchedule(cacheRef.current, key, runtimeSchedule)) {
      setCacheVersion((current) => current + 1);
    }
    setUnavailableKey(null);
  }, [guideDataVersion, includeFollowingDay, selectedDayStartMs]);

  useEffect(() => {
    // Current-day resume is already owned by the shared fixture-first runtime. Avoid a
    // duplicate AppState listener/request there; only a manually selected non-current
    // window needs its own bounded lifecycle revalidation.
    if (selectedDayStartMs === guideTelevisionDayStart(Date.now())) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refresh(true);
    });
    return () => subscription.remove();
  }, [refresh, selectedDayStartMs]);

  // cacheVersion intentionally participates in this render even though the Map itself is
  // held in a ref. It keeps successful content changes reactive without remounting Guide UI.
  void cacheVersion;
  const currentDayStartMs = guideTelevisionDayStart(Date.now());
  const runtimeSchedule =
    selectedDayStartMs === currentDayStartMs ? runtimeGuideScheduleFor(selectedDayStartMs) : null;
  const schedule = runtimeSchedule ?? cacheRef.current.get(selectedKey) ?? null;

  return {
    schedule,
    loading: loadingKey === selectedKey,
    unavailable: unavailableKey === selectedKey,
  };
}
