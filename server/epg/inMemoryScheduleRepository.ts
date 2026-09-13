import type {
  Channel,
  GuideSchedule,
  GuideScheduleQuery,
  Programme,
} from '@/data/domain/epg';

import type {
  ScheduleRepository,
  ScheduleWindowWrite,
  ScheduleWindowWriteResult,
} from './scheduleRepository';

function timestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp`);
  return parsed;
}

function windowBounds(from: string, to: string): [number, number] {
  const fromMs = timestamp(from, 'from');
  const toMs = timestamp(to, 'to');
  if (toMs <= fromMs) throw new Error('to must be after from');
  return [fromMs, toMs];
}

function programmeBounds(programme: Programme): [number, number] {
  const startMs = timestamp(programme.startAt, `Programme ${programme.id} startAt`);
  const endMs = timestamp(programme.endAt, `Programme ${programme.id} endAt`);
  if (endMs <= startMs) throw new Error(`Programme ${programme.id} must end after it starts`);
  return [startMs, endMs];
}

function intersects(startMs: number, endMs: number, fromMs: number, toMs: number): boolean {
  return startMs < toMs && endMs > fromMs;
}

function validateSchedule(schedule: GuideSchedule): {
  generatedAtMs: number;
  channelsById: Map<Channel['id'], Channel>;
  programmesById: Map<Programme['id'], Programme>;
} {
  const generatedAtMs = timestamp(schedule.generatedAt, 'schedule.generatedAt');
  const channelsById = new Map<Channel['id'], Channel>();

  for (const channel of schedule.channels) {
    if (channelsById.has(channel.id)) {
      throw new Error(`Duplicate canonical channel id: ${channel.id}`);
    }
    channelsById.set(channel.id, channel);
  }

  const programmesById = new Map<Programme['id'], Programme>();
  for (const programme of schedule.programmes) {
    if (!channelsById.has(programme.channelId)) {
      throw new Error(
        `Programme ${programme.id} references unknown canonical channel ${programme.channelId}`,
      );
    }
    if (programmesById.has(programme.id)) {
      throw new Error(`Duplicate canonical programme id: ${programme.id}`);
    }
    programmeBounds(programme);
    programmesById.set(programme.id, programme);
  }

  return { generatedAtMs, channelsById, programmesById };
}

/**
 * Deterministic reference implementation for repository semantics and tests.
 * It is intentionally not a production persistence choice.
 */
export class InMemoryScheduleRepository implements ScheduleRepository {
  private readonly channels = new Map<Channel['id'], Channel>();
  private readonly programmes = new Map<Programme['id'], Programme>();
  private generatedAtMs: number | null = null;

  async replaceWindow(input: ScheduleWindowWrite): Promise<ScheduleWindowWriteResult> {
    const [fromMs, toMs] = windowBounds(input.from, input.to);
    const validated = validateSchedule(input.schedule);
    const replacementChannelIds = new Set(input.channelIds);

    for (const channelId of replacementChannelIds) {
      if (!validated.channelsById.has(channelId)) {
        throw new Error(`Replacement channel ${channelId} is missing from the canonical schedule`);
      }
    }

    for (const channel of validated.channelsById.values()) {
      this.channels.set(channel.id, { ...channel });
    }

    let removedProgrammeCount = 0;
    for (const [programmeId, programme] of this.programmes) {
      if (!replacementChannelIds.has(programme.channelId)) continue;
      const [startMs, endMs] = programmeBounds(programme);
      if (!intersects(startMs, endMs, fromMs, toMs)) continue;
      this.programmes.delete(programmeId);
      removedProgrammeCount += 1;
    }

    let storedProgrammeCount = 0;
    for (const programme of validated.programmesById.values()) {
      if (!replacementChannelIds.has(programme.channelId)) continue;
      const [startMs, endMs] = programmeBounds(programme);
      if (!intersects(startMs, endMs, fromMs, toMs)) continue;
      this.programmes.set(programme.id, { ...programme });
      storedProgrammeCount += 1;
    }

    this.generatedAtMs =
      this.generatedAtMs === null
        ? validated.generatedAtMs
        : Math.max(this.generatedAtMs, validated.generatedAtMs);

    return { removedProgrammeCount, storedProgrammeCount };
  }

  async getSchedule(query: GuideScheduleQuery): Promise<GuideSchedule | null> {
    const [fromMs, toMs] = windowBounds(query.from, query.to);
    if (this.generatedAtMs === null) return null;

    const selectedChannelIds =
      query.channelIds === undefined
        ? new Set(this.channels.keys())
        : new Set(query.channelIds);

    const channels = [...this.channels.values()]
      .filter((channel) => selectedChannelIds.has(channel.id))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
      .map((channel) => ({ ...channel }));

    const channelOrder = new Map(channels.map((channel, index) => [channel.id, index]));
    const programmes = [...this.programmes.values()]
      .filter((programme) => {
        if (!selectedChannelIds.has(programme.channelId)) return false;
        const [startMs, endMs] = programmeBounds(programme);
        return intersects(startMs, endMs, fromMs, toMs);
      })
      .sort((left, right) => {
        const channelDifference =
          (channelOrder.get(left.channelId) ?? Number.MAX_SAFE_INTEGER) -
          (channelOrder.get(right.channelId) ?? Number.MAX_SAFE_INTEGER);
        if (channelDifference !== 0) return channelDifference;
        const startDifference = Date.parse(left.startAt) - Date.parse(right.startAt);
        if (startDifference !== 0) return startDifference;
        return left.id.localeCompare(right.id);
      })
      .map((programme) => ({ ...programme }));

    return {
      generatedAt: new Date(this.generatedAtMs).toISOString(),
      timezone: 'Europe/Amsterdam',
      channels,
      programmes,
    };
  }
}
