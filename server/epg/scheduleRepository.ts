import type { Channel, GuideSchedule, GuideScheduleQuery } from '@/data/domain/epg';
import type { ProgrammeClassification } from '@/data/domain/programmeClassification';

/**
 * Canonical replacement write for one refreshed time window.
 * `channelIds` is explicit so a partial-channel refresh can never erase unrelated channels.
 */
export type ScheduleWindowWrite = {
  from: string;
  to: string;
  channelIds: Channel['id'][];
  schedule: GuideSchedule;
  /** Production provider ingestion supplies one semantic sibling per stored programme. */
  classifications?: ProgrammeClassification[];
};

export type ScheduleWindowWriteResult =
  | {
      status: 'stored';
      removedProgrammeCount: number;
      storedProgrammeCount: number;
    }
  | {
      status: 'ignored-stale';
      removedProgrammeCount: 0;
      storedProgrammeCount: 0;
    };

/**
 * Backend-independent storage boundary for canonical Teevee schedules.
 * `getSchedule` returns null when the requested channel/time scope is not fully covered;
 * a fully covered schedule with zero programmes remains a valid non-null result.
 */
export interface ScheduleRepository {
  replaceWindow(input: ScheduleWindowWrite): Promise<ScheduleWindowWriteResult>;
  getSchedule(query: GuideScheduleQuery): Promise<GuideSchedule | null>;
}
