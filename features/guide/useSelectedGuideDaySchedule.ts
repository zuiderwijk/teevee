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
import { loadTelevisionDayGuideSchedule } from '@/services/api/guideScheduleLoader';

const hostedGuideScheduleApi = new HostedGuideScheduleClient();
const MAX_VISITED_DAY_WINDOWS = 10;

type SelectedGuideDayScheduleState = {
  schedule: GuideSchedule | null;
  loading: boolean;
  unavailable: boolean;
};

function rememberSchedule(
  cache: Map<number, GuideSchedule>,
  dayStartMs: number,
  schedule: GuideSchedule,
): boolean {
  const existing = cache.get(dayStartMs);
  if (existing && guideScheduleContentEqual(existing, schedule)) return false;

  if (!existing && cache.size >= MAX_VISITED_DAY_WINDOWS) {
    const oldestKey = cache.keys().next().value as number | undefined;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(dayStartMs, schedule);
  return true;
}

/**
 * On-demand selected-day loader for Totaal and Per zender.
 *
 * Only the selected non-current television day is fetched, through one bounded day read.
 * Previously visited windows live in a small component-session Map so returning to a day
 * is immediate; there is no persistent cache, eager ten-day payload or provider knowledge.
 * The current television day remains owned by the proven fixture-first shared runtime.
 */
export function useSelectedGuideDaySchedule(
  selectedDayStartMs: number,
  guideDataVersion: number,
  api: GuideScheduleApi = hostedGuideScheduleApi,
): SelectedGuideDayScheduleState {
  const cacheRef = useRef(new Map<number, GuideSchedule>());
  const requestVersionRef = useRef(0);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [loadingDayStartMs, setLoadingDayStartMs] = useState<number | null>(null);
  const [unavailableDayStartMs, setUnavailableDayStartMs] = useState<number | null>(null);

  const refresh = useCallback(
    (force: boolean) => {
      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;

      const currentDayStartMs = guideTelevisionDayStart(Date.now());
      const runtimeSchedule = runtimeGuideScheduleFor(selectedDayStartMs);
      if (runtimeSchedule) {
        if (rememberSchedule(cacheRef.current, selectedDayStartMs, runtimeSchedule)) {
          setCacheVersion((current) => current + 1);
        }
        setLoadingDayStartMs(null);
        setUnavailableDayStartMs(null);
        return;
      }

      // The fixture-first shared runtime owns current-day network loading. Starting a
      // second request here would duplicate work and could race the proven runtime path.
      if (selectedDayStartMs === currentDayStartMs) {
        setLoadingDayStartMs(null);
        setUnavailableDayStartMs(null);
        return;
      }

      if (!force && cacheRef.current.has(selectedDayStartMs)) {
        setLoadingDayStartMs(null);
        setUnavailableDayStartMs(null);
        return;
      }

      setLoadingDayStartMs(selectedDayStartMs);
      setUnavailableDayStartMs(null);
      void loadTelevisionDayGuideSchedule(api, selectedDayStartMs)
        .then((schedule) => {
          if (requestVersionRef.current !== requestVersion) return;
          setLoadingDayStartMs(null);
          if (!schedule || schedule.channels.length === 0 || schedule.programmes.length === 0) {
            setUnavailableDayStartMs(selectedDayStartMs);
            return;
          }

          if (rememberSchedule(cacheRef.current, selectedDayStartMs, schedule)) {
            setCacheVersion((current) => current + 1);
          }
        })
        .catch(() => {
          if (requestVersionRef.current !== requestVersion) return;
          setLoadingDayStartMs(null);
          setUnavailableDayStartMs(selectedDayStartMs);
        });
    },
    [api, selectedDayStartMs],
  );

  // Selection/API changes invalidate the previous selected-day request. Runtime-version
  // changes deliberately do not: a current-day refresh must not cancel an in-flight
  // non-current selected-day revalidation after app resume.
  useEffect(() => {
    refresh(false);
    return () => {
      requestVersionRef.current += 1;
    };
  }, [refresh]);

  useEffect(() => {
    const runtimeSchedule = runtimeGuideScheduleFor(selectedDayStartMs);
    if (!runtimeSchedule) return;
    if (rememberSchedule(cacheRef.current, selectedDayStartMs, runtimeSchedule)) {
      setCacheVersion((current) => current + 1);
    }
    setUnavailableDayStartMs(null);
  }, [guideDataVersion, selectedDayStartMs]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      if (selectedDayStartMs === guideTelevisionDayStart(Date.now())) return;
      refresh(true);
    });
    return () => subscription.remove();
  }, [refresh, selectedDayStartMs]);

  // cacheVersion intentionally participates in this render even though the Map itself is
  // held in a ref. It keeps successful content changes reactive without remounting Guide UI.
  void cacheVersion;
  const runtimeSchedule = runtimeGuideScheduleFor(selectedDayStartMs);
  const schedule = runtimeSchedule ?? cacheRef.current.get(selectedDayStartMs) ?? null;

  return {
    schedule,
    loading: loadingDayStartMs === selectedDayStartMs,
    unavailable: unavailableDayStartMs === selectedDayStartMs,
  };
}
