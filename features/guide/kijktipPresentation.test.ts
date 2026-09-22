import { describe, expect, it } from 'vitest';

import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';

import {
  guideProgrammeAccessibilityLabel,
  kijktipProgrammeIds,
} from './kijktipPresentation';

describe('Kijktip presentation mapping', () => {
  it('derives visible programme identity only from ProgrammeEditorialSignal', () => {
    const signals: ProgrammeEditorialSignal[] = [
      {
        programmeId: 'programme-kijktip',
        type: 'kijktip',
        source: 'tvgids',
        sourceItemId: 'tip-1',
        matchedBy: 'channel-title-start',
      },
    ];

    const ids = kijktipProgrammeIds(signals);

    expect(ids.has('programme-kijktip')).toBe(true);
    expect(ids.has('programme-plain')).toBe(false);
  });

  it('deduplicates repeated signals without mutating programme state', () => {
    const signal: ProgrammeEditorialSignal = {
      programmeId: 'programme-kijktip',
      type: 'kijktip',
      source: 'tvgids',
      sourceItemId: 'tip-1',
      matchedBy: 'channel-title-start',
    };

    expect(kijktipProgrammeIds([signal, { ...signal }])).toEqual(
      new Set(['programme-kijktip']),
    );
  });

  it('announces Kijktip exactly once between title and time', () => {
    expect(
      guideProgrammeAccessibilityLabel({
        channelName: 'NPO 1',
        title: 'Nieuwsuur',
        startLabel: '20:30',
        endLabel: '21:15',
        current: true,
        isKijktip: true,
      }),
    ).toBe('NPO 1, Nieuwsuur, Kijktip, 20:30 tot 21:15, nu bezig');

    expect(
      guideProgrammeAccessibilityLabel({
        channelName: 'NPO 1',
        title: 'Nieuwsuur',
        startLabel: '20:30',
        endLabel: '21:15',
        current: false,
        isKijktip: false,
      }),
    ).toBe('NPO 1, Nieuwsuur, 20:30 tot 21:15');
  });
});
