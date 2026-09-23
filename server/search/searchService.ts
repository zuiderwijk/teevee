import type { ProgrammeEditorialSignal } from '../../data/domain/editorial.ts';
import { guideTelevisionDayHorizon } from '../../data/domain/guideTime.ts';
import type { ProgrammeEditorialSignalRepository } from '../editorial/editorialRepository.ts';
import {
  GUIDE_SEARCH_CHANNEL_LIMIT,
  GUIDE_SEARCH_PROGRAMME_LIMIT,
  parseGuideSearchApiRequest,
  type GuideSearchApi,
  type GuideSearchApiRequest,
  type GuideSearchApiResponse,
} from '../../services/api/guideSearchContract.ts';
import type { GuideSearchRepository } from './searchRepository.ts';

/**
 * Provider-independent Search service.
 *
 * Horizon ownership stays on the server and is derived from the shared ADR 0008
 * television-day primitives. The storage implementation receives only ten exact
 * bounded windows and returns already-bounded canonical matches; full schedules
 * never cross the Search repository boundary.
 */
export class RepositoryGuideSearchApi implements GuideSearchApi {
  constructor(
    private readonly searchRepository: GuideSearchRepository,
    private readonly editorialRepository?: ProgrammeEditorialSignalRepository,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async search(input: GuideSearchApiRequest): Promise<GuideSearchApiResponse> {
    const request = parseGuideSearchApiRequest(input);
    const nowMs = this.now();
    const windows = guideTelevisionDayHorizon(nowMs).map(({ fromMs, toMs }) => ({
      from: new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
    }));

    const result = await this.searchRepository.search({
      query: request.query,
      now: new Date(nowMs).toISOString(),
      windows,
      programmeLimit: GUIDE_SEARCH_PROGRAMME_LIMIT,
      channelLimit: GUIDE_SEARCH_CHANNEL_LIMIT,
    });

    let editorialSignals: ProgrammeEditorialSignal[] = [];
    if (this.editorialRepository && result.programmeMatches.length > 0) {
      try {
        editorialSignals = await this.editorialRepository.getSignalsForProgrammeIds(
          result.programmeMatches.map(({ programme }) => programme.id),
        );
      } catch (error) {
        // Editorial metadata is optional and must never downgrade canonical Search.
        console.error('Teevee Guide Search editorial read failed', error);
      }
    }

    return {
      status: 'ok',
      programmeCoverage: result.programmeCoverage,
      channelMatches: result.channelMatches,
      programmeMatches: result.programmeMatches,
      editorialSignals,
    };
  }
}
