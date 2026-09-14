import type { Channel } from '@/data/domain/epg';

import type { ChannelMapping } from './provider';

/**
 * Small real-channel catalog for the Phase 3 development vertical slice.
 *
 * These are Teevee-owned canonical IDs, deliberately separate from the synthetic
 * mobile fixture (`channel-1` ... `channel-48`) and from provider channel IDs.
 * The provider mapping below may be replaced without changing these IDs.
 */
export const DEVELOPMENT_CHANNELS = [
  { id: 'nl-npo-1', name: 'NPO 1', displayName: 'NPO 1', shortName: 'NPO 1', sortOrder: 1, isActive: true },
  { id: 'nl-npo-2', name: 'NPO 2', displayName: 'NPO 2', shortName: 'NPO 2', sortOrder: 2, isActive: true },
  { id: 'nl-npo-3', name: 'NPO 3', displayName: 'NPO 3', shortName: 'NPO 3', sortOrder: 3, isActive: true },
  { id: 'nl-rtl-4', name: 'RTL 4', displayName: 'RTL 4', shortName: 'RTL 4', sortOrder: 4, isActive: true },
  { id: 'nl-rtl-5', name: 'RTL 5', displayName: 'RTL 5', shortName: 'RTL 5', sortOrder: 5, isActive: true },
  { id: 'nl-sbs-6', name: 'SBS6', displayName: 'SBS6', shortName: 'SBS6', sortOrder: 6, isActive: true },
  { id: 'nl-rtl-7', name: 'RTL 7', displayName: 'RTL 7', shortName: 'RTL 7', sortOrder: 7, isActive: true },
  { id: 'nl-rtl-8', name: 'RTL 8', displayName: 'RTL 8', shortName: 'RTL 8', sortOrder: 8, isActive: true },
  { id: 'nl-net-5', name: 'Net5', displayName: 'Net5', shortName: 'Net5', sortOrder: 9, isActive: true },
  {
    id: 'nl-veronica-disney-xd',
    name: 'Veronica / Disney XD',
    displayName: 'Veronica / Disney XD',
    shortName: 'Veronica',
    sortOrder: 10,
    isActive: true,
  },
  { id: 'nl-sbs-9', name: 'SBS9', displayName: 'SBS9', shortName: 'SBS9', sortOrder: 11, isActive: true },
  { id: 'nl-rtl-z', name: 'RTL Z', displayName: 'RTL Z', shortName: 'RTL Z', sortOrder: 12, isActive: true },
] as const satisfies readonly Channel[];

/**
 * IDs were observed directly in the fetched IPTV-EPG.org Netherlands XMLTV payload
 * on 2026-09-14 (temporary inspection PR #43). Never infer provider IDs from names.
 */
export const IPTV_EPG_NL_CHANNEL_MAPPINGS = [
  { providerChannelId: 'NPO1.nl', channelId: 'nl-npo-1' },
  { providerChannelId: 'NPO2.nl', channelId: 'nl-npo-2' },
  { providerChannelId: 'NPO3.nl', channelId: 'nl-npo-3' },
  { providerChannelId: 'RTL4.nl', channelId: 'nl-rtl-4' },
  { providerChannelId: 'RTL5.nl', channelId: 'nl-rtl-5' },
  { providerChannelId: 'SBS6.nl', channelId: 'nl-sbs-6' },
  { providerChannelId: 'RTL7.nl', channelId: 'nl-rtl-7' },
  { providerChannelId: 'RTL8.nl', channelId: 'nl-rtl-8' },
  { providerChannelId: 'Net5.nl', channelId: 'nl-net-5' },
  { providerChannelId: 'VeronicaDisneyXD.nl', channelId: 'nl-veronica-disney-xd' },
  { providerChannelId: 'SBS9.nl', channelId: 'nl-sbs-9' },
  { providerChannelId: 'RTLZ.nl', channelId: 'nl-rtl-z' },
] as const satisfies readonly ChannelMapping[];

export const IPTV_EPG_NL_PROVIDER_CHANNEL_IDS = IPTV_EPG_NL_CHANNEL_MAPPINGS.map(
  ({ providerChannelId }) => providerChannelId,
);
