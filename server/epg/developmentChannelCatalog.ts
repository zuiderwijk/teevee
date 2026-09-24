import { CANONICAL_CHANNEL_CATALOG } from '@/data/domain/channelCatalog';

import type { ChannelMapping } from './provider';

/**
 * Small real-channel catalog for the Phase 3 development vertical slice.
 *
 * These are Teevee-owned canonical IDs, deliberately separate from the synthetic
 * mobile fixture (`channel-1` ... `channel-48`) and from provider channel IDs.
 * The provider mapping below may be replaced without changing these IDs.
 */
export const DEVELOPMENT_CHANNELS = CANONICAL_CHANNEL_CATALOG;

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
