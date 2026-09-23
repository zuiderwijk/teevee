import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';
import type { GuideSchedule, Programme } from '@/data/domain/epg';
import { guideTelevisionDayTime } from '@/data/domain/guideTime';
import {
  programmeHasEndedAt,
  programmeIntersectsWindow,
  programmeIsCurrentAt,
  tonightWindow,
} from '@/data/domain/tonight';
import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  programmeSnapshot,
  withProgrammeSaved,
  type ProgrammePersonalState,
} from '@/features/guide/programmePersonalState';

import type { TonightViewModel } from './tonightPresentation';
import type {
  TonightRuntimeData,
  TonightRuntimeSnapshot,
} from './tonightRuntime';

export const TONIGHT_DEVELOPMENT_SCENARIOS = [
  { id: 'live', label: 'Live' },
  { id: 'primetime', label: 'Primetime 20:30' },
  { id: 'jouw-mixed', label: 'Jouw gids mix' },
  { id: 'never-used-empty', label: 'Nooit bewaard' },
  { id: 'used-empty', label: 'Gebruikt, leeg' },
  { id: 'kijktip-fallback', label: 'Kijktip fallback' },
  { id: 'partial', label: 'Partial' },
  { id: 'offline', label: 'Offline' },
  { id: 'no-sport', label: 'Zonder Sport' },
  { id: 'no-discovery', label: 'Geen discovery' },
  { id: 'after-midnight', label: 'Na middernacht' },
] as const;

export type TonightDevelopmentScenario =
  (typeof TONIGHT_DEVELOPMENT_SCENARIOS)[number]['id'];

function developmentAnchor(
  scenario: TonightDevelopmentScenario,
  liveNowMs: number,
): number {
  if (scenario === 'live') return liveNowMs;
  const window = tonightWindow(liveNowMs);
  return scenario === 'after-midnight'
    ? guideTelevisionDayTime(window.televisionDayStartMs, 0, 30)
    : guideTelevisionDayTime(window.televisionDayStartMs, 20, 30);
}

function mixedPersonalState(
  schedule: GuideSchedule | null,
  nowMs: number,
  fallback: ProgrammePersonalState,
): ProgrammePersonalState {
  if (!schedule) return fallback;
  const window = tonightWindow(nowMs);
  const evening = schedule.programmes
    .filter((programme) =>
      programmeIntersectsWindow(
        programme,
        window.eveningStartMs,
        window.eveningEndMs,
      ),
    )
    .sort(
      (left, right) =>
        Date.parse(left.startAt) - Date.parse(right.startAt) ||
        left.id.localeCompare(right.id),
    );

  const ended = evening.find((programme) => programmeHasEndedAt(programme, nowMs));
  const current = evening.filter((programme) =>
    programmeIsCurrentAt(programme, nowMs),
  );
  const future = evening.find((programme) => Date.parse(programme.startAt) > nowMs);

  let state: ProgrammePersonalState = {
    ...EMPTY_PROGRAMME_PERSONAL_STATE,
    hasUsedSave: true,
  };

  const candidates = [
    ended,
    current[0],
    current.find(
      (programme) =>
        programme.channelId !== current[0]?.channelId,
    ),
    future,
  ].filter((programme): programme is Programme => programme !== undefined);

  for (const programme of candidates) {
    state = withProgrammeSaved(state, programme, true);
  }

  const staleSource = future ?? current[0] ?? ended;
  if (staleSource) {
    const staleId = `dev-stale-${staleSource.id}`;
    state = {
      ...state,
      saved: {
        ...state.saved,
        [staleId]: {
          ...programmeSnapshot(staleSource),
          programmeId: staleId,
          title: `${staleSource.title} · lokale snapshot`,
        },
      },
    };
  }

  return state;
}

function developmentEditorialData(
  scenario: TonightDevelopmentScenario,
  data: TonightRuntimeData | null,
  nowMs: number,
): TonightRuntimeData | null {
  if (scenario !== 'kijktip-fallback' || !data) return data;

  const existingIds = new Set(
    data.editorialSignals.map((signal) => signal.programmeId),
  );
  const window = tonightWindow(nowMs);
  const candidate = data.schedule.programmes.find(
    (programme) =>
      Date.parse(programme.startAt) >= window.eveningStartMs &&
      Date.parse(programme.startAt) < window.eveningEndMs &&
      Date.parse(programme.endAt) > nowMs &&
      !existingIds.has(programme.id),
  );
  if (!candidate) return data;

  const signal: ProgrammeEditorialSignal = {
    programmeId: candidate.id,
    type: 'kijktip',
    source: 'tvgids',
    sourceItemId: `dev-fixture-${candidate.id}`,
    matchedBy: 'source-id',
  };
  return {
    ...data,
    editorialSignals: [...data.editorialSignals, signal],
  };
}

export function resolveTonightDevelopmentState(input: {
  scenario: TonightDevelopmentScenario;
  liveNowMs: number;
  runtime: TonightRuntimeSnapshot;
  personalState: ProgrammePersonalState;
}): {
  nowMs: number;
  runtime: TonightRuntimeSnapshot;
  personalState: ProgrammePersonalState;
} {
  const { scenario, liveNowMs } = input;
  const nowMs = developmentAnchor(scenario, liveNowMs);
  const originalData = input.runtime.data;
  const data = developmentEditorialData(scenario, originalData, nowMs);

  let personalState = input.personalState;
  if (scenario === 'never-used-empty') {
    personalState = EMPTY_PROGRAMME_PERSONAL_STATE;
  } else if (scenario === 'used-empty') {
    personalState = {
      ...EMPTY_PROGRAMME_PERSONAL_STATE,
      hasUsedSave: true,
    };
  } else if (scenario === 'jouw-mixed' || scenario === 'offline') {
    personalState = mixedPersonalState(
      originalData?.schedule ?? null,
      nowMs,
      input.personalState,
    );
  }

  let runtime = data === originalData
    ? input.runtime
    : { ...input.runtime, data };

  if (scenario === 'partial') {
    runtime = { ...runtime, phase: 'partial' };
  } else if (scenario === 'offline') {
    runtime = {
      phase: 'unavailable',
      televisionDayStartMs: tonightWindow(nowMs).televisionDayStartMs,
      data: null,
    };
  }

  return { nowMs, runtime, personalState };
}

export function applyTonightDevelopmentModuleState(
  scenario: TonightDevelopmentScenario,
  model: TonightViewModel,
): TonightViewModel {
  if (scenario === 'no-sport') return { ...model, sport: [] };
  if (scenario === 'no-discovery') {
    return {
      ...model,
      kijktips: [],
      films: [],
      series: [],
      sport: [],
    };
  }
  return model;
}

export function tonightDevelopmentRefreshAnchor(
  scenario: TonightDevelopmentScenario,
  liveNowMs: number,
): number | null {
  if (scenario === 'live' || scenario === 'offline') return null;
  return developmentAnchor(scenario, liveNowMs);
}
