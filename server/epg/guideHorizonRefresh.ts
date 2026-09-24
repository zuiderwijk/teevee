import type { Channel } from '../../data/domain/epg.ts';
import { guideTelevisionDayStart } from '../../data/domain/guideTime.ts';

import { ingestProviderSchedule } from './ingest.ts';
import type { ChannelMapping, EpgProvider } from './provider.ts';
import type { ScheduleRepository } from './scheduleRepository.ts';

export const GUIDE_REFRESH_MIN_DAY_OFFSET = -3;
export const GUIDE_REFRESH_MAX_DAY_OFFSET = 8;

export type GuideRefreshWindow = {
  offset: number;
  from: string;
  to: string;
};

export type GuideHorizonRefreshResult = GuideRefreshWindow & {
  result: Awaited<ReturnType<typeof ingestProviderSchedule>>;
};

/**
 * Refresh one safety-buffered hosted Guide horizon using television-day windows.
 *
 * Product navigation is D-2..D+7. Totaal composes adjacent television-day reads for
 * continuity when the following day remains inside that visible horizon. D-3 and D+8
 * are backend safety buffers only; they do not expand the selectable product horizon.
 */
export function guideRefreshWindows(anchorMs: number): GuideRefreshWindow[] {
  const windows: GuideRefreshWindow[] = [];
  for (
    let offset = GUIDE_REFRESH_MIN_DAY_OFFSET;
    offset <= GUIDE_REFRESH_MAX_DAY_OFFSET;
    offset += 1
  ) {
    windows.push({
      offset,
      from: new Date(guideTelevisionDayStart(anchorMs, offset)).toISOString(),
      to: new Date(guideTelevisionDayStart(anchorMs, offset + 1)).toISOString(),
    });
  }
  return windows;
}

export async function refreshGuideHorizon(input: {
  provider: EpgProvider;
  repository: ScheduleRepository;
  canonicalChannels: Channel[];
  channelMappings: ChannelMapping[];
  providerChannelIds: string[];
  anchorMs?: number;
  clock?: () => Date;
}): Promise<GuideHorizonRefreshResult[]> {
  const observedAt = input.clock?.() ?? new Date();
  const anchorMs = input.anchorMs ?? observedAt.getTime();
  const windows = guideRefreshWindows(anchorMs);
  const results: GuideHorizonRefreshResult[] = [];
  const providerBatches = input.provider.getSchedules
    ? await input.provider.getSchedules(
        windows.map((window) => ({
          from: new Date(window.from),
          to: new Date(window.to),
          channelIds: input.providerChannelIds,
        })),
      )
    : null;

  if (providerBatches && providerBatches.length !== windows.length) {
    throw new Error('Provider session returned an unexpected guide-horizon batch count');
  }

  for (const [index, window] of windows.entries()) {
    const result = await ingestProviderSchedule({
      provider: input.provider,
      repository: input.repository,
      canonicalChannels: input.canonicalChannels,
      channelMappings: input.channelMappings,
      providerChannelIds: input.providerChannelIds,
      ...(providerBatches ? { providerBatch: providerBatches[index] } : {}),
      from: new Date(window.from),
      to: new Date(window.to),
      clock: () => observedAt,
    });
    results.push({ ...window, result });
  }

  return results;
}
