import { describe, expect, it } from 'vitest';

import {
  parseGuideSearchApiRequest,
  parseGuideSearchApiResponse,
} from './guideSearchContract';

const channel = {
  id: 'nl-npo-1',
  name: 'NPO 1',
  displayName: 'NPO 1',
  shortName: 'NPO 1',
  sortOrder: 1,
  isActive: true,
};

const programme = {
  id: 'programme-1',
  channelId: 'nl-npo-1',
  startAt: '2026-09-23T18:30:00Z',
  endAt: '2026-09-23T19:30:00Z',
  title: 'De slimste mens',
};

describe('Guide Search API contract', () => {
  it('accepts trimmed searchable queries and rejects too-short/too-long input', () => {
    expect(parseGuideSearchApiRequest({ query: '  De slimste mens  ' })).toEqual({
      query: 'De slimste mens',
    });

    expect(() => parseGuideSearchApiRequest({ query: ' a ' })).toThrow(
      'at least 2 searchable characters',
    );
    expect(() =>
      parseGuideSearchApiRequest({ query: 'a'.repeat(81) }),
    ).toThrow('at most 80 searchable characters');
    expect(() => parseGuideSearchApiRequest({ query: 42 })).toThrow(
      'query must be a string',
    );
  });

  it('canonicalises the bounded channel aliases before hosted Search', () => {
    expect(parseGuideSearchApiRequest({ query: 'RTL8' })).toEqual({
      query: 'RTL 8',
    });
    expect(parseGuideSearchApiRequest({ query: 'BBC.NL' })).toEqual({
      query: 'BBC NL',
    });
    expect(parseGuideSearchApiRequest({ query: 'ESPN1' })).toEqual({
      query: 'ESPN',
    });
  });

  it('parses canonical programme/channel results and optional editorial metadata', () => {
    expect(
      parseGuideSearchApiResponse({
        status: 'ok',
        programmeCoverage: 'complete',
        channelMatches: [channel],
        programmeMatches: [{ programme, channel }],
        editorialSignals: [
          {
            programmeId: 'programme-1',
            type: 'kijktip',
            source: 'tvgids',
            sourceItemId: 'tip-1',
            matchedBy: 'channel-title-start',
          },
        ],
      }),
    ).toEqual({
      status: 'ok',
      programmeCoverage: 'complete',
      channelMatches: [channel],
      programmeMatches: [
        {
          programme: {
            ...programme,
            startAt: '2026-09-23T18:30:00.000Z',
            endAt: '2026-09-23T19:30:00.000Z',
          },
          channel,
        },
      ],
      editorialSignals: [
        {
          programmeId: 'programme-1',
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: 'tip-1',
          matchedBy: 'channel-title-start',
        },
      ],
    });
  });

  it('rejects duplicate or inconsistent canonical result identity', () => {
    expect(() =>
      parseGuideSearchApiResponse({
        status: 'ok',
        programmeCoverage: 'complete',
        channelMatches: [channel, channel],
        programmeMatches: [],
        editorialSignals: [],
      }),
    ).toThrow('duplicate channel matches');

    expect(() =>
      parseGuideSearchApiResponse({
        status: 'ok',
        programmeCoverage: 'complete',
        channelMatches: [],
        programmeMatches: [
          {
            programme,
            channel: { ...channel, id: 'nl-npo-2' },
          },
        ],
        editorialSignals: [],
      }),
    ).toThrow('channel does not match programme');
  });

  it('fails optional editorial enrichment open without weakening canonical results', () => {
    const response = parseGuideSearchApiResponse({
      status: 'ok',
      programmeCoverage: 'partial',
      channelMatches: [],
      programmeMatches: [{ programme, channel }],
      editorialSignals: [
        {
          programmeId: 'programme-outside-results',
          type: 'kijktip',
          source: 'tvgids',
          sourceItemId: 'tip-invalid',
          matchedBy: 'channel-title-start',
        },
      ],
    });

    expect(response).toMatchObject({
      status: 'ok',
      programmeCoverage: 'partial',
      programmeMatches: [{ programme: { id: 'programme-1' } }],
      editorialSignals: [],
    });
  });

  it('preserves explicit hosted unavailability', () => {
    expect(parseGuideSearchApiResponse({ status: 'unavailable' })).toEqual({
      status: 'unavailable',
    });
  });
});
