import type {
  GuideScheduleApi,
  GuideScheduleApiRequest,
  GuideScheduleApiResponse,
} from '@/services/api/guideScheduleContract';

import type { ScheduleRepository } from './scheduleRepository';

/**
 * Thin provider/database-independent service boundary. A future HTTP/Edge Function
 * transport should delegate to this contract rather than expose repository/provider details.
 */
export class RepositoryGuideScheduleApi implements GuideScheduleApi {
  constructor(private readonly repository: ScheduleRepository) {}

  async getSchedule(request: GuideScheduleApiRequest): Promise<GuideScheduleApiResponse> {
    const schedule = await this.repository.getSchedule(request);
    return schedule ? { status: 'ok', schedule } : { status: 'unavailable' };
  }
}
