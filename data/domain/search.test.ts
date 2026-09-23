import { describe, expect, it } from 'vitest';

import {
  guideSearchMatchKind,
  guideSearchMatchRank,
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
});
