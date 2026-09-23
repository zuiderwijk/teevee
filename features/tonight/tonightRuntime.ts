import { useSyncExternalStore } from 'react';

import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';
import type { GuideSchedule } from '@/data/domain/epg';
import {
  guideTelevisionDayStart,
} from '@/data/domain/guideTime';
import type { ProgrammeClassification } from '@/data/domain/programmeClassification';
import {
  tonightClassificationCandidateProgrammeIds,
} from '@/data/domain/tonight';
import type { GuideScheduleApi } from '@/services/api/guideScheduleContract';
import { HostedGuideScheduleClient } from '@/services/api/hostedGuideScheduleClient';
import { HostedProgrammeClassificationClient } from '@/services/api/hostedProgrammeClassificationClient';
import {
  PROGRAMME_CLASSIFICATION_MAX_IDS,
  type ProgrammeClassificationApi,
} from '@/services/api/programmeClassificationContract';

export type TonightRuntimeData = {
  televisionDayStartMs: number;
  schedule: GuideSchedule;
  editorialSignals: ProgrammeEditorialSignal[];
  classifications: ProgrammeClassification[];
};

export type TonightRuntimePhase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'partial'
  | 'unavailable';

export type TonightRuntimeSnapshot = {
  phase: TonightRuntimePhase;
  televisionDayStartMs: number | null;
  data: TonightRuntimeData | null;
};

type Listener = () => void;

function requestedClassifications(
  classifications: readonly ProgrammeClassification[],
  requestedIds: readonly string[],
): {
  classifications: ProgrammeClassification[];
  complete: boolean;
} {
  const requested = new Set(requestedIds);
  const byId = new Map<string, ProgrammeClassification>();

  for (const classification of classifications) {
    if (!requested.has(classification.programmeId)) continue;
    byId.set(classification.programmeId, classification);
  }

  return {
    classifications: [...byId.values()],
    complete: requestedIds.every((programmeId) => byId.has(programmeId)),
  };
}

export class TonightRuntime {
  private snapshot: TonightRuntimeSnapshot = {
    phase: 'idle',
    televisionDayStartMs: null,
    data: null,
  };
  private readonly listeners = new Set<Listener>();
  private requestVersion = 0;

  constructor(
    private readonly scheduleApi: GuideScheduleApi,
    private readonly classificationApi: ProgrammeClassificationApi,
  ) {}

  readonly getSnapshot = (): TonightRuntimeSnapshot => this.snapshot;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly ensureTelevisionDay = (nowMs = Date.now()): void => {
    const televisionDayStartMs = guideTelevisionDayStart(nowMs);
    if (
      this.snapshot.televisionDayStartMs === televisionDayStartMs &&
      this.snapshot.phase !== 'idle'
    ) {
      return;
    }
    void this.refresh(nowMs);
  };

  readonly retry = (): void => {
    void this.refresh(Date.now());
  };

  readonly refresh = async (nowMs = Date.now()): Promise<void> => {
    const televisionDayStartMs = guideTelevisionDayStart(nowMs);
    const previousData =
      this.snapshot.televisionDayStartMs === televisionDayStartMs
        ? this.snapshot.data
        : null;
    const version = this.requestVersion + 1;
    this.requestVersion = version;

    this.publish({
      phase: 'loading',
      televisionDayStartMs,
      data: previousData,
    });

    const from = new Date(televisionDayStartMs).toISOString();
    const to = new Date(guideTelevisionDayStart(televisionDayStartMs, 1)).toISOString();

    let response;
    try {
      response = await this.scheduleApi.getSchedule({ from, to });
    } catch {
      if (!this.isCurrentRequest(version, televisionDayStartMs)) return;
      this.publish({
        phase: previousData ? 'partial' : 'unavailable',
        televisionDayStartMs,
        data: previousData,
      });
      return;
    }

    if (!this.isCurrentRequest(version, televisionDayStartMs)) return;

    if (response.status === 'unavailable') {
      this.publish({
        phase: previousData ? 'partial' : 'unavailable',
        televisionDayStartMs,
        data: previousData,
      });
      return;
    }

    const scheduleData: TonightRuntimeData = {
      televisionDayStartMs,
      schedule: response.schedule,
      editorialSignals: response.editorialSignals ?? [],
      classifications: [],
    };

    const programmeIds = tonightClassificationCandidateProgrammeIds(
      response.schedule.programmes,
      nowMs,
    );

    if (programmeIds.length === 0) {
      this.publish({
        phase: 'ready',
        televisionDayStartMs,
        data: scheduleData,
      });
      return;
    }

    if (programmeIds.length > PROGRAMME_CLASSIFICATION_MAX_IDS) {
      this.publish({
        phase: 'partial',
        televisionDayStartMs,
        data: scheduleData,
      });
      return;
    }

    let classificationResponse;
    try {
      classificationResponse =
        await this.classificationApi.getClassifications({ programmeIds });
    } catch {
      if (!this.isCurrentRequest(version, televisionDayStartMs)) return;
      this.publish({
        phase: 'partial',
        televisionDayStartMs,
        data: scheduleData,
      });
      return;
    }

    if (!this.isCurrentRequest(version, televisionDayStartMs)) return;

    if (classificationResponse.status === 'unavailable') {
      this.publish({
        phase: 'partial',
        televisionDayStartMs,
        data: scheduleData,
      });
      return;
    }

    const bounded = requestedClassifications(
      classificationResponse.classifications,
      programmeIds,
    );
    this.publish({
      phase: bounded.complete ? 'ready' : 'partial',
      televisionDayStartMs,
      data: {
        ...scheduleData,
        classifications: bounded.classifications,
      },
    });
  };

  private isCurrentRequest(version: number, televisionDayStartMs: number): boolean {
    return (
      this.requestVersion === version &&
      this.snapshot.televisionDayStartMs === televisionDayStartMs
    );
  }

  private publish(snapshot: TonightRuntimeSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}

export const tonightRuntime = new TonightRuntime(
  new HostedGuideScheduleClient(),
  new HostedProgrammeClassificationClient(),
);

export function useTonightRuntime(): TonightRuntimeSnapshot {
  return useSyncExternalStore(
    tonightRuntime.subscribe,
    tonightRuntime.getSnapshot,
    tonightRuntime.getSnapshot,
  );
}
