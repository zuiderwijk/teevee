import { describe, expect, it } from 'vitest';

import type { Channel, GuideSchedule, Programme } from '@/data/domain/epg';
import type { ProgrammeClassification } from '@/data/domain/programmeClassification';
import { EMPTY_PROGRAMME_PERSONAL_STATE } from '@/features/guide/programmePersonalState';

import {
  applyTonightDevelopmentModuleState,
  resolveTonightDevelopmentState,
} from './tonightDevelopmentState';
import {
  buildTonightViewModel,
  tonightCardMetrics,
} from './tonightPresentation';
import type { TonightRuntimeSnapshot } from './tonightRuntime';

const channels: Channel[] = [
  {
    id: 'dev-channel-1',
    name: 'NPO 1',
    displayName: 'NPO 1',
    shortName: 'NPO 1',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'dev-channel-2',
    name: 'RTL 4',
    displayName: 'RTL 4',
    shortName: 'RTL 4',
    sortOrder: 2,
    isActive: true,
  },
];

const programmes: Programme[] = Array.from({ length: 6 }, (_, index) => {
  const startMs =
    Date.parse('2026-09-23T19:00:00+02:00') + index * 30 * 60_000;
  return {
    id: `dev-programme-${index + 1}`,
    channelId: channels[index % channels.length]!.id,
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(startMs + 50 * 60_000).toISOString(),
    title: `Concrete development broadcast ${index + 1}`,
  };
});

const schedule: GuideSchedule = {
  generatedAt: '2026-09-23T16:30:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels,
  programmes,
};

function runtime(
  classifications: ProgrammeClassification[] = [],
): TonightRuntimeSnapshot {
  return {
    phase: 'ready',
    televisionDayStartMs: Date.parse('2026-09-23T06:00:00+02:00'),
    data: {
      televisionDayStartMs: Date.parse('2026-09-23T06:00:00+02:00'),
      schedule,
      editorialSignals: [],
      classifications,
    },
  };
}

function existingSeries(programmeId: string): ProgrammeClassification {
  return {
    programmeId,
    contentType: 'series',
    seriesType: 'scripted-episodic',
    audience: 'general-mainstream',
    sportType: 'unknown',
    liveStatus: 'unknown',
    repeatStatus: 'unknown',
    confidence: 'high',
  };
}

function developmentModel(
  scenario: 'series-density' | 'discovery-mix',
  sourceRuntime: TonightRuntimeSnapshot,
) {
  const resolved = resolveTonightDevelopmentState({
    scenario,
    liveNowMs: Date.parse('2026-09-23T20:30:00+02:00'),
    runtime: sourceRuntime,
    personalState: EMPTY_PROGRAMME_PERSONAL_STATE,
  });
  const base = buildTonightViewModel({
    schedule: resolved.runtime.data?.schedule ?? null,
    editorialSignals: resolved.runtime.data?.editorialSignals ?? [],
    classifications: resolved.runtime.data?.classifications ?? [],
    personalState: resolved.personalState,
    nowMs: resolved.nowMs,
  });
  return {
    resolved,
    model: applyTonightDevelopmentModuleState(scenario, base),
  };
}

describe('Tonight development-only physical acceptance states', () => {
  it('builds Series >=12 from concrete broadcasts even when production has zero Series', () => {
    const sourceRuntime = runtime();
    const { resolved, model } = developmentModel(
      'series-density',
      sourceRuntime,
    );
    const concreteIds = new Set(schedule.programmes.map(({ id }) => id));

    expect(model.series.length).toBeGreaterThanOrEqual(12);
    expect(
      model.series.every(({ programme }) => concreteIds.has(programme.id)),
    ).toBe(true);
    expect(new Set(model.series.map(({ programme }) => programme.id)).size).toBe(
      programmes.length,
    );
    expect(
      tonightCardMetrics({ kind: 'series', contentWidth: 350, fontScale: 1 }),
    ).toEqual({ width: 96, mediaHeight: 144 });

    expect(sourceRuntime.data?.classifications).toEqual([]);
    expect(sourceRuntime.data?.editorialSignals).toEqual([]);
    expect(resolved.runtime).not.toBe(sourceRuntime);
  });

  it('keeps Series >=12 deterministic when production already contains Series', () => {
    const sourceRuntime = runtime([existingSeries(programmes[0]!.id)]);
    const first = developmentModel('series-density', sourceRuntime).model;
    const second = developmentModel('series-density', sourceRuntime).model;

    expect(first.series.length).toBeGreaterThanOrEqual(12);
    expect(second.series.map(({ programme }) => programme.id)).toEqual(
      first.series.map(({ programme }) => programme.id),
    );
    expect(sourceRuntime.data?.classifications).toEqual([
      existingSeries(programmes[0]!.id),
    ]);
  });

  it('guarantees a concrete Kijktip, Film, Series and Sport in Discovery mix', () => {
    const sourceRuntime = runtime();
    const { model } = developmentModel('discovery-mix', sourceRuntime);
    const concreteIds = new Set(schedule.programmes.map(({ id }) => id));

    expect(model.kijktips.length).toBeGreaterThanOrEqual(1);
    expect(model.films.length).toBeGreaterThanOrEqual(1);
    expect(model.series.length).toBeGreaterThanOrEqual(1);
    expect(model.sport.length).toBeGreaterThanOrEqual(1);

    for (const items of [
      model.kijktips,
      model.films,
      model.series,
      model.sport,
    ]) {
      expect(
        items.every(({ programme }) => concreteIds.has(programme.id)),
      ).toBe(true);
    }

    expect(sourceRuntime.data?.classifications).toEqual([]);
    expect(sourceRuntime.data?.editorialSignals).toEqual([]);
  });

  it('leaves Live untouched and preserves explicit omission controls', () => {
    const sourceRuntime = runtime();
    const live = resolveTonightDevelopmentState({
      scenario: 'live',
      liveNowMs: Date.parse('2026-09-23T20:30:00+02:00'),
      runtime: sourceRuntime,
      personalState: EMPTY_PROGRAMME_PERSONAL_STATE,
    });
    expect(live.runtime).toBe(sourceRuntime);

    const discovery = developmentModel('discovery-mix', sourceRuntime).model;
    const withoutSport = applyTonightDevelopmentModuleState(
      'no-sport',
      discovery,
    );
    expect(withoutSport.sport).toEqual([]);
    expect(withoutSport.films.length).toBeGreaterThan(0);
    expect(withoutSport.series.length).toBeGreaterThan(0);

    const withoutDiscovery = applyTonightDevelopmentModuleState(
      'no-discovery',
      discovery,
    );
    expect(withoutDiscovery.kijktips).toEqual([]);
    expect(withoutDiscovery.films).toEqual([]);
    expect(withoutDiscovery.series).toEqual([]);
    expect(withoutDiscovery.sport).toEqual([]);
  });
});
