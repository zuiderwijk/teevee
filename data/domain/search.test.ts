import { describe, expect, it } from 'vitest';

import {
  guideSearchMatchKind,
  guideSearchMatchRank,
  guideSearchPerChannelIntent,
  guideSearchProgrammeDetailIntent,
  normalizeGuideSearchText,
} from './search';

describe('Guide Search lexical semantics', () => {
  it('normalises case, diacritics, whitespace and common punctuation deterministically', () => {
    expect(normalizeGuideSearchText('  Héél   Holland—Bakt!  ')).toBe(
      'heel holland bakt',
    );
    expect(normalizeGuideSearchText("Boer zoekt Vrouw's")).toBe(
      'boer zoekt vrouws',
    );
    expect(normalizeGuideSearchText('A & B')).toBe('a en b');
  });

  it('classifies only exact, prefix and substring matches', () => {
    const query = normalizeGuideSearchText('slimste');

    expect(guideSearchMatchKind('Slimste', query)).toBe('exact');
    expect(guideSearchMatchKind('Slimste mens', query)).toBe('prefix');
    expect(guideSearchMatchKind('De slimste mens', query)).toBe('substring');
    expect(guideSearchMatchKind('De knapste mens', query)).toBeNull();
  });

  it('keeps ranking strength explicit and stable', () => {
    expect(guideSearchMatchRank('exact')).toBeLessThan(
      guideSearchMatchRank('prefix'),
    );
    expect(guideSearchMatchRank('prefix')).toBeLessThan(
      guideSearchMatchRank('substring'),
    );
  });

  it('keeps Search navigation transient and keyed to exact canonical identity', () => {
    const channel = {
      id: 'nl-npo-1',
      name: 'NPO 1',
      displayName: 'NPO 1',
      sortOrder: 1,
      isActive: true,
    };
    const programme = {
      id: 'programme-1',
      channelId: channel.id,
      startAt: '2026-09-23T18:30:00Z',
      endAt: '2026-09-23T19:30:00Z',
      title: 'De slimste mens',
    };

    expect(
      guideSearchProgrammeDetailIntent({ programme, channel }),
    ).toEqual({
      type: 'programme-detail',
      match: { programme, channel },
    });

    expect(
      guideSearchPerChannelIntent(
        channel,
        Date.parse('2026-09-23T18:00:00Z'),
      ),
    ).toEqual({
      type: 'per-channel',
      channelId: 'nl-npo-1',
      referenceAt: '2026-09-23T18:00:00.000Z',
    });

    expect(() => guideSearchPerChannelIntent(channel, Number.NaN)).toThrow(
      'valid reference instant',
    );
  });
});
