import type { Channel } from '../../data/domain/epg.ts';

const TVGIDS_CHANNELS = new Map<string, Channel['id']>([
  ['npo 1', 'nl-npo-1'],
  ['npo 2', 'nl-npo-2'],
  ['npo 3', 'nl-npo-3'],
  ['rtl 4', 'nl-rtl-4'],
  ['rtl 5', 'nl-rtl-5'],
  ['rtl 7', 'nl-rtl-7'],
  ['rtl 8', 'nl-rtl-8'],
  ['rtl z', 'nl-rtl-z'],
  ['sbs6', 'nl-sbs-6'],
  ['sbs 6', 'nl-sbs-6'],
  ['sbs9', 'nl-sbs-9'],
  ['sbs 9', 'nl-sbs-9'],
  ['net5', 'nl-net-5'],
  ['net 5', 'nl-net-5'],
  ['veronica', 'nl-veronica-disney-xd'],
  ['veronica / disney xd', 'nl-veronica-disney-xd'],
]);

function normalizedChannelName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function canonicalChannelIdForTvgidsName(
  channelName: string,
): Channel['id'] | null {
  return TVGIDS_CHANNELS.get(normalizedChannelName(channelName)) ?? null;
}
