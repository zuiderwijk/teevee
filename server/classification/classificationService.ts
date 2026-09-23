import {
  parseProgrammeClassificationApiRequest,
  type ProgrammeClassificationApi,
  type ProgrammeClassificationApiRequest,
  type ProgrammeClassificationApiResponse,
} from '../../services/api/programmeClassificationContract.ts';
import type { ProgrammeClassificationRepository } from './classificationRepository.ts';

export class RepositoryProgrammeClassificationApi
  implements ProgrammeClassificationApi
{
  constructor(private readonly repository: ProgrammeClassificationRepository) {}

  async getClassifications(
    input: ProgrammeClassificationApiRequest,
  ): Promise<ProgrammeClassificationApiResponse> {
    const request = parseProgrammeClassificationApiRequest(input);
    return {
      status: 'ok',
      classifications:
        await this.repository.getClassificationsForProgrammeIds(
          request.programmeIds,
        ),
    };
  }
}
