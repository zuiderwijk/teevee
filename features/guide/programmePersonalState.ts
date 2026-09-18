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
  version: 1;
  saved: Record<string, SavedProgrammeRecord>;
  reminders: Record<string, ProgrammeReminderRecord>;
};

export const EMPTY_PROGRAMME_PERSONAL_STATE: ProgrammePersonalState = {
  version: 1,
  saved: {},
  reminders: {},
};

function validSnapshot(value: unknown): value is ProgrammeSnapshot {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.programmeId === 'string' &&
    typeof record.channelId === 'string' &&
    typeof record.startAt === 'string' &&
    typeof record.endAt === 'string' &&
    typeof record.title === 'string'
  );
}

function validReminder(value: unknown): value is ProgrammeReminderRecord {
  if (!validSnapshot(value)) return false;
  const record = value as unknown as Record<string, unknown>;
  return (
    typeof record.notificationId === 'string' &&
    Number.isFinite(record.fireAtMs) &&
    typeof record.programmeStartAt === 'string'
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

export function parseSerializedProgrammePersonalState(raw: string | null): ProgrammePersonalState {
  if (!raw) return EMPTY_PROGRAMME_PERSONAL_STATE;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return EMPTY_PROGRAMME_PERSONAL_STATE;
    const source = parsed as Record<string, unknown>;
    if (source.version !== 1) return EMPTY_PROGRAMME_PERSONAL_STATE;

    const saved: Record<string, SavedProgrammeRecord> = {};
    if (source.saved && typeof source.saved === 'object') {
      for (const [key, value] of Object.entries(source.saved as Record<string, unknown>)) {
        if (validSnapshot(value) && key === value.programmeId) saved[key] = value;
      }
    }

    const reminders: Record<string, ProgrammeReminderRecord> = {};
    if (source.reminders && typeof source.reminders === 'object') {
      for (const [key, value] of Object.entries(source.reminders as Record<string, unknown>)) {
        if (validReminder(value) && key === value.programmeId) reminders[key] = value;
      }
    }

    return { version: 1, saved, reminders };
  } catch {
    return EMPTY_PROGRAMME_PERSONAL_STATE;
  }
}

export function serializeProgrammePersonalState(state: ProgrammePersonalState): string {
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
  return { ...state, saved: nextSaved };
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
