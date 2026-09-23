import type { GuideSchedule } from '@/data/domain/epg';

import type {
  ScheduleRepository,
  ScheduleWindowWrite,
  ScheduleWindowWriteResult,
} from './scheduleRepository';

type RpcError = { message: string };

type RpcResponse<T> = {
  data: T | null;
  error: RpcError | null;
};

/**
 * Minimal server-side Supabase RPC shape. Keeping this structural avoids coupling
 * the domain/repository layer to supabase-js while still allowing a real client
 * to satisfy the contract.
 */
export type ScheduleRpcClient = {
  rpc<T>(functionName: string, args: Record<string, unknown>): Promise<RpcResponse<T>>;
};

function rpcError(operation: string, error: RpcError): Error {
  return new Error(`Supabase ${operation} failed: ${error.message}`);
}

function parseWriteResult(value: unknown): ScheduleWindowWriteResult {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Supabase replace_schedule_window returned an invalid payload');
  }

  const payload = value as Record<string, unknown>;
  if (payload.status === 'ignored-stale') {
    if (payload.removedProgrammeCount !== 0 || payload.storedProgrammeCount !== 0) {
      throw new Error('Supabase ignored-stale payload must report zero mutations');
    }
    return {
      status: 'ignored-stale',
      removedProgrammeCount: 0,
      storedProgrammeCount: 0,
    };
  }

  if (
    payload.status === 'stored' &&
    typeof payload.removedProgrammeCount === 'number' &&
    typeof payload.storedProgrammeCount === 'number'
  ) {
    return {
      status: 'stored',
      removedProgrammeCount: payload.removedProgrammeCount,
      storedProgrammeCount: payload.storedProgrammeCount,
    };
  }

  throw new Error('Supabase replace_schedule_window returned an invalid payload');
}

function parseGuideSchedule(value: unknown): GuideSchedule {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Supabase get_schedule returned an invalid payload');
  }

  const schedule = value as Record<string, unknown>;
  if (
    typeof schedule.generatedAt !== 'string' ||
    schedule.timezone !== 'Europe/Amsterdam' ||
    !Array.isArray(schedule.channels) ||
    !Array.isArray(schedule.programmes)
  ) {
    throw new Error('Supabase get_schedule returned an invalid payload');
  }

  return value as GuideSchedule;
}

export class SupabaseScheduleRepository implements ScheduleRepository {
  constructor(private readonly client: ScheduleRpcClient) {}

  async replaceWindow(input: ScheduleWindowWrite): Promise<ScheduleWindowWriteResult> {
    const classified = input.classifications !== undefined;
    const response = await this.client.rpc<unknown>(
      classified
        ? 'teevee_replace_schedule_window_classified'
        : 'teevee_replace_schedule_window',
      {
        p_from: input.from,
        p_to: input.to,
        p_generated_at: input.schedule.generatedAt,
        p_channel_ids: input.channelIds,
        p_channels: input.schedule.channels,
        p_programmes: input.schedule.programmes,
        ...(classified ? { p_classifications: input.classifications } : {}),
      },
    );

    if (response.error) throw rpcError('replace_schedule_window', response.error);
    return parseWriteResult(response.data);
  }

  async getSchedule(query: Parameters<ScheduleRepository['getSchedule']>[0]): Promise<GuideSchedule | null> {
    const response = await this.client.rpc<unknown>('teevee_get_schedule', {
      p_from: query.from,
      p_to: query.to,
      p_channel_ids: query.channelIds ?? null,
    });

    if (response.error) throw rpcError('get_schedule', response.error);
    if (response.data === null) return null;
    return parseGuideSchedule(response.data);
  }
}
