import type { Programme } from '@/data/domain/epg';
import {
  programmeIntersectsWindow,
} from '@/data/domain/tonight';

import {
  observeProviderSchedule,
  type ObserveProviderScheduleInput,
} from '../epg/ingest.ts';
import type {
  ProgrammeClassificationRecoveryRepository,
  ProgrammeClassificationRecoveryWriteResult,
} from './classificationRecoveryRepository.ts';

export type RecoverProviderClassificationsInput =
  ObserveProviderScheduleInput & {
    repository: ProgrammeClassificationRecoveryRepository;
  };

export type RecoverProviderClassificationsResult = {
  providerCoverage: 'complete' | 'partial';
  observedAt: string;
  candidateProgrammeCount: number;
  diagnostics: Awaited<
    ReturnType<typeof observeProviderSchedule>
  >['diagnostics'];
  recovery: ProgrammeClassificationRecoveryWriteResult;
};

function programmeInRecoveryScope(
  programme: Programme,
  channelIds: ReadonlySet<string>,
  fromMs: number,
  toMs: number,
): boolean {
  return (
    channelIds.has(programme.channelId) &&
    programmeIntersectsWindow(programme, fromMs, toMs)
  );
}

/**
 * Non-destructively recovers classification siblings from one bounded provider
 * observation. Provider coverage may be partial: coverage controls schedule
 * replacement authority, not whether an exact current canonical broadcast may
 * receive a sibling derived from the same central classifier.
 */
export async function recoverProviderClassifications(
  input: RecoverProviderClassificationsInput,
): Promise<RecoverProviderClassificationsResult> {
  const observation = await observeProviderSchedule(input);
  const fromMs = Date.parse(observation.from);
  const toMs = Date.parse(observation.to);
  const requestedChannelIds = new Set(
    observation.requestedCanonicalChannelIds,
  );

  const programmes = observation.schedule.programmes.filter((programme) =>
    programmeInRecoveryScope(
      programme,
      requestedChannelIds,
      fromMs,
      toMs,
    ),
  );
  const candidateIds = new Set(programmes.map(({ id }) => id));
  const classifications = observation.classifications.filter(
    (classification) => candidateIds.has(classification.programmeId),
  );

  if (classifications.length !== programmes.length) {
    throw new Error(
      'Normalised recovery candidates must have one classification per programme',
    );
  }

  const recovery = await input.repository.recoverClassifications({
    from: observation.from,
    to: observation.to,
    observedAt: observation.observedAt,
    channelIds: observation.requestedCanonicalChannelIds,
    programmes,
    classifications,
  });

  return {
    providerCoverage: observation.coverage,
    observedAt: observation.observedAt,
    candidateProgrammeCount: programmes.length,
    diagnostics: observation.diagnostics,
    recovery,
  };
}
