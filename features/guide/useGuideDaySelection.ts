import { useCallback, useEffect, useRef, useState } from 'react';

import { guideTelevisionDayStart } from '@/data/domain/guideTime';

import { guideDayIsSelectable, reconcileGuideDaySelection } from './guideDaySelection';

export function useGuideDaySelection(nowMs: number) {
  const currentDayStartMs = guideTelevisionDayStart(nowMs);
  const previousCurrentDayStartRef = useRef(currentDayStartMs);
  const [selectedDayStartMs, setSelectedDayStartMs] = useState(currentDayStartMs);

  useEffect(() => {
    const previousCurrentDayStartMs = previousCurrentDayStartRef.current;
    if (previousCurrentDayStartMs === currentDayStartMs) return;

    setSelectedDayStartMs((selected) =>
      reconcileGuideDaySelection(selected, previousCurrentDayStartMs, nowMs),
    );
    previousCurrentDayStartRef.current = currentDayStartMs;
  }, [currentDayStartMs, nowMs]);

  const selectDay = useCallback(
    (dayStartMs: number) => {
      if (!guideDayIsSelectable(dayStartMs, nowMs)) return false;
      setSelectedDayStartMs(dayStartMs);
      return true;
    },
    [nowMs],
  );

  return {
    currentDayStartMs,
    selectedDayStartMs,
    selectDay,
  };
}
