import type { ProgrammeEditorialSignalRepository } from '../editorial/editorialRepository.ts';
import type { ScheduleRepository } from '../epg/scheduleRepository.ts';
import type { Channel, GuideSchedule, Programme } from '../../data/domain/epg.ts';
import {
  guideSearchMatchKind,
  guideSearchMatchRank,
  normalizeGuideSearchText,
  type GuideSearchMatchKind,
} from '../../data/domain/search.ts';
import { guideTelevisionDayHorizon } from '../../data/domain/guideTime.ts';
import {
  GUIDE_SEARCH_PROGRAMME_LIMIT,
  parseGuideSearchApiRequest,
  type GuideSearchApi,
  type GuideSearchApiRequest,
  type GuideSearchApiResponse,
} from '../../services/api/guideSearchContract.ts';

type RankedChannel = {
  channel: Channel;
  matchKind: GuideSearchMatchKind;
};

type RankedProgramme = {
  programme: Programme;
  channel: Channel;
  matchKind: GuideSearchMatchKind;
};

function channelFingerprint(channel: Channel): string {
  return JSON.stringify([
    channel.id,
    channel.name,
    channel.displayName,
    channel.sortOrder,
    channel.isActive,
    channel.shortName ?? null,
    channel.logoUrl ?? null,
  ]);
}

function programmeFingerprint(programme: Programme): string {
  return JSON.stringify([
    programme.id,
    programme.channelId,
    programme.startAt,
    programme.endAt,
    programme.title,
    programme.subtitle ?? null,
    programme.description ?? null,
    programme.genre ?? null,
    programme.isLive ?? null,
    programme.isRepeat ?? null,
  ]);
}

function mergeCanonicalSchedules(schedules: readonly GuideSchedule[]): {
  channels: Channel[];
  programmes: Programme[];
} {
  const channelsById = new Map<string, Channel>();
  const programmesById = new Map<string, Programme>();

  for (const schedule of schedules) {
    if (schedule.timezone !== 'Europe/Amsterdam') {
      throw new Error('Guide Search requires Europe/Amsterdam schedules');
    }

    for (const channel of schedule.channels) {
      const existing = channelsById.get(channel.id);
      if (existing && channelFingerprint(existing) !== channelFingerprint(channel)) {
        throw new Error(`Conflicting canonical channel metadata for ${channel.id}`);
      }
      channelsById.set(channel.id, existing ?? channel);
    }

    for (const programme of schedule.programmes) {
      const existing = programmesById.get(programme.id);
      if (existing && programmeFingerprint(existing) !== programmeFingerprint(programme)) {
        throw new Error(`Conflicting canonical programme data for ${programme.id}`);
      }
      programmesById.set(programme.id, existing ?? programme);
    }
  }

  const channels = [...channelsById.values()].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id),
  );
  return { channels, programmes: [...programmesById.values()] };
}

function bestChannelMatch(
  channel: Channel,
  normalizedQuery: string,
): GuideSearchMatchKind | null {
  const candidates = [channel.displayName, channel.shortName, channel.name].filter(
    (value): value is string => typeof value === 'string' && value.trim() !== '',
  );

  let best: GuideSearchMatchKind | null = null;
  for (const candidate of candidates) {
    const match = guideSearchMatchKind(candidate, normalizedQuery);
    if (
      match &&
      (best === null || guideSearchMatchRank(match) < guideSearchMatchRank(best))
    ) {
      best = match;
    }
  }
  return best;
}

function temporalBucket(programme: Programme, nowMs: number): 0 | 1 | 2 {
  const startMs = Date.parse(programme.startAt);
  const endMs = Date.parse(programme.endAt);
  if (startMs <= nowMs && nowMs < endMs) return 0;
  if (startMs >= nowMs) return 1;
  return 2;
}

function compareProgrammeTime(
  left: Programme,
  right: Programme,
  bucket: 0 | 1 | 2,
): number {
  const leftStart = Date.parse(left.startAt);
  const rightStart = Date.parse(right.startAt);
  return bucket === 2 ? rightStart - leftStart : leftStart - rightStart;
}

