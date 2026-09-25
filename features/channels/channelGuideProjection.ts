import type { Channel, GuideSchedule } from '@/data/domain/epg';

function projectedChannels(
  channels: readonly Channel[],
  selectedChannelIds: readonly string[] | null,
  transientChannelIds: readonly string[],
): Channel[] {
  if (selectedChannelIds === null) return [...channels];

  const byId = new Map(channels.map((channel) => [channel.id, channel]));
  const orderedIds = [
    ...selectedChannelIds,
    ...transientChannelIds.filter((id) => !selectedChannelIds.includes(id)),
  ];
  const projected = orderedIds
    .map((id) => byId.get(id))
    .filter((channel): channel is Channel => channel !== undefined);

  // The deterministic fixture deliberately uses non-canonical synthetic IDs.
  // Never turn that accepted startup/offline fallback into an empty Guide while
  // waiting for the canonical hosted schedule.
  return projected.length > 0 ? projected : [...channels];
}

export function projectGuideScheduleChannels(
  schedule: GuideSchedule,
  selectedChannelIds: readonly string[] | null,
  transientChannelIds: readonly string[] = [],
): GuideSchedule {
  if (selectedChannelIds === null && transientChannelIds.length === 0) {
    return schedule;
  }

  const channels = projectedChannels(
    schedule.channels,
    selectedChannelIds,
    transientChannelIds,
  );
  if (
    channels.length === schedule.channels.length &&
    channels.every((channel, index) => channel.id === schedule.channels[index]?.id)
  ) {
    return schedule;
  }

  const visibleIds = new Set(channels.map(({ id }) => id));
  return {
    ...schedule,
    channels,
    programmes: schedule.programmes.filter(({ channelId }) =>
      visibleIds.has(channelId),
    ),
  };
}

export function projectGuidePresentation<
  T extends { channels: Channel[]; schedule: GuideSchedule | null },
>(
  presentation: T,
  selectedChannelIds: readonly string[] | null,
  transientChannelIds: readonly string[] = [],
): T {
  const channels = projectedChannels(
    presentation.channels,
    selectedChannelIds,
    transientChannelIds,
  );
  const schedule = presentation.schedule
    ? projectGuideScheduleChannels(
        presentation.schedule,
        selectedChannelIds,
        transientChannelIds,
      )
    : null;

  if (
    schedule === presentation.schedule &&
    channels.length === presentation.channels.length &&
    channels.every((channel, index) => channel.id === presentation.channels[index]?.id)
  ) {
    return presentation;
  }

  return { ...presentation, channels, schedule };
}
