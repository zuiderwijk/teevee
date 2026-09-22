import type {
  GuideScheduleApi,
  GuideScheduleApiRequest,
  GuideScheduleApiResponse,
} from '@/services/api/guideScheduleContract';

import type { ProgrammeEditorialSignalRepository } from '../editorial/editorialRepository.ts';
import type { ScheduleRepository } from './scheduleRepository';

/**
 * Thin provider/database-independent service boundary. A future HTTP/Edge Function
 * transport should delegate to this contract rather than expose repository/provider details.
 */
export class RepositoryGuideScheduleApi implements GuideScheduleApi {
  constructor(
    private readonly repository: ScheduleRepository,
    private readonly editorialRepository?: ProgrammeEditorialSignalRepository,
  ) {}

  async getSchedule(request: GuideScheduleApiRequest): Promise<GuideScheduleApiResponse> {
    const schedule = await this.repository.getSchedule(request);
    if (!schedule) return { status: 'unavailable' };

    let editorialSignals = [];
    if (this.editorialRepository) {
      try {
        editorialSignals =
          await this.editorialRepository.getSignalsForProgrammeIds(
            schedule.programmes.map(({ id }) => id),
          );
      } catch (error) {
        // Editorial enrichment is explicitly non-critical. A broken/temporarily
        // unavailable editorial store must never downgrade a valid schedule read.
        console.error('Teevee editorial signal read failed', error);
      }
    }

    return { status: 'ok', schedule, editorialSignals };
  }
}
