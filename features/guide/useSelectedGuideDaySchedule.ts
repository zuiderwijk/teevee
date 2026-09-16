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

import {
  createGuideDayCacheInstanceId,
  type GuideDaySwitchSurface,
  markGuideDayCacheMounted,
  markGuideDayCacheUnmounted,
  markGuideDayFirstFrame,
  markGuideDaySelectionCommitted,
  markGuideDaySwitchSurfaceMounted,
  markGuideDaySwitchSurfaceUnmounted,
  markGuideDayWindowNetworkFinished,
  markGuideDayWindowNetworkStarted,
  markGuideDayWindowResolution,
} from './guideDaySwitchDiagnostics';

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
 *
 * `currentTelevisionDayStartMs` is the lifecycle ownership source of truth. Keeping this
 * relationship explicit means an unchanged selected day can hand off from current-day
 * runtime ownership to selected-window ownership when the real clock crosses 06:00.
 *
 * Issue #67 instrumentation observes this existing path only. Totaal mounts on current D
 * with its in-horizon following day enabled; Per zender never requests that second day.
 * The derived measurement surface is kept stable for the lifetime of this hook instance,
 * including Totaal at D+7 where the following-day read becomes disabled.
 */
export function useSelectedGuideDaySchedule(
  selectedDayStartMs: number,
  guideDataVersion: number,
  api: GuideScheduleApi = hostedGuideScheduleApi,
  includeFollowingDay = false,
  currentTelevisionDayStartMs = guideTelevisionDayStart(Date.now()),
): SelectedGuideDayScheduleState {
  const cacheRef = useRef(new Map<string, GuideSchedule>());
  const requestVersionRef = useRef(0);
  const diagnosticsSurfaceRef = useRef<GuideDaySwitchSurface | null>(null);
  if (diagnosticsSurfaceRef.current === null) {
    diagnosticsSurfaceRef.current = includeFollowingDay ? 'totaal' : 'per-zender';
  }
  const diagnosticsSurface = diagnosticsSurfaceRef.current;
  const diagnosticsCacheInstanceIdRef = useRef<string | null>(null);
  if (diagnosticsCacheInstanceIdRef.current === null) {
    diagnosticsCacheInstanceIdRef.current = createGuideDayCacheInstanceId(diagnosticsSurface);
  }
  const diagnosticsCacheInstanceId = diagnosticsCacheInstanceIdRef.current;
  const [cacheVersion, setCacheVersion] = useState(0);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [unavailableKey, setUnavailableKey] = useState<string | null>(null);
  const selectedKey = cacheKey(selectedDayStartMs, includeFollowingDay);
  const selectedDayIsCurrent = selectedDayStartMs === currentTelevisionDayStartMs;

  useEffect(() => {
    markGuideDaySwitchSurfaceMounted(diagnosticsSurface);
    markGuideDayCacheMounted(diagnosticsSurface, diagnosticsCacheInstanceId);
    return () => {
      markGuideDayCacheUnmounted(diagnosticsSurface, diagnosticsCacheInstanceId);
      markGuideDaySwitchSurfaceUnmounted(diagnosticsSurface);
    };
  }, [diagnosticsCacheInstanceId, diagnosticsSurface]);

  const refresh = useCallback(
    (force: boolean) => {
      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;
      const key = cacheKey(selectedDayStartMs, includeFollowingDay);

      const runtimeSchedule = runtimeGuideScheduleFor(selectedDayStartMs);
      if (runtimeSchedule && selectedDayIsCurrent) {
        // The shared current-day runtime already contains D + D+1. It is valid for both
        // the one-day Per-zender view and the bounded two-day Totaal view.
        if (rememberSchedule(cacheRef.current, key, runtimeSchedule)) {
          setCacheVersion((current) => current + 1);
        }
        markGuideDayWindowResolution(
          diagnosticsSurface,
          selectedDayStartMs,
          diagnosticsCacheInstanceId,
          'current-runtime',
          force,
          runtimeSchedule.channels.length,
          runtimeSchedule.programmes.length,
        );
        setLoadingKey(null);
        setUnavailableKey(null);
        return;
      }

      // The fixture-first shared runtime owns current-day network loading. Starting a
      // second request here would duplicate work and could race the proven runtime path.
      if (selectedDayIsCurrent) {
        setLoadingKey(null);
        setUnavailableKey(null);
        return;
      }

      const cachedSchedule = cacheRef.current.get(key);
      if (!force && cachedSchedule) {
        markGuideDayWindowResolution(
          diagnosticsSurface,
          selectedDayStartMs,
          diagnosticsCacheInstanceId,
          'session-cache',
          false,
          cachedSchedule.channels.length,
          cachedSchedule.programmes.length,
        );
        setLoadingKey(null);
        setUnavailableKey(null);
        return;
      }

      setLoadingKey(key);
      setUnavailableKey(null);
      const networkStartedAtMs = markGuideDayWindowNetworkStarted(
        diagnosticsSurface,
        selectedDayStartMs,
        diagnosticsCacheInstanceId,
        includeFollowingDay ? 2 : 1,
        force,
      );
      const request = includeFollowingDay
        ? loadTwoTelevisionDayGuideSchedule(api, selectedDayStartMs)
        : loadTelevisionDayGuideSchedule(api, selectedDayStartMs);

      void request
        .then((schedule) => {
          if (requestVersionRef.current !== requestVersion) return;
          setLoadingKey(null);
          if (!schedule || schedule.channels.length === 0) {
            markGuideDayWindowNetworkFinished(
              diagnosticsSurface,
              selectedDayStartMs,
              diagnosticsCacheInstanceId,
              networkStartedAtMs,
              'unavailable',
              schedule?.channels.length,
              schedule?.programmes.length,
            );
            markGuideDayWindowResolution(
              diagnosticsSurface,
              selectedDayStartMs,
              diagnosticsCacheInstanceId,
              'unavailable',
              force,
              schedule?.channels.length,
              schedule?.programmes.length,
            );
            // ADR 0007 makes a covered canonical window with zero programmes authoritative.
            // A zero-channel result is handled separately as structurally unusable for Guide UI.
            setUnavailableKey(key);
            return;
          }

          markGuideDayWindowNetworkFinished(
            diagnosticsSurface,
            selectedDayStartMs,
            diagnosticsCacheInstanceId,
            networkStartedAtMs,
            'network',
            schedule.channels.length,
            schedule.programmes.length,
          );
          markGuideDayWindowResolution(
            diagnosticsSurface,
            selectedDayStartMs,
            diagnosticsCacheInstanceId,
            'network',
            force,
            schedule.channels.length,
            schedule.programmes.length,
          );

          if (rememberSchedule(cacheRef.current, key, schedule)) {
            setCacheVersion((current) => current + 1);
          }
        })
        .catch(() => {
          if (requestVersionRef.current !== requestVersion) return;
          markGuideDayWindowNetworkFinished(
            diagnosticsSurface,
            selectedDayStartMs,
            diagnosticsCacheInstanceId,
            networkStartedAtMs,
            'network-error',
          );
          markGuideDayWindowResolution(
            diagnosticsSurface,
            selectedDayStartMs,
            diagnosticsCacheInstanceId,
            'network-error',
            force,
          );
          setLoadingKey(null);
          setUnavailableKey(key);
        });
    },
    [
      api,
      diagnosticsCacheInstanceId,
      diagnosticsSurface,
      includeFollowingDay,
      selectedDayIsCurrent,
      selectedDayStartMs,
    ],
  );

  // Selection/API/window-width/ownership changes invalidate the previous selected-window
  // request. Runtime-version changes deliberately do not: a current-day refresh must not
  // cancel an in-flight non-current selected-day revalidation after app resume.
  useEffect(() => {
    refresh(false);
    return () => {
      requestVersionRef.current += 1;
    };
  }, [refresh]);

  useEffect(() => {
    if (!selectedDayIsCurrent) return;
    const runtimeSchedule = runtimeGuideScheduleFor(selectedDayStartMs);
    if (!runtimeSchedule) return;
    const key = cacheKey(selectedDayStartMs, includeFollowingDay);
    if (rememberSchedule(cacheRef.current, key, runtimeSchedule)) {
      setCacheVersion((current) => current + 1);
    }
    setUnavailableKey(null);
  }, [guideDataVersion, includeFollowingDay, selectedDayIsCurrent, selectedDayStartMs]);

  useEffect(() => {
    // Current-day resume is already owned by the shared fixture-first runtime. Once the
    // same selected day becomes non-current at 06:00, `selectedDayIsCurrent` flips even
    // though `selectedDayStartMs` is unchanged, so this effect installs bounded lifecycle
    // revalidation for the now-historical visible window.
    if (selectedDayIsCurrent) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refresh(true);
    });
    return () => subscription.remove();
  }, [refresh, selectedDayIsCurrent]);

  // cacheVersion intentionally participates in this render even though the Map itself is
  // held in a ref. It keeps successful content changes reactive without remounting Guide UI.
  void cacheVersion;
  const runtimeSchedule = selectedDayIsCurrent
    ? runtimeGuideScheduleFor(selectedDayStartMs)
    : null;
  const schedule = runtimeSchedule ?? cacheRef.current.get(selectedKey) ?? null;

  useEffect(() => {
    markGuideDaySelectionCommitted(diagnosticsSurface, selectedDayStartMs);
    const source = schedule ? 'schedule' : 'fixture';
    if (typeof requestAnimationFrame !== 'function') {
      markGuideDayFirstFrame(
        diagnosticsSurface,
        selectedDayStartMs,
        source,
        schedule?.channels.length,
        schedule?.programmes.length,
      );
      return;
    }
    const frame = requestAnimationFrame(() => {
      markGuideDayFirstFrame(
        diagnosticsSurface,
        selectedDayStartMs,
        source,
        schedule?.channels.length,
        schedule?.programmes.length,
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [diagnosticsSurface, schedule, selectedDayStartMs]);

  return {
    schedule,
    loading: loadingKey === selectedKey,
    unavailable: unavailableKey === selectedKey,
  };
}