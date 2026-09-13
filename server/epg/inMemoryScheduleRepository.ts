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

type CoverageSegment = {
  fromMs: number;
  toMs: number;
  generatedAtMs: number;
};

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

function replaceCoverage(
  current: CoverageSegment[],
  fromMs: number,
  toMs: number,
  generatedAtMs: number,
): CoverageSegment[] {
  const next: CoverageSegment[] = [];

  for (const segment of current) {
    if (!intersects(segment.fromMs, segment.toMs, fromMs, toMs)) {
      next.push(segment);
      continue;
    }
    if (segment.fromMs < fromMs) {
      next.push({ ...segment, toMs: fromMs });
    }
    if (segment.toMs > toMs) {
      next.push({ ...segment, fromMs: toMs });
    }
  }

  next.push({ fromMs, toMs, generatedAtMs });
  next.sort((left, right) => left.fromMs - right.fromMs || left.toMs - right.toMs);

  const merged: CoverageSegment[] = [];
  for (const segment of next) {
    const previous = merged[merged.length - 1];
    if (
      previous &&
      previous.toMs === segment.fromMs &&
      previous.generatedAtMs === segment.generatedAtMs
    ) {
      previous.toMs = segment.toMs;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
}

function hasNewerCoverage(
  segments: CoverageSegment[],
  fromMs: number,
  toMs: number,
  generatedAtMs: number,
): boolean {
  return segments.some(
    (segment) =>
      intersects(segment.fromMs, segment.toMs, fromMs, toMs) &&
      segment.generatedAtMs > generatedAtMs,
  );
}

function coveredFreshness(
  segments: CoverageSegment[],
  fromMs: number,
  toMs: number,
): number | null {
  let cursor = fromMs;
  let oldestGeneratedAtMs = Number.POSITIVE_INFINITY;

  for (const segment of segments) {
    if (segment.toMs <= cursor) continue;
    if (segment.fromMs > cursor) return null;

    oldestGeneratedAtMs = Math.min(oldestGeneratedAtMs, segment.generatedAtMs);
    cursor = Math.max(cursor, segment.toMs);
    if (cursor >= toMs) return oldestGeneratedAtMs;
  }

  return null;
}

/**
 * Deterministic reference implementation for repository semantics and tests.
 * It is intentionally not a production persistence choice.
 */
export class InMemoryScheduleRepository implements ScheduleRepository {
  private readonly channels = new Map<Channel['id'], Channel>();
  private readonly programmes = new Map<Programme['id'], Programme>();
  private readonly coverageByChannel = new Map<Channel['id'], CoverageSegment[]>();

  async replaceWindow(input: ScheduleWindowWrite): Promise<ScheduleWindowWriteResult> {
    const [fromMs, toMs] = windowBounds(input.from, input.to);
    const validated = validateSchedule(input.schedule);
    const replacementChannelIds = new Set(input.channelIds);
    if (replacementChannelIds.size === 0) {
      throw new Error('channelIds must contain at least one channel');
    }

    for (const channelId of replacementChannelIds) {
      if (!validated.channelsById.has(channelId)) {
        throw new Error(`Replacement channel ${channelId} is missing from the canonical schedule`);
      }
      if (
        hasNewerCoverage(
          this.coverageByChannel.get(channelId) ?? [],
          fromMs,
          toMs,
          validated.generatedAtMs,
        )
      ) {
        return {
          status: 'ignored-stale',
          removedProgrammeCount: 0,
          storedProgrammeCount: 0,
        };
      }
    }

    for (const channelId of replacementChannelIds) {
      const channel = validated.channelsById.get(channelId);
      if (channel) this.channels.set(channel.id, { ...channel });
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

    for (const channelId of replacementChannelIds) {
      this.coverageByChannel.set(
        channelId,
        replaceCoverage(
          this.coverageByChannel.get(channelId) ?? [],
          fromMs,
          toMs,
          validated.generatedAtMs,
        ),
      );
    }

    return { status: 'stored', removedProgrammeCount, storedProgrammeCount };
  }

  async getSchedule(query: GuideScheduleQuery): Promise<GuideSchedule | null> {
    const [fromMs, toMs] = windowBounds(query.from, query.to);
    if (query.channelIds !== undefined && query.channelIds.length === 0) {
      throw new Error('channelIds must contain at least one channel when provided');
    }

    const selectedChannelIds =
      query.channelIds === undefined
        ? [...this.channels.keys()]
        : [...new Set(query.channelIds)];
    if (selectedChannelIds.length === 0) return null;

    let oldestGeneratedAtMs = Number.POSITIVE_INFINITY;
    for (const channelId of selectedChannelIds) {
      if (!this.channels.has(channelId)) return null;
      const freshness = coveredFreshness(this.coverageByChannel.get(channelId) ?? [], fromMs, toMs);
      if (freshness === null) return null;
      oldestGeneratedAtMs = Math.min(oldestGeneratedAtMs, freshness);
    }

    const selectedSet = new Set(selectedChannelIds);
    const channels = [...this.channels.values()]
      .filter((channel) => selectedSet.has(channel.id))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
      .map((channel) => ({ ...channel }));

    const channelOrder = new Map(channels.map((channel, index) => [channel.id, index]));
    const programmes = [...this.programmes.values()]
      .filter((programme) => {
        if (!selectedSet.has(programme.channelId)) return false;
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
      generatedAt: new Date(oldestGeneratedAtMs).toISOString(),
      timezone: 'Europe/Amsterdam',
      channels,
      programmes,
    };
  }
}
