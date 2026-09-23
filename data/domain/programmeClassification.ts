import type { Programme } from './epg';

export type ProgrammeContentType = 'film' | 'series' | 'sport' | 'other' | 'unknown';

export type ProgrammeSeriesType =
  | 'scripted-episodic'
  | 'non-scripted'
  | 'unknown';

export type ProgrammeAudience =
  | 'general-mainstream'
  | 'primarily-children'
  | 'unknown';

export type ProgrammeSportType =
  | 'event'
  | 'highlights'
  | 'talk'
  | 'magazine-documentary'
  | 'other'
  | 'unknown';

export type ProgrammeTriState = 'true' | 'false' | 'unknown';

export type ProgrammeClassificationConfidence = 'high' | 'unknown';

/**
 * Provider-independent semantic sibling for one concrete canonical broadcast.
 *
 * Raw provider vocabulary is intentionally absent. A classification may describe
 * a programme as series/sport while still failing closed for a specific Tonight
 * module because audience/subtype/confidence remains unknown.
 */
export type ProgrammeClassification = {
  programmeId: Programme['id'];
  contentType: ProgrammeContentType;
  seriesType: ProgrammeSeriesType;
  audience: ProgrammeAudience;
  sportType: ProgrammeSportType;
  liveStatus: ProgrammeTriState;
  repeatStatus: ProgrammeTriState;
  confidence: ProgrammeClassificationConfidence;
};

export function triStateFromBoolean(value: boolean | undefined): ProgrammeTriState {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return 'unknown';
}

export function isTonightFilmClassification(
  classification: ProgrammeClassification,
): boolean {
  return (
    classification.confidence === 'high' &&
    classification.contentType === 'film'
  );
}

export function isTonightSeriesClassification(
  classification: ProgrammeClassification,
): boolean {
  return (
    classification.confidence === 'high' &&
    classification.contentType === 'series' &&
    classification.seriesType === 'scripted-episodic' &&
    classification.audience === 'general-mainstream'
  );
}

export function isTonightSportClassification(
  classification: ProgrammeClassification,
): boolean {
  return (
    classification.confidence === 'high' &&
    classification.contentType === 'sport' &&
    (classification.sportType === 'event' ||
      classification.sportType === 'highlights')
  );
}
