import { describe, expect, it } from 'vitest';

import {
  canonicalGuideSearchQuery,
  guideSearchChannelManagementIntent,
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

  it('normalises only the bounded canonical channel aliases', () => {
    expect(canonicalGuideSearchQuery('RTL8')).toBe('RTL 8');
    expect(canonicalGuideSearchQuery('RTL7')).toBe('RTL 7');
    expect(canonicalGuideSearchQuery('RTLZ')).toBe('RTL Z');
    expect(canonicalGuideSearchQuery('NPO1')).toBe('NPO 1');
    expect(canonicalGuideSearchQuery('ESPN1')).toBe('ESPN');
    expect(canonicalGuideSearchQuery('VRT1')).toBe('VRT 1');
    expect(canonicalGuideSearchQuery('BBCNL')).toBe('BBC NL');
    expect(canonicalGuideSearchQuery('BBC.NL')).toBe('BBC NL');
    expect(canonicalGuideSearchQuery('FOX')).toBe('STAR Channel');
    expect(canonicalGuideSearchQuery('BBC First')).toBe('BBC NL');
    expect(canonicalGuideSearchQuery('Play4')).toBe('Play');
    expect(canonicalGuideSearchQuery('Play 5')).toBe('Play Fictie');
    expect(canonicalGuideSearchQuery('Play6')).toBe('Play Actie');
    expect(canonicalGuideSearchQuery('Play 7')).toBe('Play Reality');
    expect(canonicalGuideSearchQuery('ZiggoSport1')).toBe('Ziggo Sport');
    expect(canonicalGuideSearchQuery('Ziggo Sport 1')).toBe('Ziggo Sport');
    expect(canonicalGuideSearchQuery('NPO 2')).toBe('NPO 2');
  });

  it('resolves only the approved channel-management navigation intents', () => {
    for (const query of [
      'zenders',
      'alle zenders',
      'zenderoverzicht',
      'mijn zenders',
      'zenders instellen',
      'zenders toevoegen',
      'zendervolgorde',
    ]) {
      expect(guideSearchChannelManagementIntent(query)).toBe('manage-channels');
    }
    expect(guideSearchChannelManagementIntent('zender')).toBeNull();
    expect(guideSearchChannelManagementIntent('mijn favoriete zenders')).toBeNull();
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
