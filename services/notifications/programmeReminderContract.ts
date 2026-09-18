import type { Channel, Programme } from '@/data/domain/epg';
import type { ProgrammeReminderRecord } from '@/features/guide/programmePersonalState';

export const PROGRAMME_REMINDER_LEAD_MS = 5 * 60 * 1000;
export const PROGRAMME_REMINDER_IMMEDIATE_DELAY_MS = 1000;

export type ProgrammeReminderNow = () => number;

export type ProgrammeReminderReconciliationResult =
  | { status: 'verified-valid' }
  | { status: 'verified-invalid' }
  | {
      status: 'indeterminate';
      reason: 'native-query-failed' | 'cancellation-unconfirmed';
      presentActive: boolean;
    };

export type ProgrammeReminderScheduleResult =
  | {
      ok: true;
      notificationId: string;
      fireAtMs: number;
    }
  | {
      ok: false;
      reason: 'started' | 'permission' | 'unsupported' | 'schedule';
    };

export function programmeReminderFireAtMs(
  programmeStartAt: string,
  nowMs: number,
): number | null {
  const startMs = Date.parse(programmeStartAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(nowMs) || startMs <= nowMs) return null;
  const preferred = startMs - PROGRAMME_REMINDER_LEAD_MS;
  return preferred > nowMs ? preferred : nowMs + PROGRAMME_REMINDER_IMMEDIATE_DELAY_MS;
}

export type ProgrammeReminderService = {
  scheduleProgrammeReminder: (
    programme: Programme,
    channel: Channel,
    now?: ProgrammeReminderNow,
  ) => Promise<ProgrammeReminderScheduleResult>;
  cancelProgrammeReminder: (notificationId: string) => Promise<boolean>;
  reconcileProgrammeReminder: (
    record: ProgrammeReminderRecord,
    programme: Programme,
    now?: ProgrammeReminderNow,
  ) => Promise<ProgrammeReminderReconciliationResult>;
};
