import { describe, expect, it } from 'vitest';

import type { Programme } from '@/data/domain/epg';

import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  parseSerializedProgrammePersonalState,
  programmeSnapshot,
  serializeProgrammePersonalState,
  withProgrammeReminder,
  withProgrammeSaved,
} from './programmePersonalState';

const programme: Programme = {
  id: 'programme-1',
  channelId: 'npo1',
  startAt: '2026-09-18T18:00:00Z',
  endAt: '2026-09-18T19:00:00Z',
  title: 'Testprogramma',
};

describe('programme personal state', () => {
  it('persists saved state as a provider-independent programme snapshot', () => {
    const saved = withProgrammeSaved(EMPTY_PROGRAMME_PERSONAL_STATE, programme, true);
    expect(saved.saved[programme.id]).toEqual(programmeSnapshot(programme));

    const restored = parseSerializedProgrammePersonalState(
      serializeProgrammePersonalState(saved),
    );
    expect(restored).toEqual(saved);
  });

  it('persists and removes reminder records by canonical programme id', () => {
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
    expect(withReminder.reminders[programme.id]).toEqual(reminder);
    expect(withProgrammeReminder(withReminder, programme, null).reminders).toEqual({});
  });

  it('fails closed for corrupt or mismatched records', () => {
    expect(parseSerializedProgrammePersonalState('{')).toEqual(
      EMPTY_PROGRAMME_PERSONAL_STATE,
    );
    expect(
      parseSerializedProgrammePersonalState(
        JSON.stringify({
          version: 1,
          saved: {
            wrong: { ...programmeSnapshot(programme), programmeId: programme.id },
          },
          reminders: {},
        }),
      ),
    ).toEqual(EMPTY_PROGRAMME_PERSONAL_STATE);
  });
});
