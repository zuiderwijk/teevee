import type {
  ProgrammeAudience,
  ProgrammeClassification,
  ProgrammeClassificationConfidence,
  ProgrammeContentType,
  ProgrammeSeriesType,
  ProgrammeSportType,
  ProgrammeTriState,
} from '../../data/domain/programmeClassification.ts';

export const PROGRAMME_CLASSIFICATION_MAX_IDS = 256;

export type ProgrammeClassificationApiRequest = {
  programmeIds: string[];
};

export type ProgrammeClassificationApiResponse =
  | {
      status: 'ok';
      classifications: ProgrammeClassification[];
    }
  | { status: 'unavailable' };

export interface ProgrammeClassificationApi {
  getClassifications(
    request: ProgrammeClassificationApiRequest,
  ): Promise<ProgrammeClassificationApiResponse>;
}

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`Programme classification ${field} is invalid`);
  }
  return value as T;
}

export function parseProgrammeClassification(
  value: unknown,
): ProgrammeClassification {
  const input = record(value);
  if (!input || typeof input.programmeId !== 'string' || !input.programmeId.trim()) {
    throw new Error('Programme classification programmeId must be a non-empty string');
  }

  return {
    programmeId: input.programmeId.trim(),
    contentType: oneOf<ProgrammeContentType>(
      input.contentType,
      ['film', 'series', 'sport', 'other', 'unknown'],
      'contentType',
    ),
    seriesType: oneOf<ProgrammeSeriesType>(
      input.seriesType,
      ['scripted-episodic', 'non-scripted', 'unknown'],
      'seriesType',
    ),
    audience: oneOf<ProgrammeAudience>(
      input.audience,
      ['general-mainstream', 'primarily-children', 'unknown'],
      'audience',
    ),
    sportType: oneOf<ProgrammeSportType>(
      input.sportType,
      ['event', 'highlights', 'talk', 'magazine-documentary', 'other', 'unknown'],
      'sportType',
    ),
    liveStatus: oneOf<ProgrammeTriState>(
      input.liveStatus,
      ['true', 'false', 'unknown'],
      'liveStatus',
    ),
    repeatStatus: oneOf<ProgrammeTriState>(
      input.repeatStatus,
      ['true', 'false', 'unknown'],
      'repeatStatus',
    ),
    confidence: oneOf<ProgrammeClassificationConfidence>(
      input.confidence,
      ['high', 'unknown'],
      'confidence',
    ),
  };
}

export function parseProgrammeClassificationApiRequest(
  value: unknown,
): ProgrammeClassificationApiRequest {
  const input = record(value);
  if (!input || !Array.isArray(input.programmeIds)) {
    throw new Error('Programme classification request programmeIds must be an array');
  }
  if (
    input.programmeIds.length === 0 ||
    input.programmeIds.length > PROGRAMME_CLASSIFICATION_MAX_IDS
  ) {
    throw new Error(
      `Programme classification request must contain 1..${PROGRAMME_CLASSIFICATION_MAX_IDS} programme ids`,
    );
  }

  const programmeIds = [...new Set(input.programmeIds.map((programmeId) => {
    if (typeof programmeId !== 'string' || !programmeId.trim()) {
      throw new Error('Programme classification programmeIds must contain non-empty strings');
    }
    return programmeId.trim();
  }))];

  return { programmeIds };
}

export function parseProgrammeClassificationApiResponse(
  value: unknown,
): ProgrammeClassificationApiResponse {
  const input = record(value);
  if (!input) throw new Error('Programme classification response must be an object');
  if (input.status === 'unavailable') return { status: 'unavailable' };
  if (input.status !== 'ok' || !Array.isArray(input.classifications)) {
    throw new Error('Programme classification response is invalid');
  }

  const classifications = input.classifications.map(parseProgrammeClassification);
  const ids = new Set<string>();
  for (const classification of classifications) {
    if (ids.has(classification.programmeId)) {
      throw new Error('Programme classification response contains duplicate programme ids');
    }
    ids.add(classification.programmeId);
  }
  return { status: 'ok', classifications };
}
