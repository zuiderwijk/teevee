import { describe, expect, it } from 'vitest';

import type { GuideFixture } from '@/data/domain/epg';

import { formatGuideTime, indexGuideProgrammesByChannel } from './guideRenderData';

describe('Guide render data helpers', () => {
  it('formats Amsterdam wall-clock time consistently in summer and winter', () => {
    expect(formatGuideTime(Date.parse('2026-09-16T18:30:00Z'))).toBe('20:30');
    expect(formatGuideTime(Date.parse('2026-12-16T19:30:00Z'))).toBe('20:30');
  });

  it('indexes programmes once per channel while preserving schedule order', () => {
    const fixture: GuideFixture = {
      generatedAt: '2026-09-16T18:00:00.000Z',
      timezone: 'Europe/Amsterdam',
      channels: [
        { id: 'one', name: 'One', displayName: 'One', sortOrder: 1, isActive: true },
        { id: 'two', name: 'Two', displayName: 'Two', sortOrder: 2, isActive: true },
      ],
      programmes: [
        {
          id: 'one-a',
          channelId: 'one',
          startAt: '2026-09-16T18:00:00.000Z',
          endAt: '2026-09-16T18:30:00.000Z',
          title: 'A',
        },
        {
          id: 'two-a',
          channelId: 'two',
          startAt: '2026-09-16T18:00:00.000Z',
          endAt: '2026-09-16T18:30:00.000Z',
          title: 'B',
        },
        {
          id: 'one-b',
          channelId: 'one',
          startAt: '2026-09-16T18:30:00.000Z',
          endAt: '2026-09-16T19:00:00.000Z',
          title: 'C',
        },
        {
          id: 'unknown',
          channelId: 'missing',
          startAt: '2026-09-16T19:00:00.000Z',
          endAt: '2026-09-16T19:30:00.000Z',
          title: 'Ignored',
        },
      ],
    };

    const indexed = indexGuideProgrammesByChannel(fixture);

    expect(indexed.get('one')?.map((programme) => programme.id)).toEqual(['one-a', 'one-b']);
    expect(indexed.get('two')?.map((programme) => programme.id)).toEqual(['two-a']);
    expect(indexed.has('missing')).toBe(false);
  });
});
