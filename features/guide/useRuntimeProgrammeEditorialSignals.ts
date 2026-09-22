import { useEffect, useMemo, useState } from 'react';

import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';
import {
  runtimeProgrammeEditorialSignalsFor,
  subscribeRuntimeProgrammeEditorialSignals,
} from '@/data/runtime/guideScheduleRuntime';

export function useRuntimeProgrammeEditorialSignals(
  anchorMs: number,
  guideDataVersion: number,
): ProgrammeEditorialSignal[] {
  const [editorialVersion, setEditorialVersion] = useState(0);

  useEffect(
    () =>
      subscribeRuntimeProgrammeEditorialSignals(() => {
        setEditorialVersion((current) => current + 1);
      }),
    [],
  );

  return useMemo(
    () => runtimeProgrammeEditorialSignalsFor(anchorMs),
    [anchorMs, editorialVersion, guideDataVersion],
  );
}
