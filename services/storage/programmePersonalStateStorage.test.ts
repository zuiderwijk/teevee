import { beforeEach, describe, expect, it } from 'vitest';

import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  withProgrammeSaved,
} from '@/features/guide/programmePersonalState';

import {
  readProgrammePersonalState,
  writeProgrammePersonalState,
} from './programmePersonalStateStorage';

const programme = {
  id: 'programme-storage',
  channelId: 'npo1',
  startAt: '2026-09-18T18:00:00Z',
  endAt: '2026-09-18T19:00:00Z',
  title: 'Opslagtest',
};

describe('programme personal state storage boundary', () => {
  beforeEach(() => {
    writeProgrammePersonalState(EMPTY_PROGRAMME_PERSONAL_STATE);
  });

  it('round-trips local programme state', () => {
    const next = withProgrammeSaved(
      EMPTY_PROGRAMME_PERSONAL_STATE,
      programme,
      true,
    );
    expect(writeProgrammePersonalState(next)).toBe(true);
    expect(readProgrammePersonalState()).toEqual(next);
  });
});
