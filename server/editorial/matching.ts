import type { ProgrammeEditorialSignal } from '../../data/domain/editorial.ts';
import type { Channel, GuideSchedule, Programme } from '../../data/domain/epg.ts';

import type { TvgidsTipSourceItem } from './tvgidsTipsFeed.ts';

const START_TOLERANCE_MS = 5 * 60_000;

export type KijktipMatchOutcome =
  | {
      status: 'matched';
      signal: ProgrammeEditorialSignal;
      titleMismatch: boolean;
    }
  | {
      status: 'ambiguous';
      titleMismatch: boolean;
    }
  | {
      status: 'unmatched';
      reason: 'start-drift' | 'title-mismatch-start-drift' | 'no-candidate';
      titleMismatch: boolean;
    };

export function normalizeEditorialTitle(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[‘’‛]/g, "'")
    .replace(/[‐‑‒–—―]/g, '-')
    .trim()
    .replace(/^\p{P}+|\p{P}+$/gu, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function signal(
  item: TvgidsTipSourceItem,
  programme: Programme,
  matchedBy: ProgrammeEditorialSignal['matchedBy'],
): ProgrammeEditorialSignal {
  return {
    programmeId: programme.id,
    type: 'kijktip',
    source: 'tvgids',
    sourceItemId: item.sourceItemId,
    ...(item.sourceUrl ? { sourceUrl: item.sourceUrl } : {}),
    ...(item.publishedAt ? { publishedAt: item.publishedAt } : {}),
    matchedBy,
  };
}

export function matchTvgidsTipToSchedule(
  item: TvgidsTipSourceItem,
  channelId: Channel['id'],
  schedule: GuideSchedule,
  sourceProgrammeId?: Programme['id'],
): KijktipMatchOutcome {
  const channelProgrammes = schedule.programmes.filter(
    (programme) => programme.channelId === channelId,
  );

  if (sourceProgrammeId) {
    const exactSource = channelProgrammes.filter(
      (programme) => programme.id === sourceProgrammeId,
    );
    if (exactSource.length === 1) {
      return {
        status: 'matched',
        signal: signal(item, exactSource[0]!, 'source-id'),
        titleMismatch:
          normalizeEditorialTitle(exactSource[0]!.title) !==
          normalizeEditorialTitle(item.title),
      };
    }
    if (exactSource.length > 1) {
      return { status: 'ambiguous', titleMismatch: false };
    }
  }

  const itemStartMs = Date.parse(item.startAt);
  const normalizedTitle = normalizeEditorialTitle(item.title);
  const withinTolerance = channelProgrammes.filter(
    (programme) =>
      Math.abs(Date.parse(programme.startAt) - itemStartMs) <=
      START_TOLERANCE_MS,
  );
  const titleMatches = withinTolerance.filter(
    (programme) => normalizeEditorialTitle(programme.title) === normalizedTitle,
  );

  if (titleMatches.length > 1) {
    return { status: 'ambiguous', titleMismatch: false };
  }
  if (titleMatches.length === 1) {
    return {
      status: 'matched',
      signal: signal(item, titleMatches[0]!, 'channel-title-start'),
      titleMismatch: false,
    };
  }

  const exactStart = channelProgrammes.filter(
    (programme) => Date.parse(programme.startAt) === itemStartMs,
  );
  if (exactStart.length > 1) {
    return { status: 'ambiguous', titleMismatch: true };
  }
  if (exactStart.length === 1) {
    return {
      status: 'matched',
      signal: signal(item, exactStart[0]!, 'channel-exact-start'),
      titleMismatch:
        normalizeEditorialTitle(exactStart[0]!.title) !== normalizedTitle,
    };
  }

  if (withinTolerance.length > 0) {
    return {
      status: 'unmatched',
      reason: 'title-mismatch-start-drift',
      titleMismatch: true,
    };
  }

  const sameTitleElsewhere = channelProgrammes.some(
    (programme) => normalizeEditorialTitle(programme.title) === normalizedTitle,
  );
  return {
    status: 'unmatched',
    reason: sameTitleElsewhere ? 'start-drift' : 'no-candidate',
    titleMismatch: false,
  };
}
