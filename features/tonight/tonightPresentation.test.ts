import { describe, expect, it } from 'vitest';

import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';
import type { Channel, GuideSchedule, Programme } from '@/data/domain/epg';
import type { ProgrammeClassification } from '@/data/domain/programmeClassification';
import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  programmeSnapshot,
  type ProgrammePersonalState,
} from '@/features/guide/programmePersonalState';

import {
  buildTonightViewModel,
  tonightCardMetrics,
  tonightSavedAccessibilityLabel,
} from './tonightPresentation';

const channelNames = [
  'NPO 1',
  'NPO 2',
  'NPO 3',
  'RTL 4',
  'RTL 5',
  'SBS6',
  'RTL 7',
  'RTL 8',
  'Net5',
  'Veronica / Disney XD',
  'SBS9',
  'RTL Z',
] as const;

function channels(): Channel[] {
  return channelNames.map((displayName, index) => ({
    id: `channel-${index + 1}`,
    name: displayName,
    displayName,
    shortName: displayName,
    sortOrder: index,
    isActive: true,
  }));
}

function classification(
  programmeId: string,
  patch: Partial<ProgrammeClassification>,
): ProgrammeClassification {
  return {
    programmeId,
    contentType: 'other',
    seriesType: 'unknown',
    audience: 'unknown',
    sportType: 'unknown',
    liveStatus: 'unknown',
    repeatStatus: 'unknown',
    confidence: 'high',
    ...patch,
  };
}

function realisticEvening(): {
  schedule: GuideSchedule;
  classifications: ProgrammeClassification[];
  editorialSignals: ProgrammeEditorialSignal[];
} {
  const canonicalChannels = channels();
  const programmes: Programme[] = [];
  const classifications: ProgrammeClassification[] = [];
  const editorialSignals: ProgrammeEditorialSignal[] = [];
  const startMs = Date.parse('2026-09-23T19:00:00+02:00');

  canonicalChannels.forEach((channel, channelIndex) => {
    for (let slot = 0; slot < 10; slot += 1) {
      const id = `${channel.id}-${slot}`;
      const programme: Programme = {
        id,
        channelId: channel.id,
        startAt: new Date(startMs + slot * 40 * 60_000).toISOString(),
        endAt: new Date(startMs + (slot + 1) * 40 * 60_000).toISOString(),
        title: slot === 1 ? 'Gedeelde serietitel' : `Programma ${channelIndex + 1}-${slot}`,
      };
      programmes.push(programme);

      if (slot === 0) {
        classifications.push(
          classification(id, { contentType: 'film' }),
        );
      } else if (slot === 1) {
        classifications.push(
          classification(id, {
            contentType: 'series',
            seriesType: 'scripted-episodic',
            audience: 'general-mainstream',
          }),
        );
      } else if (slot === 2) {
        classifications.push(
          classification(id, {
            contentType: 'series',
            seriesType: 'scripted-episodic',
            audience: 'primarily-children',
          }),
        );
      } else if (slot === 3) {
        classifications.push(
          classification(id, {
            contentType: 'sport',
            sportType: 'event',
          }),
        );
      } else if (slot === 4) {
        classifications.push(
          classification(id, {
            contentType: 'sport',
            sportType: 'highlights',
          }),
        );
      } else if (slot === 5) {
        classifications.push(
          classification(id, {
            contentType: 'sport',
            sportType: 'talk',
          }),
        );
      } else if (slot === 6) {
        classifications.push(
          classification(id, {
            contentType: 'unknown',
            confidence: 'unknown',
          }),
        );
      } else if (slot === 7) {
        classifications.push(
          classification(id, {
            contentType: 'sport',
            sportType: 'magazine-documentary',
          }),
        );
      } else {
        classifications.push(classification(id, {}));
      }

      if (slot === 7 && channelIndex % 3 === 0) {
        editorialSignals.push({
          programmeId: id,
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: `tip-${channelIndex}`,
          matchedBy: 'channel-title-start',
        });
      }
    }
  });

  return {
    schedule: {
      generatedAt: '2026-09-23T12:00:00.000Z',
      timezone: 'Europe/Amsterdam',
      channels: canonicalChannels,
      programmes,
    },
    classifications,
    editorialSignals,
  };
}

