import type { ProgrammeClassification } from '../../data/domain/programmeClassification.ts';
import type { Programme } from '../../data/domain/epg.ts';

export interface ProgrammeClassificationRepository {
  getClassificationsForProgrammeIds(
    programmeIds: readonly Programme['id'][],
  ): Promise<ProgrammeClassification[]>;
}
