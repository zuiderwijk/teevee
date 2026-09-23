import type { Channel, Programme } from '@/data/domain/epg';
import type { ProgrammeClassification } from '@/data/domain/programmeClassification';

export type ProgrammeClassificationRecoveryWrite = {
  from: string;
  to: string;
  observedAt: string;
  channelIds: Channel['id'][];
  programmes: Programme[];
  classifications: ProgrammeClassification[];
};

export type ProgrammeClassificationRecoveryWriteResult = {
  candidateProgrammeCount: number;
  matchedProgrammeCount: number;
  recoveredClassificationCount: number;
  ignoredStaleCount: number;
  unmatchedProgrammeCount: number;
};

/**
 * Trusted-server write boundary for non-destructive sibling recovery.
 *
 * Implementations must reconcile candidates against existing canonical broadcasts
 * and must never create, delete or rewrite canonical Programme/schedule state.
 */
export interface ProgrammeClassificationRecoveryRepository {
  recoverClassifications(
    input: ProgrammeClassificationRecoveryWrite,
  ): Promise<ProgrammeClassificationRecoveryWriteResult>;
}
