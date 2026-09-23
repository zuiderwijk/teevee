import type { Programme } from '../../data/domain/epg.ts';

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
  const startMs = Date.parse(programme.startAt);
  const endMs = Date.parse(programme.endAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    throw new Error(
      `Recovery candidate ${programme.id} has invalid canonical timestamps`,
    );
  }
  return (
    channelIds.has(programme.channelId) &&
    startMs < toMs &&
    endMs > fromMs
  );
}

function overlappingProgrammeIds(
  programmes: readonly Programme[],
): ReadonlySet<Programme['id']> {
  const byChannel = new Map<string, Programme[]>();
  for (const programme of programmes) {
    const channelProgrammes = byChannel.get(programme.channelId) ?? [];
    channelProgrammes.push(programme);
    byChannel.set(programme.channelId, channelProgrammes);
  }

  const overlapping = new Set<Programme['id']>();
  for (const channelProgrammes of byChannel.values()) {
    const ordered = [...channelProgrammes].sort(
      (left, right) =>
        Date.parse(left.startAt) - Date.parse(right.startAt) ||
        Date.parse(left.endAt) - Date.parse(right.endAt) ||
        left.id.localeCompare(right.id),
    );

    for (let leftIndex = 0; leftIndex < ordered.length; leftIndex += 1) {
      const left = ordered[leftIndex]!;
      const leftEndMs = Date.parse(left.endAt);
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < ordered.length;
        rightIndex += 1
      ) {
        const right = ordered[rightIndex]!;
        const rightStartMs = Date.parse(right.startAt);
        if (rightStartMs >= leftEndMs) break;
        overlapping.add(left.id);
        overlapping.add(right.id);
      }
    }
  }

  return overlapping;
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
  const safeChannelIds = new Set(observation.safeChannelIds);

  const scopedProgrammes = observation.schedule.programmes.filter((programme) =>
    programmeInRecoveryScope(
      programme,
      safeChannelIds,
      fromMs,
      toMs,
    ),
  );
  const ambiguousProgrammeIds = overlappingProgrammeIds(scopedProgrammes);
  const programmes = scopedProgrammes.filter(
    ({ id }) => !ambiguousProgrammeIds.has(id),
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
    channelIds: observation.safeChannelIds,
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
