import type { ProgrammeEditorialSignal } from '../../data/domain/editorial.ts';
import { parseProgrammeEditorialSignals } from '../../services/api/editorialSignalContract.ts';

import type {
  EditorialSignalSnapshotWrite,
  EditorialSignalSnapshotWriteResult,
  ProgrammeEditorialSignalRepository,
} from './editorialRepository.ts';

type RpcError = { message: string };
type RpcResponse<T> = { data: T | null; error: RpcError | null };

export type EditorialRpcClient = {
  rpc<T>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<RpcResponse<T>>;
};

function rpcError(operation: string, error: RpcError): Error {
  return new Error('Supabase ' + operation + ' failed: ' + error.message);
}

function parseWriteResult(value: unknown): EditorialSignalSnapshotWriteResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(
      'Supabase replace_editorial_signal_snapshot returned an invalid payload',
    );
  }
  const payload = value as Record<string, unknown>;
  if (
    payload.status === 'ignored-stale' &&
    payload.removedSignalCount === 0 &&
    payload.storedSignalCount === 0
  ) {
    return {
      status: 'ignored-stale',
      removedSignalCount: 0,
      storedSignalCount: 0,
    };
  }
  if (
    payload.status === 'stored' &&
    typeof payload.removedSignalCount === 'number' &&
    typeof payload.storedSignalCount === 'number'
  ) {
    return {
      status: 'stored',
      removedSignalCount: payload.removedSignalCount,
      storedSignalCount: payload.storedSignalCount,
    };
  }
  throw new Error(
    'Supabase replace_editorial_signal_snapshot returned an invalid payload',
  );
}

export class SupabaseEditorialSignalRepository
  implements ProgrammeEditorialSignalRepository
{
  constructor(private readonly client: EditorialRpcClient) {}

  async replaceSourceSnapshot(
    input: EditorialSignalSnapshotWrite,
  ): Promise<EditorialSignalSnapshotWriteResult> {
    const response = await this.client.rpc<unknown>(
      'teevee_replace_editorial_signal_snapshot',
      {
        p_source: input.source,
        p_refreshed_at: input.refreshedAt,
        p_signals: input.signals,
      },
    );
    if (response.error) {
      throw rpcError('replace_editorial_signal_snapshot', response.error);
    }
    return parseWriteResult(response.data);
  }

  async getSignalsForProgrammeIds(
    programmeIds: readonly string[],
  ): Promise<ProgrammeEditorialSignal[]> {
    if (programmeIds.length === 0) return [];
    const response = await this.client.rpc<unknown>(
      'teevee_get_editorial_signals',
      {
        p_programme_ids: [...new Set(programmeIds)],
      },
    );
    if (response.error) throw rpcError('get_editorial_signals', response.error);
    return parseProgrammeEditorialSignals(response.data ?? []);
  }
}
