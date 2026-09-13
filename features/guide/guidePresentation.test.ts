import { describe, expect, it } from 'vitest';

import {
  DEFAULT_GUIDE_PRESENTATION,
  GUIDE_PRESENTATIONS,
  isGuidePresentation,
} from './guidePresentation';

describe('Guide presentation contract', () => {
  it('keeps the three accepted Guide presentations in one canonical order', () => {
    expect(GUIDE_PRESENTATIONS.map((presentation) => presentation.id)).toEqual([
      'total',
      'per-channel',
      'now-next',
    ]);
  });

  it('defaults to Totaal', () => {
    expect(DEFAULT_GUIDE_PRESENTATION).toBe('total');
  });

  it('recognises only supported presentation ids', () => {
    expect(isGuidePresentation('total')).toBe(true);
    expect(isGuidePresentation('per-channel')).toBe(true);
    expect(isGuidePresentation('now-next')).toBe(true);
    expect(isGuidePresentation('tonight')).toBe(false);
    expect(isGuidePresentation(null)).toBe(false);
  });
});
