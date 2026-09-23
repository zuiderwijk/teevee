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
    const classifications =
      await this.repository.getClassificationsForProgrammeIds(
        request.programmeIds,
      );
    const requested = new Set(request.programmeIds);
    if (
      classifications.some(
        (classification) => !requested.has(classification.programmeId),
      )
    ) {
      throw new Error(
        'Programme classification repository returned an unrequested programme',
      );
    }

    return { status: 'ok', classifications };
  }
}
