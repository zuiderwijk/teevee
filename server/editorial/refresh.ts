import type { ProgrammeEditorialSignal } from '../../data/domain/editorial.ts';
import { guideTelevisionDayStart } from '../../data/domain/guideTime.ts';
import type { ScheduleRepository } from '../epg/scheduleRepository.ts';

import type { ProgrammeEditorialSignalRepository } from './editorialRepository.ts';
import { matchTvgidsTipToSchedule } from './matching.ts';
import { canonicalChannelIdForTvgidsName } from './tvgidsChannelMapping.ts';
import type {
  TvgidsTipSourceItem,
  TvgidsTipsSource,
} from './tvgidsTipsFeed.ts';

export type EditorialRefreshDiagnostics = {
  feedItemsReceived: number;
  sourceBroadcastIdsExtracted: number;
  tierAMatches: number;
  tierBMatches: number;
  tierCMatches: number;
  ambiguous: number;
  titleMismatches: number;
  unsupportedChannels: number;
  outsideScheduleCoverage: number;
  invalidOrUndecodable: number;
  duplicates: number;
  unmatched: number;
};

export type EditorialRefreshResult = {
  status: 'stored' | 'ignored-stale';
  source: 'tvgids';
  refreshedAt: string;
  storedSignalCount: number;
  diagnostics: EditorialRefreshDiagnostics;
};

type RefreshDependencies = {
  source: TvgidsTipsSource;
  scheduleRepository: ScheduleRepository;
  editorialRepository: ProgrammeEditorialSignalRepository;
  clock?: () => Date;
};

function stableItemKey(item: TvgidsTipSourceItem): string {
  return [
    item.sourceItemId,
    item.sourceUrl ?? '',
    item.channelName,
    item.startAt,
    item.endAt,
    item.title,
  ].join('\u0000');
}

function dedupeSourceItems(
  items: readonly TvgidsTipSourceItem[],
): { items: TvgidsTipSourceItem[]; duplicateCount: number } {
  const byId = new Map<string, TvgidsTipSourceItem>();
  let duplicateCount = 0;

  for (const item of items) {
    const existing = byId.get(item.sourceItemId);
    if (!existing) {
      byId.set(item.sourceItemId, item);
      continue;
    }

    duplicateCount += 1;
    if (stableItemKey(item) < stableItemKey(existing)) {
      byId.set(item.sourceItemId, item);
    }
  }

  return {
    items: [...byId.values()].sort((left, right) =>
      left.sourceItemId.localeCompare(right.sourceItemId),
    ),
    duplicateCount,
  };
}

function dedupeSignals(
  signals: readonly ProgrammeEditorialSignal[],
): { signals: ProgrammeEditorialSignal[]; duplicateCount: number } {
  const byProgramme = new Map<string, ProgrammeEditorialSignal>();
  let duplicateCount = 0;

  for (const signal of signals) {
    const existing = byProgramme.get(signal.programmeId);
    if (!existing) {
      byProgramme.set(signal.programmeId, signal);
      continue;
    }

    duplicateCount += 1;
    if (signal.sourceItemId.localeCompare(existing.sourceItemId) < 0) {
      byProgramme.set(signal.programmeId, signal);
    }
  }

  return {
    signals: [...byProgramme.values()].sort(
      (left, right) =>
        left.programmeId.localeCompare(right.programmeId) ||
        left.sourceItemId.localeCompare(right.sourceItemId),
    ),
    duplicateCount,
  };
}

function coverageKey(channelId: string, dayStartMs: number): string {
  return channelId + '\u0000' + String(dayStartMs);
}

export async function refreshTvgidsEditorialSignals(
  dependencies: RefreshDependencies,
): Promise<EditorialRefreshResult> {
  const refreshedAt = (dependencies.clock ?? (() => new Date()))().toISOString();
  const snapshot = await dependencies.source.fetchSnapshot();
  const deduped = dedupeSourceItems(snapshot.items);

  const diagnostics: EditorialRefreshDiagnostics = {
    feedItemsReceived: snapshot.items.length + snapshot.invalidItemCount,
    sourceBroadcastIdsExtracted: 0,
    tierAMatches: 0,
    tierBMatches: 0,
    tierCMatches: 0,
    ambiguous: 0,
    titleMismatches: 0,
    unsupportedChannels: 0,
    outsideScheduleCoverage: 0,
    invalidOrUndecodable: snapshot.invalidItemCount,
    duplicates: deduped.duplicateCount,
    unmatched: 0,
  };

  const mappedItems = deduped.items
    .map((item) => ({
      item,
      channelId: canonicalChannelIdForTvgidsName(item.channelName),
    }))
    .filter((entry) => {
      if (entry.channelId) return true;
      diagnostics.unsupportedChannels += 1;
      return false;
    });

  const coverageRequests = new Map<
    string,
    { channelId: string; dayStartMs: number }
  >();

  for (const { item, channelId } of mappedItems) {
    if (!channelId) continue;
    const dayStartMs = guideTelevisionDayStart(Date.parse(item.startAt));
    coverageRequests.set(coverageKey(channelId, dayStartMs), {
      channelId,
      dayStartMs,
    });
  }

  const schedules = new Map<
    string,
    Awaited<ReturnType<ScheduleRepository['getSchedule']>>
  >();

  await Promise.all(
    [...coverageRequests.entries()].map(async ([key, request]) => {
      const toMs = guideTelevisionDayStart(request.dayStartMs, 1);
      const schedule = await dependencies.scheduleRepository.getSchedule({
        from: new Date(request.dayStartMs).toISOString(),
        to: new Date(toMs).toISOString(),
        channelIds: [request.channelId],
      });
      schedules.set(key, schedule);
    }),
  );

  const matchedSignals: ProgrammeEditorialSignal[] = [];

  for (const { item, channelId } of mappedItems) {
    if (!channelId) continue;

    const dayStartMs = guideTelevisionDayStart(Date.parse(item.startAt));
    const schedule = schedules.get(coverageKey(channelId, dayStartMs));

    if (!schedule) {
      diagnostics.outsideScheduleCoverage += 1;
      continue;
    }

    const outcome = matchTvgidsTipToSchedule(item, channelId, schedule);
    if (outcome.titleMismatch) diagnostics.titleMismatches += 1;

    if (outcome.status === 'ambiguous') {
      diagnostics.ambiguous += 1;
      continue;
    }

    if (outcome.status === 'unmatched') {
      diagnostics.unmatched += 1;
      continue;
    }

    matchedSignals.push(outcome.signal);
    if (outcome.signal.matchedBy === 'source-id') diagnostics.tierAMatches += 1;
    if (outcome.signal.matchedBy === 'channel-title-start') diagnostics.tierBMatches += 1;
    if (outcome.signal.matchedBy === 'channel-exact-start') diagnostics.tierCMatches += 1;
  }

  const dedupedSignals = dedupeSignals(matchedSignals);
  diagnostics.duplicates += dedupedSignals.duplicateCount;

  const write = await dependencies.editorialRepository.replaceSourceSnapshot({
    source: 'tvgids',
    refreshedAt,
    signals: dedupedSignals.signals,
  });

  return {
    status: write.status,
    source: 'tvgids',
    refreshedAt,
    storedSignalCount: write.storedSignalCount,
    diagnostics,
  };
}
