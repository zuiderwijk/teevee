import { describe, expect, it } from 'vitest';

import type { GuideSearchProgrammeMatch } from '@/data/domain/search';

import {
  formatGuideSearchDate,
  guideSearchBroadcastContext,
  guideSearchProgrammeAccessibilityLabel,
  guideSearchProgrammeIsCurrent,
} from './searchPresentation';

const channel = {
  id: 'nl-npo-1',
  name: 'NPO 1',
  displayName: 'NPO 1',
  sortOrder: 1,
  isActive: true,
};

function match(
  startAt: string,
  endAt: string,
  title = 'De slimste mens',
): GuideSearchProgrammeMatch {
  return {
    channel,
    programme: {
      id: `programme-${startAt}`,
      channelId: channel.id,
      startAt,
      endAt,
      title,
    },
  };
}

describe('Guide Search result presentation', () => {
  const nowMs = Date.parse('2026-09-23T18:00:00Z');

  it('uses actual Amsterdam calendar date rather than television-day grouping', () => {
    // 02:30 Europe/Amsterdam belongs to the preceding television day, but
    // Search must display the actual civil broadcast date.
    expect(formatGuideSearchDate('2026-09-23T00:30:00Z', nowMs)).toBe('Vandaag');
  });

  it('labels currently airing broadcasts with Nu and useful end time', () => {
    const programme = match(
      '2026-09-23T17:30:00Z',
      '2026-09-23T18:30:00Z',
    ).programme;

    expect(guideSearchProgrammeIsCurrent(programme, nowMs)).toBe(true);
    expect(guideSearchBroadcastContext(programme, nowMs)).toBe('Nu · tot 20:30');
  });

  it('keeps future/recent result context concise and deterministic', () => {
    expect(
      guideSearchBroadcastContext(
        match('2026-09-24T18:30:00Z', '2026-09-24T19:30:00Z').programme,
        nowMs,
      ),
    ).toBe('Morgen · 20:30');

    expect(
      guideSearchBroadcastContext(
        match('2026-09-22T18:30:00Z', '2026-09-22T19:30:00Z').programme,
        nowMs,
      ),
    ).toBe('Gisteren · 20:30');
  });

  it('exposes title, channel, time and Kijktip state to screen readers', () => {
    expect(
      guideSearchProgrammeAccessibilityLabel({
        match: match('2026-09-23T17:30:00Z', '2026-09-23T18:30:00Z'),
        nowMs,
        isKijktip: true,
      }),
    ).toBe('De slimste mens, NPO 1, Nu, tot 20:30, Kijktip');
  });
});