describe('Tonight presentation selection', () => {
  it('handles realistic 12-channel / 120-broadcast density without ranking or title dedupe', () => {
    const fixture = realisticEvening();
    expect(fixture.schedule.channels).toHaveLength(12);
    expect(fixture.schedule.programmes.length).toBeGreaterThanOrEqual(100);

    const model = buildTonightViewModel({
      ...fixture,
      personalState: EMPTY_PROGRAMME_PERSONAL_STATE,
      nowMs: Date.parse('2026-09-23T18:30:00+02:00'),
    });

    expect(model.films).toHaveLength(12);
    expect(model.series).toHaveLength(12);
    expect(model.series.every(({ programme }) => programme.title === 'Gedeelde serietitel')).toBe(true);
    expect(model.sport).toHaveLength(24);
    expect(model.kijktips).toHaveLength(4);
    expect(model.kijktips.map(({ programme }) => programme.id)).toEqual([
      'channel-1-7',
      'channel-4-7',
      'channel-7-7',
      'channel-10-7',
    ]);
    expect(model.series.map(({ programme }) => programme.id)).toHaveLength(12);
  });

  it('applies the exact Kijktip 18:00 start window and removes ended tips', () => {
    const channel = channels()[0]!;
    const before: Programme = {
      id: 'tip-before',
      channelId: channel.id,
      startAt: '2026-09-23T17:59:00+02:00',
      endAt: '2026-09-23T19:10:00+02:00',
      title: 'Voor het venster',
    };
    const atStart: Programme = {
      id: 'tip-at-start',
      channelId: channel.id,
      startAt: '2026-09-23T18:00:00+02:00',
      endAt: '2026-09-23T19:30:00+02:00',
      title: 'Op de grens',
    };
    const ended: Programme = {
      id: 'tip-ended',
      channelId: channel.id,
      startAt: '2026-09-23T18:30:00+02:00',
      endAt: '2026-09-23T19:00:00+02:00',
      title: 'Afgelopen tip',
    };
    const signals: ProgrammeEditorialSignal[] = [before, atStart, ended].map(
      (programme) => ({
        programmeId: programme.id,
        type: 'kijktip',
        source: 'tvgids',
        sourceItemId: programme.id,
        matchedBy: 'source-id',
      }),
    );
    const model = buildTonightViewModel({
      schedule: {
        generatedAt: '2026-09-23T12:00:00.000Z',
        timezone: 'Europe/Amsterdam',
        channels: [channel],
        programmes: [before, atStart, ended],
      },
      editorialSignals: signals,
      classifications: [],
      personalState: EMPTY_PROGRAMME_PERSONAL_STATE,
      nowMs: Date.parse('2026-09-23T19:00:00+02:00'),
    });

    expect(model.kijktips.map(({ programme }) => programme.id)).toEqual([
      'tip-at-start',
    ]);
  });

  it('fails closed for children Series, talk/unknown Sport and missing classifications', () => {
    const fixture = realisticEvening();
    const missingId = fixture.schedule.programmes.find(
      (item) => item.id === 'channel-1-0',
    )!.id;
    const classifications = fixture.classifications.filter(
      ({ programmeId }) => programmeId !== missingId,
    );
    const model = buildTonightViewModel({
      schedule: fixture.schedule,
      editorialSignals: fixture.editorialSignals,
      classifications,
      personalState: EMPTY_PROGRAMME_PERSONAL_STATE,
      nowMs: Date.parse('2026-09-23T18:30:00+02:00'),
    });

    expect(model.series.some(({ programme }) => programme.id.endsWith('-2'))).toBe(false);
    expect(model.sport.some(({ programme }) => programme.id.endsWith('-5'))).toBe(false);
    expect(model.sport.some(({ programme }) => programme.id.endsWith('-6'))).toBe(false);
    expect(model.sport.some(({ programme }) => programme.id.endsWith('-7'))).toBe(false);
    expect(model.films.some(({ programme }) => programme.id === missingId)).toBe(false);
  });

  it('removes ended discovery items while Jouw gids retains ended, overlap and unresolved snapshots', () => {
    const canonicalChannels = channels();
    const ended: Programme = {
      id: 'ended',
      channelId: canonicalChannels[0]!.id,
      startAt: '2026-09-23T18:00:00+02:00',
      endAt: '2026-09-23T19:00:00+02:00',
      title: 'Afgelopen bewaard',
    };
    const overlap: Programme = {
      id: 'overlap',
      channelId: canonicalChannels[1]!.id,
      startAt: '2026-09-23T18:30:00+02:00',
      endAt: '2026-09-23T20:30:00+02:00',
      title: 'Overlap',
    };
    const sameTitle: Programme = {
      id: 'same-title',
      channelId: canonicalChannels[2]!.id,
      startAt: '2026-09-23T18:30:00+02:00',
      endAt: '2026-09-23T21:00:00+02:00',
      title: 'Overlap',
    };
    const stale = {
      programmeId: 'stale',
      channelId: 'missing-channel',
      startAt: '2026-09-23T20:00:00+02:00',
      endAt: '2026-09-23T21:00:00+02:00',
      title: 'Lokale snapshot',
    };
    const personalState: ProgrammePersonalState = {
      version: 2,
      hasUsedSave: true,
      saved: {
        ended: programmeSnapshot(ended),
        overlap: programmeSnapshot(overlap),
        'same-title': programmeSnapshot(sameTitle),
        stale,
      },
      reminders: {},
    };
    const schedule: GuideSchedule = {
      generatedAt: '2026-09-23T12:00:00.000Z',
      timezone: 'Europe/Amsterdam',
      channels: canonicalChannels,
      programmes: [ended, overlap, sameTitle],
    };

    const model = buildTonightViewModel({
      schedule,
      editorialSignals: [
        {
          programmeId: ended.id,
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: 'ended-tip',
          matchedBy: 'channel-title-start',
        },
      ],
      classifications: [classification(ended.id, { contentType: 'film' })],
      personalState,
      nowMs: Date.parse('2026-09-23T20:00:00+02:00'),
    });

    expect(model.kijktips).toEqual([]);
    expect(model.films).toEqual([]);
    expect(model.saved.map(({ snapshot }) => snapshot.programmeId)).toEqual([
      'ended',
      'overlap',
      'same-title',
      'stale',
    ]);
    expect(model.saved[0]!.temporalState).toBe('ended');
    expect(model.saved[1]!.temporalState).toBe('current');
    expect(model.saved[2]!.temporalState).toBe('current');
    expect(model.saved[3]!.programme).toBeNull();
    expect(tonightSavedAccessibilityLabel(model.saved[3]!)).toContain(
      'Details tijdelijk niet beschikbaar',
    );
  });

  it('uses exact resolved canonical programme data over the local snapshot without title-only reconciliation', () => {
    const channel = channels()[0]!;
    const canonical: Programme = {
      id: 'resolved',
      channelId: channel.id,
      startAt: '2026-09-23T20:00:00+02:00',
      endAt: '2026-09-23T21:30:00+02:00',
      title: 'Gecorrigeerde titel',
    };
    const state: ProgrammePersonalState = {
      version: 2,
      hasUsedSave: true,
      saved: {
        resolved: {
          ...programmeSnapshot(canonical),
          title: 'Oude lokale titel',
          endAt: '2026-09-23T21:00:00+02:00',
        },
      },
      reminders: {},
    };
    const model = buildTonightViewModel({
      schedule: {
        generatedAt: '2026-09-23T12:00:00.000Z',
        timezone: 'Europe/Amsterdam',
        channels: [channel],
        programmes: [canonical],
      },
      editorialSignals: [],
      classifications: [],
      personalState: state,
      nowMs: Date.parse('2026-09-23T21:15:00+02:00'),
    });

    expect(model.saved[0]!.programme).toBe(canonical);
    expect(model.saved[0]!.temporalState).toBe('current');
    expect(tonightSavedAccessibilityLabel(model.saved[0]!)).toContain(
      'Gecorrigeerde titel',
    );
    expect(tonightSavedAccessibilityLabel(model.saved[0]!)).toContain(
      '21:30',
    );
  });

  it('keeps frozen no-artwork media geometry and expands cards at Larger Text', () => {
    expect(
      tonightCardMetrics({ kind: 'kijktip', contentWidth: 350, fontScale: 1 }),
    ).toEqual({ width: 168, mediaHeight: 94.5 });
    expect(
      tonightCardMetrics({ kind: 'film', contentWidth: 350, fontScale: 1 }),
    ).toEqual({ width: 108, mediaHeight: 162 });
    expect(
      tonightCardMetrics({ kind: 'series', contentWidth: 350, fontScale: 1 }),
    ).toEqual({ width: 96, mediaHeight: 144 });
    expect(
      tonightCardMetrics({ kind: 'sport', contentWidth: 350, fontScale: 1 }),
    ).toEqual({ width: 220, mediaHeight: 112 });

    expect(
      tonightCardMetrics({ kind: 'series', contentWidth: 350, fontScale: 1.5 }).width,
    ).toBe(132);
    expect(
      tonightCardMetrics({ kind: 'film', contentWidth: 350, fontScale: 1.8 }).width,
    ).toBeGreaterThan(142);
  });
});
