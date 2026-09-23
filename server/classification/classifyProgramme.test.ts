import { describe, expect, it } from 'vitest';

import {
  isTonightFilmClassification,
  isTonightSeriesClassification,
  isTonightSportClassification,
} from '../../data/domain/programmeClassification.ts';
import type { ExternalProgramme } from '../epg/provider.ts';
import { classifyExternalProgramme } from './classifyProgramme.ts';

function classify(
  programme: Partial<ExternalProgramme>,
  providerKey = 'development-xmltv',
) {
  return classifyExternalProgramme({
    providerKey,
    programmeId: 'programme-fixture',
    programme: {
      channelId: 'raw-channel',
      startAt: '2026-09-23T19:00:00Z',
      endAt: '2026-09-23T20:00:00Z',
      title: 'Fixture',
      ...programme,
    },
  });
}

describe('central provider-independent programme classification', () => {
  it('classifies explicit Film and recovers researched Drama-first feature-film false negatives from the full category set', () => {
    const providerGenre = classify({ genre: 'Film' });
    const explicit = classify({ categories: ['Film'] });
    const researchedFalseNegative = classify({
      title: 'The Martian',
      genre: 'Drama',
      categories: ['Drama', 'Film'],
    });

    expect(providerGenre.contentType).toBe('film');
    expect(explicit.contentType).toBe('film');
    expect(researchedFalseNegative.contentType).toBe('film');
    expect(isTonightFilmClassification(providerGenre)).toBe(true);
    expect(isTonightFilmClassification(explicit)).toBe(true);
    expect(isTonightFilmClassification(researchedFalseNegative)).toBe(true);
  });

  it('fails closed for generic Drama and unknown evidence instead of using a title-specific film exception', () => {
    const filmTitleWithoutFilmEvidence = classify({
      title: 'The Martian',
      genre: 'Drama',
      categories: ['Drama'],
    });
    const unrelatedSameEvidence = classify({
      title: 'Completely different title',
      genre: 'Drama',
      categories: ['Drama'],
    });
    const unknown = classify({ title: 'Unknown', categories: [] });

    expect(filmTitleWithoutFilmEvidence).toMatchObject({
      contentType: 'unknown',
      confidence: 'unknown',
    });
    expect(unrelatedSameEvidence).toEqual({
      ...filmTitleWithoutFilmEvidence,
      programmeId: 'programme-fixture',
    });
    expect(isTonightFilmClassification(unknown)).toBe(false);
  });

  it('classifies explicit and researched generic-category scripted episodic series without title rules', () => {
    const explicit = classify({ categories: ['Dramaseries'] });
    const generic = classify({
      title: 'Best Medicine',
      categories: ['Komedie', 'Medisch'],
      episodeNumbers: [{ value: 'S1 E3' }],
    });
    const mystery = classify({
      title: 'The Spencer Sisters',
      categories: ['Mysterie', 'Komedie'],
      episodeNumbers: [{ value: 'S1 E4' }],
    });
    const crime = classify({
      title: 'Aspe',
      categories: ['Misdaad'],
      episodeNumbers: [{ value: 'S2 E9' }],
      hasDirectorCredit: true,
    });

    for (const classification of [explicit, generic, mystery, crime]) {
      expect(classification).toMatchObject({
        contentType: 'series',
        seriesType: 'scripted-episodic',
        audience: 'general-mainstream',
        confidence: 'high',
      });
      expect(isTonightSeriesClassification(classification)).toBe(true);
    }
  });

  it('keeps broad generic-series blockers ambiguous instead of promoting them to high-confidence other', () => {
    const ambiguousCandidates = [
      classify({
        title: 'Sluipschutters-like fixture',
        categories: ['Komedie', 'Entertainment'],
        episodeNumbers: [{ value: 'S5 E3' }],
      }),
      classify({
        title: 'Automotive comedy fixture',
        categories: ["Auto's", 'Komedie'],
        episodeNumbers: [{ value: 'S15 E1' }],
        hasDirectorCredit: true,
      }),
      classify({
        title: 'Animal medical fixture',
        categories: ['Dieren', 'Medisch'],
        episodeNumbers: [{ value: 'S19 E3' }],
        hasDirectorCredit: true,
      }),
      classify({
        title: 'Crime fixture without enough scripted evidence',
        categories: ['Misdaad'],
        episodeNumbers: [{ value: 'S4 E6' }],
        hasDirectorCredit: false,
      }),
    ];

    for (const classification of ambiguousCandidates) {
      expect(isTonightSeriesClassification(classification)).toBe(false);
      expect(classification).toMatchObject({
        contentType: 'unknown',
        confidence: 'unknown',
      });
    }
  });

  it('maps strong positive non-scripted format evidence to high-confidence other', () => {
    for (const categories of [
      ['Reality'],
      ['Documentaire'],
      ['Nieuws'],
      ['Talkshow'],
    ]) {
      expect(
        classify({
          categories,
          episodeNumbers: [{ value: 'S2 E4' }],
        }),
      ).toMatchObject({
        contentType: 'other',
        seriesType: 'unknown',
        confidence: 'high',
      });
    }
  });

  it('treats strong explicit scripted form as authoritative except when source format evidence conflicts', () => {
    const scriptedWithBroadSubject = classify({
      categories: ['Misdaaddrama', 'Entertainment'],
      episodeNumbers: [{ value: 'S1 E3' }],
    });
    const sitcomWithSubject = classify({
      categories: ['Sitcoms', 'Politiek'],
      episodeNumbers: [{ value: 'S2 E7' }],
    });
    const realityConflict = classify({
      categories: ['Dramaseries', 'Reality'],
      episodeNumbers: [{ value: 'S10 E8' }],
    });
    const documentaryMiniseries = classify({
      categories: ['Miniseries', 'Documentaire'],
      episodeNumbers: [{ value: 'S1 E3' }],
      hasDirectorCredit: true,
    });

    expect(scriptedWithBroadSubject).toMatchObject({
      contentType: 'series',
      seriesType: 'scripted-episodic',
      confidence: 'high',
    });
    expect(sitcomWithSubject).toMatchObject({
      contentType: 'series',
      seriesType: 'scripted-episodic',
      confidence: 'high',
    });
    expect(isTonightSeriesClassification(scriptedWithBroadSubject)).toBe(true);
    expect(isTonightSeriesClassification(sitcomWithSubject)).toBe(true);
    expect(isTonightSeriesClassification(realityConflict)).toBe(false);
    expect(isTonightSeriesClassification(documentaryMiniseries)).toBe(false);
  });

  it('keeps children audience evidence independent from content-type certainty', () => {
    const ambiguous = classify({
      categories: ['Kinderen', 'Komedie'],
      episodeNumbers: [{ value: 'S1 E3' }],
    });
    const news = classify({
      categories: ['Kinderen', 'Nieuws'],
    });

    expect(ambiguous).toMatchObject({
      contentType: 'unknown',
      seriesType: 'unknown',
      audience: 'primarily-children',
      confidence: 'unknown',
    });
    expect(isTonightSeriesClassification(ambiguous)).toBe(false);

    expect(news).toMatchObject({
      contentType: 'other',
      seriesType: 'unknown',
      audience: 'primarily-children',
      confidence: 'high',
    });
    expect(isTonightSeriesClassification(news)).toBe(false);
  });

  it('classifies researched children scripted examples as series but excludes them from Series vanavond', () => {
    for (const title of [
      'Bluey',
      "Marvel's Spidey and His Amazing Friends",
    ]) {
      const classification = classify({
        title,
        categories: ['Kinderen', 'Animatie'],
        episodeNumbers: [{ value: 'S3 E16' }],
      });
      expect(classification).toMatchObject({
        contentType: 'series',
        seriesType: 'scripted-episodic',
        audience: 'primarily-children',
        confidence: 'high',
      });
      expect(isTonightSeriesClassification(classification)).toBe(false);
    }
  });

  it('keeps explicit scripted children as semantic Series unless strong non-scripted form conflicts', () => {
    const scripted = classify({
      categories: ['Kinderen', 'Dramaseries'],
      episodeNumbers: [{ value: 'S2 E4' }],
    });
    const conflict = classify({
      categories: ['Kinderen', 'Dramaseries', 'Reality'],
      episodeNumbers: [{ value: 'S2 E4' }],
    });

    expect(scripted).toMatchObject({
      contentType: 'series',
      seriesType: 'scripted-episodic',
      audience: 'primarily-children',
      confidence: 'high',
    });
    expect(isTonightSeriesClassification(scripted)).toBe(false);

    expect(conflict).toMatchObject({
      contentType: 'other',
      seriesType: 'unknown',
      audience: 'primarily-children',
      confidence: 'high',
    });
    expect(isTonightSeriesClassification(conflict)).toBe(false);
  });

  it('does not turn episode notation alone or non-scripted children programming into a series', () => {
    const reality = classify({
      categories: ['Reality'],
      episodeNumbers: [{ value: 'S2 E4' }],
    });
    const jeugdjournaal = classify({
      title: 'NOS Jeugdjournaal',
      categories: ['Kinderen', 'Nieuws'],
      episodeNumbers: [{ value: 'E266' }],
    });
    const unknownAudience = classify({
      categories: ['Onbekend'],
      episodeNumbers: [{ value: 'S1 E1' }],
    });

    expect(isTonightSeriesClassification(reality)).toBe(false);
    expect(jeugdjournaal).toMatchObject({
      contentType: 'other',
      audience: 'primarily-children',
      confidence: 'high',
    });
    expect(unknownAudience).toMatchObject({
      contentType: 'unknown',
      audience: 'unknown',
      confidence: 'unknown',
    });
  });

  it('distinguishes sport event, highlights, talk and documentary semantics before Tonight eligibility', () => {
    const event = classify({
      categories: ['Sport', 'Voetbal', 'Sports'],
      description: 'Verslag van de wedstrijd Servië - Nederland.',
    });
    const cycling = classify({
      categories: ['Sport', 'Wielrennen', 'Sports'],
      description: 'Verslag van de wegkoers mannen.',
    });
    const highlights = classify({
      categories: ['Sport', 'Interview', 'Sports'],
      description:
        'Livebeelden en/of samenvattingen van de belangrijkste sportwedstrijden en evenementen van de dag.',
    });
    const summary = classify({
      categories: ['Sport', 'Voetbal', 'Sports'],
      description: 'Samenvatting van de wedstrijd.',
    });
    const preMatch = classify({
      categories: ['Sporttalkshow', 'Voetbal'],
      description: 'Voorbeschouwing op de wedstrijd.',
    });
    const postMatch = classify({
      categories: ['Sporttalkshow', 'Voetbal'],
      description: 'Nabeschouwing van de wedstrijd.',
    });
    const generalTalk = classify({
      categories: ['Sporttalkshow'],
      description: 'Gesprek over het belangrijkste sportnieuws van de dag.',
    });
    const documentary = classify({
      categories: ['Sport', 'Documentaire', 'Sports'],
      description: 'Historisch sportverhaal.',
    });

    expect(event.sportType).toBe('event');
    expect(cycling.sportType).toBe('event');
    expect(highlights.sportType).toBe('highlights');
    expect(summary.sportType).toBe('highlights');
    expect(preMatch.sportType).toBe('talk');
    expect(postMatch.sportType).toBe('talk');
    expect(generalTalk.sportType).toBe('talk');
    expect(documentary.sportType).toBe('magazine-documentary');

    expect(isTonightSportClassification(event)).toBe(true);
    expect(isTonightSportClassification(highlights)).toBe(true);
    expect(isTonightSportClassification(preMatch)).toBe(false);
    expect(isTonightSportClassification(generalTalk)).toBe(false);
    expect(isTonightSportClassification(documentary)).toBe(false);
  });

  it('proves generic Sport does not automatically mean event and ambiguous sport fails closed', () => {
    const ambiguous = classify({ categories: ['Sport'] });
    expect(ambiguous).toMatchObject({
      contentType: 'sport',
      sportType: 'unknown',
      confidence: 'unknown',
    });
    expect(isTonightSportClassification(ambiguous)).toBe(false);
  });

  it('preserves true, explicit false and undefined live/repeat values as tri-state semantics', () => {
    expect(classify({ isLive: true, isRepeat: true })).toMatchObject({
      liveStatus: 'true',
      repeatStatus: 'true',
    });
    expect(classify({ isLive: false, isRepeat: false })).toMatchObject({
      liveStatus: 'false',
      repeatStatus: 'false',
    });
    expect(classify({})).toMatchObject({
      liveStatus: 'unknown',
      repeatStatus: 'unknown',
    });
  });

  it('contains no production title-specific research fixture exceptions', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('./classifyProgramme.ts', import.meta.url), 'utf8');

    expect(source).not.toContain('Bluey');
    expect(source).not.toContain("Marvel's Spidey");
    expect(source).not.toContain('The Martian');
    expect(source).not.toContain('The Spencer Sisters');
  });

  it('keeps provider vocabulary behind the provider-classification boundary', () => {
    const classification = classify(
      {
        categories: ['Film'],
        episodeNumbers: [{ value: 'S1 E1' }],
      },
      'future-provider',
    );

    expect(classification).toMatchObject({
      contentType: 'unknown',
      seriesType: 'unknown',
      audience: 'unknown',
      sportType: 'unknown',
    });
    expect(JSON.stringify(classification)).not.toContain('Film');
  });
});