export class RepositoryGuideSearchApi implements GuideSearchApi {
  constructor(
    private readonly scheduleRepository: ScheduleRepository,
    private readonly editorialRepository?: ProgrammeEditorialSignalRepository,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async search(input: GuideSearchApiRequest): Promise<GuideSearchApiResponse> {
    const request = parseGuideSearchApiRequest(input);
    const normalizedQuery = normalizeGuideSearchText(request.query);
    const nowMs = this.now();
    const windows = guideTelevisionDayHorizon(nowMs);

    const settled = await Promise.allSettled(
      windows.map(({ fromMs, toMs }) =>
        this.scheduleRepository.getSchedule({
          from: new Date(fromMs).toISOString(),
          to: new Date(toMs).toISOString(),
        }),
      ),
    );

    const schedules: GuideSchedule[] = [];
    let failedReadCount = 0;
    for (const result of settled) {
      if (result.status === 'rejected') {
        failedReadCount += 1;
      } else if (result.value) {
        schedules.push(result.value);
      }
    }

    if (schedules.length === 0) {
      if (failedReadCount > 0) {
        throw new Error('Guide Search canonical schedule reads failed');
      }
      return {
        status: 'ok',
        programmeCoverage: 'unavailable',
        channelMatches: [],
        programmeMatches: [],
        editorialSignals: [],
      };
    }

    const programmeCoverage =
      schedules.length === windows.length && failedReadCount === 0
        ? 'complete'
        : 'partial';

    const { channels, programmes } = mergeCanonicalSchedules(schedules);
    const channelOrder = new Map(channels.map((channel) => [channel.id, channel.sortOrder]));
    const channelById = new Map(channels.map((channel) => [channel.id, channel]));

    const rankedChannels: RankedChannel[] = [];
    for (const channel of channels) {
      const matchKind = bestChannelMatch(channel, normalizedQuery);
      if (matchKind) rankedChannels.push({ channel, matchKind });
    }
    rankedChannels.sort(
      (left, right) =>
        guideSearchMatchRank(left.matchKind) - guideSearchMatchRank(right.matchKind) ||
        left.channel.sortOrder - right.channel.sortOrder ||
        left.channel.id.localeCompare(right.channel.id),
    );

    const rankedProgrammes: RankedProgramme[] = [];
    for (const programme of programmes) {
      const matchKind = guideSearchMatchKind(programme.title, normalizedQuery);
      if (!matchKind) continue;
      const channel = channelById.get(programme.channelId);
      if (!channel) {
        throw new Error(
          `Canonical Search programme ${programme.id} references missing channel ${programme.channelId}`,
        );
      }
      rankedProgrammes.push({ programme, channel, matchKind });
    }

    rankedProgrammes.sort((left, right) => {
      const matchDifference =
        guideSearchMatchRank(left.matchKind) - guideSearchMatchRank(right.matchKind);
      if (matchDifference !== 0) return matchDifference;

      const leftBucket = temporalBucket(left.programme, nowMs);
      const rightBucket = temporalBucket(right.programme, nowMs);
      if (leftBucket !== rightBucket) return leftBucket - rightBucket;

      const timeDifference = compareProgrammeTime(
        left.programme,
        right.programme,
        leftBucket,
      );
      if (timeDifference !== 0) return timeDifference;

      const channelDifference =
        (channelOrder.get(left.channel.id) ?? Number.MAX_SAFE_INTEGER) -
        (channelOrder.get(right.channel.id) ?? Number.MAX_SAFE_INTEGER);
      if (channelDifference !== 0) return channelDifference;
      return left.programme.id.localeCompare(right.programme.id);
    });

    const programmeMatches = rankedProgrammes
      .slice(0, GUIDE_SEARCH_PROGRAMME_LIMIT)
      .map(({ programme, channel }) => ({ programme, channel }));

    let editorialSignals = [];
    if (this.editorialRepository && programmeMatches.length > 0) {
      try {
        editorialSignals = await this.editorialRepository.getSignalsForProgrammeIds(
          programmeMatches.map(({ programme }) => programme.id),
        );
      } catch (error) {
        console.error('Teevee Guide Search editorial read failed', error);
      }
    }

    return {
      status: 'ok',
      programmeCoverage,
      channelMatches: rankedChannels.map(({ channel }) => channel),
      programmeMatches,
      editorialSignals,
    };
  }
}
