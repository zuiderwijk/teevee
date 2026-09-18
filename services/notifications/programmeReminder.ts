import type { ProgrammeReminderService } from './programmeReminderContract';

export {
  PROGRAMME_REMINDER_IMMEDIATE_DELAY_MS,
  PROGRAMME_REMINDER_LEAD_MS,
  programmeReminderFireAtMs,
  type ProgrammeReminderScheduleResult,
  type ProgrammeReminderService,
} from './programmeReminderContract';

export const scheduleProgrammeReminder: ProgrammeReminderService['scheduleProgrammeReminder'] =
  async (programme, _channel, nowMs = Date.now()) => {
    if (Date.parse(programme.startAt) <= nowMs) return { ok: false, reason: 'started' };
    return { ok: false, reason: 'unsupported' };
  };

export const cancelProgrammeReminder: ProgrammeReminderService['cancelProgrammeReminder'] =
  async () => false;

export const reconcileProgrammeReminder: ProgrammeReminderService['reconcileProgrammeReminder'] =
  async (record, programme, nowMs = Date.now()) =>
    record.programmeStartAt === programme.startAt &&
    Date.parse(programme.startAt) > nowMs &&
    record.fireAtMs <= nowMs;
