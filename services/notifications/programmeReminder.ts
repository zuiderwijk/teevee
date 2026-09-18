import type { ProgrammeReminderService } from './programmeReminderContract';

export {
  PROGRAMME_REMINDER_IMMEDIATE_DELAY_MS,
  PROGRAMME_REMINDER_LEAD_MS,
  programmeReminderFireAtMs,
  type ProgrammeReminderNow,
  type ProgrammeReminderReconciliationResult,
  type ProgrammeReminderScheduleResult,
  type ProgrammeReminderService,
} from './programmeReminderContract';

export const scheduleProgrammeReminder: ProgrammeReminderService['scheduleProgrammeReminder'] =
  async (programme, _channel, now = Date.now) => {
    if (Date.parse(programme.startAt) <= now()) return { ok: false, reason: 'started' };
    return { ok: false, reason: 'unsupported' };
  };

export const cancelProgrammeReminder: ProgrammeReminderService['cancelProgrammeReminder'] =
  async () => false;

export const reconcileProgrammeReminder: ProgrammeReminderService['reconcileProgrammeReminder'] =
  async (record, programme, now = Date.now) => {
    const nowMs = now();
    const startMs = Date.parse(programme.startAt);
    if (
      !Number.isFinite(startMs) ||
      startMs <= nowMs ||
      record.programmeStartAt !== programme.startAt
    ) {
      return { status: 'verified-invalid' };
    }
    if (record.fireAtMs <= nowMs) return { status: 'verified-valid' };
    return {
      status: 'indeterminate',
      reason: 'native-query-failed',
      presentActive: false,
    };
  };
