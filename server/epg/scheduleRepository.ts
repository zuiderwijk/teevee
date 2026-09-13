import type { Channel, GuideSchedule, GuideScheduleQuery } from '@/data/domain/epg';

/**
 * Canonical replacement write for one refreshed time window.
 * `channelIds` is explicit so a partial-channel refresh can never erase unrelated channels.
 */
export type ScheduleWindowWrite = {
  from: string;
  to: string;
  channelIds: Channel['id'][];
  schedule: GuideSchedule;
};

export type ScheduleWindowWriteResult = {
  removedProgrammeCount: number;
  storedProgrammeCount: number;
};

/**
 * Backend-independent storage boundary for canonical Teevee schedules.
 * Implementations may use Postgres/Supabase, SQLite for tooling, or deterministic memory in tests.
 */
export interface ScheduleRepository {
  replaceWindow(input: ScheduleWindowWrite): Promise<ScheduleWindowWriteResult>;
  getSchedule(query: GuideScheduleQuery): Promise<GuideSchedule | null>;
}
