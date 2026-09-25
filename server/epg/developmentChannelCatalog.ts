import { CANONICAL_CHANNEL_CATALOG } from '../../data/domain/channelCatalog.ts';

import type { ChannelMapping } from './provider';

/**
 * Teevee-owned canonical catalog for the development EPG source configuration.
 *
 * Provider records remain explicit adapter vocabulary. Existing canonical IDs are
 * preserved even when provider/brand naming changes.
 */
export const DEVELOPMENT_CHANNELS = CANONICAL_CHANNEL_CATALOG;

export const IPTV_EPG_NL_CHANNEL_MAPPINGS = [
  { providerChannelId: 'NPO1.nl', channelId: 'nl-npo-1' },
  { providerChannelId: 'NPO2.nl', channelId: 'nl-npo-2' },
  { providerChannelId: 'NPO3.nl', channelId: 'nl-npo-3' },
  { providerChannelId: 'RTL4.nl', channelId: 'nl-rtl-4' },
  { providerChannelId: 'RTL5.nl', channelId: 'nl-rtl-5' },
  { providerChannelId: 'SBS6.nl', channelId: 'nl-sbs-6' },
  { providerChannelId: 'RTL7.nl', channelId: 'nl-rtl-7' },
  { providerChannelId: 'VeronicaDisneyXD.nl', channelId: 'nl-veronica-disney-xd' },
  { providerChannelId: 'Net5.nl', channelId: 'nl-net-5' },
  { providerChannelId: 'RTL8.nl', channelId: 'nl-rtl-8' },
  { providerChannelId: 'FOX.nl', channelId: 'nl-star-channel' },
  { providerChannelId: 'SBS9.nl', channelId: 'nl-sbs-9' },
  { providerChannelId: 'ParamountNetwork.nl', channelId: 'nl-paramount-network' },
  { providerChannelId: 'ZiggoSport.nl', channelId: 'nl-ziggo-sport' },
  { providerChannelId: 'ZiggoSport2.nl', channelId: 'nl-ziggo-sport-2' },
  { providerChannelId: 'ZiggoSport3.nl', channelId: 'nl-ziggo-sport-3' },
  { providerChannelId: 'ZiggoSport4.nl', channelId: 'nl-ziggo-sport-4' },
  { providerChannelId: 'ZiggoSport5.nl', channelId: 'nl-ziggo-sport-5' },
  { providerChannelId: 'ZiggoSport6.nl', channelId: 'nl-ziggo-sport-6' },
  { providerChannelId: 'ESPN.nl', channelId: 'nl-espn' },
  { providerChannelId: 'ESPN2.nl', channelId: 'nl-espn-2' },
  { providerChannelId: 'ESPN3.nl', channelId: 'nl-espn-3' },
  { providerChannelId: 'ESPN4.nl', channelId: 'nl-espn-4' },
  { providerChannelId: 'ViaplayTV.nl', channelId: 'nl-viaplay-tv' },
  { providerChannelId: 'RTLZ.nl', channelId: 'nl-rtl-z' },
  { providerChannelId: 'TLC.nl', channelId: 'nl-tlc' },
  { providerChannelId: 'ComedyCentral.nl', channelId: 'nl-comedy-central' },
  { providerChannelId: '24Kitchen.nl', channelId: 'nl-24kitchen' },
  { providerChannelId: 'Eurosport1.nl', channelId: 'nl-eurosport-1' },
  { providerChannelId: 'Eurosport2.nl', channelId: 'nl-eurosport-2' },
  { providerChannelId: 'Discovery.nl', channelId: 'nl-discovery' },
  { providerChannelId: 'NationalGeographicChannel.nl', channelId: 'nl-national-geographic' },
  { providerChannelId: 'History.nl', channelId: 'nl-history' },
  { providerChannelId: 'BBCFirst.nl', channelId: 'nl-bbc-nl' },
  { providerChannelId: 'BBCOne.nl', channelId: 'nl-bbc-one' },
  { providerChannelId: 'BBCTwo.nl', channelId: 'nl-bbc-two' },
] as const satisfies readonly ChannelMapping[];

export const IPTV_EPG_BE_CHANNEL_MAPPINGS = [
  { providerChannelId: 'VRT1.be', channelId: 'be-vrt-1' },
  { providerChannelId: 'VRTCANVAS.be', channelId: 'be-vrt-canvas' },
  { providerChannelId: 'vtm.be', channelId: 'be-vtm' },
  { providerChannelId: 'Play4.be', channelId: 'be-play' },
  { providerChannelId: 'Play5.be', channelId: 'be-play-fictie' },
  { providerChannelId: 'VTM2.be', channelId: 'be-vtm-2' },
  { providerChannelId: 'VTM3.be', channelId: 'be-vtm-3' },
  { providerChannelId: 'VTM4.be', channelId: 'be-vtm-4' },
  { providerChannelId: 'Play6.be', channelId: 'be-play-actie' },
  { providerChannelId: 'Play7.be', channelId: 'be-play-reality' },
  { providerChannelId: 'PlayCrime.be', channelId: 'be-play-crime' },
  { providerChannelId: 'VTMGOLD.be', channelId: 'be-vtm-gold' },
  { providerChannelId: 'Ketnet.be', channelId: 'be-ketnet' },
] as const satisfies readonly ChannelMapping[];

function canonicalChannelsForMappings(mappings: readonly ChannelMapping[]) {
  const ids = new Set(mappings.map(({ channelId }) => channelId));
  return DEVELOPMENT_CHANNELS.filter(({ id }) => ids.has(id));
}

export const IPTV_EPG_NL_CHANNELS = canonicalChannelsForMappings(
  IPTV_EPG_NL_CHANNEL_MAPPINGS,
);
export const IPTV_EPG_BE_CHANNELS = canonicalChannelsForMappings(
  IPTV_EPG_BE_CHANNEL_MAPPINGS,
);

export const IPTV_EPG_NL_PROVIDER_CHANNEL_IDS = IPTV_EPG_NL_CHANNEL_MAPPINGS.map(
  ({ providerChannelId }) => providerChannelId,
);
export const IPTV_EPG_BE_PROVIDER_CHANNEL_IDS = IPTV_EPG_BE_CHANNEL_MAPPINGS.map(
  ({ providerChannelId }) => providerChannelId,
);
