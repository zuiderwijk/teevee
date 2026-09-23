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
  it('persists saved state and durable save usage in the existing provider-independent record', () => {
    const saved = withProgrammeSaved(
      EMPTY_PROGRAMME_PERSONAL_STATE,
      programme,
      true,
    );
    expect(saved.saved[programme.id]).toEqual(programmeSnapshot(programme));
    expect(saved.hasUsedSave).toBe(true);

    const removed = withProgrammeSaved(saved, programme, false);
    expect(removed.saved).toEqual({});
    expect(removed.hasUsedSave).toBe(true);

    const restored = parseSerializedProgrammePersonalState(
      serializeProgrammePersonalState(removed),
    );
    expect(restored).toEqual(removed);
  });

  it('migrates v1 conservatively while preserving valid saves and reminders', () => {
    const reminder = {
      ...programmeSnapshot(programme),
      notificationId: 'notification-1',
      fireAtMs: Date.parse(programme.startAt) - 5 * 60 * 1000,
      programmeStartAt: programme.startAt,
    };

    expect(
      parseSerializedProgrammePersonalState(
        JSON.stringify({
          version: 1,
          saved: { [programme.id]: programmeSnapshot(programme) },
          reminders: { [programme.id]: reminder },
        }),
      ),
    ).toEqual({
      version: 2,
      hasUsedSave: true,
      saved: { [programme.id]: programmeSnapshot(programme) },
      reminders: { [programme.id]: reminder },
    });

    expect(
      parseSerializedProgrammePersonalState(
        JSON.stringify({ version: 1, saved: {}, reminders: {} }),
      ),
    ).toEqual(EMPTY_PROGRAMME_PERSONAL_STATE);
  });

  it('persists and removes reminder records without changing save-history state', () => {
    const reminder = {
      ...programmeSnapshot(programme),
      notificationId: 'notification-1',
      fireAtMs: Date.parse(programme.startAt) - 5 * 60 * 1000,
      programmeStartAt: programme.startAt,
    };
    const previouslyUsed = { ...EMPTY_PROGRAMME_PERSONAL_STATE, hasUsedSave: true };
    const withReminder = withProgrammeReminder(
      previouslyUsed,
      programme,
      reminder,
    );
    expect(withReminder.reminders[programme.id]).toEqual(reminder);
    expect(withReminder.hasUsedSave).toBe(true);
    expect(
      withProgrammeReminder(withReminder, programme, null).reminders,
    ).toEqual({});
  });

  it('fails safely for corrupt, unknown, mismatched or invalid-time records', () => {
    expect(parseSerializedProgrammePersonalState('{')).toEqual(
      EMPTY_PROGRAMME_PERSONAL_STATE,
    );
    expect(
      parseSerializedProgrammePersonalState(
        JSON.stringify({
          version: 99,
          saved: {},
          reminders: {},
        }),
      ),
    ).toEqual(EMPTY_PROGRAMME_PERSONAL_STATE);
    expect(
      parseSerializedProgrammePersonalState(
        JSON.stringify({
          version: 2,
          hasUsedSave: false,
          saved: {
            wrong: { ...programmeSnapshot(programme), programmeId: programme.id },
            badTime: {
              ...programmeSnapshot(programme),
              programmeId: 'badTime',
              startAt: 'not-a-date',
            },
          },
          reminders: {},
        }),
      ),
    ).toEqual(EMPTY_PROGRAMME_PERSONAL_STATE);
  });
});
