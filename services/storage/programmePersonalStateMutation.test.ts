import { beforeEach, describe, expect, it } from 'vitest';

import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  programmeSnapshot,
  withProgrammeReminder,
  withProgrammeSaved,
} from '@/features/guide/programmePersonalState';

import { removeProgrammeReminderIfMatches } from './programmePersonalStateMutation';
import {
  readProgrammePersonalState,
  writeProgrammePersonalState,
} from './programmePersonalStateStorage';

const programme = {
  id: 'interleaving-programme',
  channelId: 'npo1',
  title: 'Interleaving',
  startAt: '2026-09-18T18:00:00Z',
  endAt: '2026-09-18T19:00:00Z',
};

beforeEach(() => {
  writeProgrammePersonalState(EMPTY_PROGRAMME_PERSONAL_STATE);
});

describe('programme personal-state compare-and-apply mutations', () => {
  it('preserves a Bewaar mutation committed while reminder cancellation is pending', () => {
    const reminder = {
      ...programmeSnapshot(programme),
      notificationId: 'notification-1',
      fireAtMs: Date.parse(programme.startAt) - 5 * 60 * 1000,
      programmeStartAt: programme.startAt,
    };
    const withReminder = withProgrammeReminder(
      EMPTY_PROGRAMME_PERSONAL_STATE,
      programme,
      reminder,
    );
    writeProgrammePersonalState(withReminder);

    const concurrentSaved = withProgrammeSaved(
      readProgrammePersonalState(),
      programme,
      true,
    );
    writeProgrammePersonalState(concurrentSaved);

    expect(
      removeProgrammeReminderIfMatches(programme, reminder.notificationId),
    ).toMatchObject({ status: 'removed' });

    const finalState = readProgrammePersonalState();
    expect(finalState.saved[programme.id]).toEqual(programmeSnapshot(programme));
    expect(finalState.reminders[programme.id]).toBeUndefined();
  });

  it('does not remove a newer reminder with a different native identifier', () => {
    const newer = {
      ...programmeSnapshot(programme),
      notificationId: 'notification-new',
      fireAtMs: Date.parse(programme.startAt) - 60_000,
      programmeStartAt: programme.startAt,
    };
    writeProgrammePersonalState(
      withProgrammeReminder(
        EMPTY_PROGRAMME_PERSONAL_STATE,
        programme,
        newer,
      ),
    );

    expect(
      removeProgrammeReminderIfMatches(programme, 'notification-old'),
    ).toMatchObject({ status: 'changed' });
    expect(readProgrammePersonalState().reminders[programme.id]).toEqual(newer);
  });
});
