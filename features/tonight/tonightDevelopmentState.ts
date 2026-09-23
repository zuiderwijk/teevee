import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';
import type { GuideSchedule, Programme } from '@/data/domain/epg';
import { guideTelevisionDayTime } from '@/data/domain/guideTime';
import type { ProgrammeClassification } from '@/data/domain/programmeClassification';
import {
  programmeHasEndedAt,
  programmeIntersectsWindow,
  programmeIsCurrentAt,
  programmeStartsInWindow,
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
  { id: 'series-density', label: 'Series ≥12' },
  { id: 'discovery-mix', label: 'Alle modules' },
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
  if (scenario === 'after-midnight') {
    return guideTelevisionDayTime(window.televisionDayStartMs, 0, 30);
  }
  if (scenario === 'series-density' || scenario === 'discovery-mix') {
    return guideTelevisionDayTime(window.televisionDayStartMs, 19);
  }
  return guideTelevisionDayTime(window.televisionDayStartMs, 20, 30);
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

type DevelopmentClassificationKind = 'film' | 'series' | 'sport';

function developmentClassification(
  programmeId: Programme['id'],
  kind: DevelopmentClassificationKind,
): ProgrammeClassification {
  const base: ProgrammeClassification = {
    programmeId,
    contentType: 'unknown',
    seriesType: 'unknown',
    audience: 'unknown',
    sportType: 'unknown',
    liveStatus: 'unknown',
    repeatStatus: 'unknown',
    confidence: 'high',
  };

  if (kind === 'film') return { ...base, contentType: 'film' };
  if (kind === 'series') {
    return {
      ...base,
      contentType: 'series',
      seriesType: 'scripted-episodic',
      audience: 'general-mainstream',
    };
  }
  return {
    ...base,
    contentType: 'sport',
    sportType: 'event',
  };
}

function developmentCategoryCandidates(
  data: TonightRuntimeData,
  nowMs: number,
): Programme[] {
  const window = tonightWindow(nowMs);
  const channelOrder = new Map(
    data.schedule.channels.map((channel) => [channel.id, channel.sortOrder]),
  );

  return data.schedule.programmes
    .filter(
      (programme) =>
        channelOrder.has(programme.channelId) &&
        programmeStartsInWindow(
          programme,
          window.categoryStartMs,
          window.eveningEndMs,
        ) &&
        !programmeHasEndedAt(programme, nowMs),
    )
    .sort(
      (left, right) =>
        Date.parse(left.startAt) - Date.parse(right.startAt) ||
        (channelOrder.get(left.channelId) ?? Number.MAX_SAFE_INTEGER) -
          (channelOrder.get(right.channelId) ?? Number.MAX_SAFE_INTEGER) ||
        left.id.localeCompare(right.id),
    );
}

function withDevelopmentClassifications(
  data: TonightRuntimeData,
  overrides: readonly ProgrammeClassification[],
): TonightRuntimeData {
  if (overrides.length === 0) return data;
  const overriddenIds = new Set(
    overrides.map((classification) => classification.programmeId),
  );
  return {
    ...data,
    classifications: [
      ...data.classifications.filter(
        (classification) => !overriddenIds.has(classification.programmeId),
      ),
      ...overrides,
    ],
  };
}

function withDevelopmentKijktip(
  data: TonightRuntimeData,
  programme: Programme,
): TonightRuntimeData {
  if (
    data.editorialSignals.some(
      (signal) =>
        signal.type === 'kijktip' && signal.programmeId === programme.id,
    )
  ) {
    return data;
  }

  const signal: ProgrammeEditorialSignal = {
    programmeId: programme.id,
    type: 'kijktip',
    source: 'tvgids',
    sourceItemId: `dev-fixture-${programme.id}`,
    matchedBy: 'source-id',
  };
  return {
    ...data,
    editorialSignals: [...data.editorialSignals, signal],
  };
}

function developmentRuntimeData(
  scenario: TonightDevelopmentScenario,
  data: TonightRuntimeData | null,
  nowMs: number,
): TonightRuntimeData | null {
  if (!data) return data;

  if (scenario === 'kijktip-fallback') {
    if (data.editorialSignals.some((signal) => signal.type === 'kijktip')) {
      return data;
    }
    const existingIds = new Set(
      data.editorialSignals.map((signal) => signal.programmeId),
    );
    const window = tonightWindow(nowMs);
    const candidate = data.schedule.programmes.find(
      (programme) =>
        programmeStartsInWindow(
          programme,
          window.eveningStartMs,
          window.eveningEndMs,
        ) &&
        !programmeHasEndedAt(programme, nowMs) &&
        !existingIds.has(programme.id),
    );
    return candidate ? withDevelopmentKijktip(data, candidate) : data;
  }

  if (scenario === 'series-density') {
    const candidates = developmentCategoryCandidates(data, nowMs).slice(0, 12);
    return withDevelopmentClassifications(
      data,
      candidates.map((programme) =>
        developmentClassification(programme.id, 'series'),
      ),
    );
  }

  if (scenario === 'discovery-mix') {
    const candidates = developmentCategoryCandidates(data, nowMs);
    const film = candidates[0];
    const series = candidates[1];
    const sport = candidates[2];
    if (!film || !series || !sport) return data;

    const classified = withDevelopmentClassifications(data, [
      developmentClassification(film.id, 'film'),
      developmentClassification(series.id, 'series'),
      developmentClassification(sport.id, 'sport'),
    ]);
    return withDevelopmentKijktip(classified, film);
  }

  return data;
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
  const data = developmentRuntimeData(scenario, originalData, nowMs);

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
  if (
    scenario === 'series-density' &&
    model.series.length > 0 &&
    model.series.length < 12
  ) {
    return {
      ...model,
      series: Array.from(
        { length: 12 },
        (_, index) => model.series[index % model.series.length]!,
      ),
    };
  }
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
