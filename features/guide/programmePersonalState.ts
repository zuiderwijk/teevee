import type { Programme } from '@/data/domain/epg';

export type ProgrammeSnapshot = {
  programmeId: string;
  channelId: string;
  startAt: string;
  endAt: string;
  title: string;
};

export type SavedProgrammeRecord = ProgrammeSnapshot;

export type ProgrammeReminderRecord = ProgrammeSnapshot & {
  notificationId: string;
  fireAtMs: number;
  programmeStartAt: string;
};

export type ProgrammePersonalState = {
  version: 2;
  hasUsedSave: boolean;
  saved: Record<string, SavedProgrammeRecord>;
  reminders: Record<string, ProgrammeReminderRecord>;
};

export const EMPTY_PROGRAMME_PERSONAL_STATE: ProgrammePersonalState = {
  version: 2,
  hasUsedSave: false,
  saved: {},
  reminders: {},
};

function validTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Date.parse(value))
  );
}

function validSnapshot(value: unknown): value is ProgrammeSnapshot {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.programmeId === 'string' &&
    record.programmeId.trim() !== '' &&
    typeof record.channelId === 'string' &&
    record.channelId.trim() !== '' &&
    validTimestamp(record.startAt) &&
    validTimestamp(record.endAt) &&
    Date.parse(record.endAt) > Date.parse(record.startAt) &&
    typeof record.title === 'string' &&
    record.title.trim() !== ''
  );
}

function validReminder(value: unknown): value is ProgrammeReminderRecord {
  if (!validSnapshot(value)) return false;
  const record = value as unknown as Record<string, unknown>;
  return (
    typeof record.notificationId === 'string' &&
    record.notificationId.trim() !== '' &&
    Number.isFinite(record.fireAtMs) &&
    validTimestamp(record.programmeStartAt)
  );
}

export function programmeSnapshot(programme: Programme): ProgrammeSnapshot {
  return {
    programmeId: programme.id,
    channelId: programme.channelId,
    startAt: programme.startAt,
    endAt: programme.endAt,
    title: programme.title,
  };
}

export function parseSerializedProgrammePersonalState(
  raw: string | null,
): ProgrammePersonalState {
  if (!raw) return EMPTY_PROGRAMME_PERSONAL_STATE;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return EMPTY_PROGRAMME_PERSONAL_STATE;
    }
    const source = parsed as Record<string, unknown>;
    if (source.version !== 1 && source.version !== 2) {
      return EMPTY_PROGRAMME_PERSONAL_STATE;
    }

    const saved: Record<string, SavedProgrammeRecord> = {};
    if (
      source.saved &&
      typeof source.saved === 'object' &&
      !Array.isArray(source.saved)
    ) {
      for (const [key, value] of Object.entries(
        source.saved as Record<string, unknown>,
      )) {
        if (validSnapshot(value) && key === value.programmeId) saved[key] = value;
      }
    }

    const reminders: Record<string, ProgrammeReminderRecord> = {};
    if (
      source.reminders &&
      typeof source.reminders === 'object' &&
      !Array.isArray(source.reminders)
    ) {
      for (const [key, value] of Object.entries(
        source.reminders as Record<string, unknown>,
      )) {
        if (validReminder(value) && key === value.programmeId) {
          reminders[key] = value;
        }
      }
    }

    // v1 did not persist save history. A retained saved broadcast proves Bewaar
    // was used; an empty legacy record cannot prove prior usage, so migration
    // deliberately remains false rather than inventing history.
    const hasUsedSave =
      source.version === 1
        ? Object.keys(saved).length > 0
        : source.hasUsedSave === true || Object.keys(saved).length > 0;

    return { version: 2, hasUsedSave, saved, reminders };
  } catch {
    return EMPTY_PROGRAMME_PERSONAL_STATE;
  }
}

export function serializeProgrammePersonalState(
  state: ProgrammePersonalState,
): string {
  return JSON.stringify(state);
}

export function withProgrammeSaved(
  state: ProgrammePersonalState,
  programme: Programme,
  saved: boolean,
): ProgrammePersonalState {
  const nextSaved = { ...state.saved };
  if (saved) nextSaved[programme.id] = programmeSnapshot(programme);
  else delete nextSaved[programme.id];

  return {
    ...state,
    hasUsedSave: state.hasUsedSave || saved,
    saved: nextSaved,
  };
}

export function withProgrammeReminder(
  state: ProgrammePersonalState,
  programme: Programme,
  reminder: ProgrammeReminderRecord | null,
): ProgrammePersonalState {
  const reminders = { ...state.reminders };
  if (reminder) reminders[programme.id] = reminder;
  else delete reminders[programme.id];
  return { ...state, reminders };
}
