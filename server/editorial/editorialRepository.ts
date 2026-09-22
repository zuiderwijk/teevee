import type { ProgrammeEditorialSignal } from '../../data/domain/editorial.ts';
import type { Programme } from '../../data/domain/epg.ts';

export type EditorialSource = ProgrammeEditorialSignal['source'];

export type EditorialSignalSnapshotWrite = {
  source: EditorialSource;
  refreshedAt: string;
  signals: ProgrammeEditorialSignal[];
};

export type EditorialSignalSnapshotWriteResult =
  | {
      status: 'stored';
      removedSignalCount: number;
      storedSignalCount: number;
    }
  | {
      status: 'ignored-stale';
      removedSignalCount: 0;
      storedSignalCount: 0;
    };

export interface ProgrammeEditorialSignalRepository {
  replaceSourceSnapshot(
    input: EditorialSignalSnapshotWrite,
  ): Promise<EditorialSignalSnapshotWriteResult>;
  getSignalsForProgrammeIds(
    programmeIds: readonly Programme['id'][],
  ): Promise<ProgrammeEditorialSignal[]>;
}
