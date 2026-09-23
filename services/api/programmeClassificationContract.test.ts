import { describe, expect, it } from 'vitest';

import {
  parseProgrammeClassificationApiRequest,
  parseProgrammeClassificationApiResponse,
} from './programmeClassificationContract.ts';

const classification = {
  programmeId: 'programme-1',
  contentType: 'series',
  seriesType: 'scripted-episodic',
  audience: 'general-mainstream',
  sportType: 'unknown',
  liveStatus: 'unknown',
  repeatStatus: 'false',
  confidence: 'high',
};

describe('Programme classification API contract', () => {
  it('bounds, trims and deduplicates requested canonical programme ids', () => {
    expect(
      parseProgrammeClassificationApiRequest({
        programmeIds: [' programme-1 ', 'programme-1', 'programme-2'],
      }),
    ).toEqual({ programmeIds: ['programme-1', 'programme-2'] });

    expect(() =>
      parseProgrammeClassificationApiRequest({ programmeIds: [] }),
    ).toThrow('1..128');
    expect(() =>
      parseProgrammeClassificationApiRequest({
        programmeIds: Array.from({ length: 129 }, (_, index) => `p-${index}`),
      }),
    ).toThrow('1..128');
  });

  it('accepts only provider-independent Teevee semantics', () => {
    expect(
      parseProgrammeClassificationApiResponse({
        status: 'ok',
        classifications: [classification],
      }),
    ).toEqual({
      status: 'ok',
      classifications: [classification],
    });

    expect(
      JSON.stringify(
        parseProgrammeClassificationApiResponse({
          status: 'ok',
          classifications: [classification],
        }),
      ),
    ).not.toMatch(/Film|Dramaseries|Kinderen|Voetbal|provider|category/i);
  });

  it('rejects duplicate ids and invalid semantic vocabulary', () => {
    expect(() =>
      parseProgrammeClassificationApiResponse({
        status: 'ok',
        classifications: [classification, classification],
      }),
    ).toThrow('duplicate programme ids');

    expect(() =>
      parseProgrammeClassificationApiResponse({
        status: 'ok',
        classifications: [{ ...classification, contentType: 'movie' }],
      }),
    ).toThrow('contentType is invalid');
  });

  it('preserves explicit hosted unavailability', () => {
    expect(
      parseProgrammeClassificationApiResponse({ status: 'unavailable' }),
    ).toEqual({ status: 'unavailable' });
  });
});
