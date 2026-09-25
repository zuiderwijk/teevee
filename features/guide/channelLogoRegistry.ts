import type { ImageSourcePropType } from 'react-native';

import type { Channel } from '@/data/domain/epg';

import {
  localChannelLogoAssetKeyForChannelId,
  type LocalChannelLogoAssetKey,
} from './channelLogoAssetManifest';

const LOCAL_CHANNEL_LOGO_ASSETS: Record<LocalChannelLogoAssetKey, ImageSourcePropType> = {
  'nl-npo-1': require('../../assets/channels/nl-npo-1.png'),
  'nl-npo-2': require('../../assets/channels/nl-npo-2.png'),
  'nl-npo-3': require('../../assets/channels/nl-npo-3.png'),
  'nl-rtl-4': require('../../assets/channels/nl-rtl-4.png'),
  'nl-rtl-5': require('../../assets/channels/nl-rtl-5.png'),
  'nl-sbs-6': require('../../assets/channels/nl-sbs-6.png'),
  'nl-rtl-7': require('../../assets/channels/nl-rtl-7.png'),
  'nl-veronica-disney-xd': require('../../assets/channels/nl-veronica-disney-xd.png'),
  'nl-net-5': require('../../assets/channels/nl-net-5.png'),
  'nl-rtl-8': require('../../assets/channels/nl-rtl-8.png'),
  'nl-star-channel': require('../../assets/channels/nl-star-channel.png'),
  'nl-sbs-9': require('../../assets/channels/nl-sbs-9.png'),
  'nl-paramount-network': require('../../assets/channels/nl-paramount-network.png'),
  'nl-ziggo-sport': require('../../assets/channels/nl-ziggo-sport.png'),
  'nl-ziggo-sport-2': require('../../assets/channels/nl-ziggo-sport-2.png'),
  'nl-ziggo-sport-3': require('../../assets/channels/nl-ziggo-sport-3.png'),
  'nl-ziggo-sport-4': require('../../assets/channels/nl-ziggo-sport-4.png'),
  'nl-ziggo-sport-5': require('../../assets/channels/nl-ziggo-sport-5.png'),
  'nl-ziggo-sport-6': require('../../assets/channels/nl-ziggo-sport-6.png'),
  'nl-espn': require('../../assets/channels/nl-espn.png'),
  'nl-espn-2': require('../../assets/channels/nl-espn-2.png'),
  'nl-espn-3': require('../../assets/channels/nl-espn-3.png'),
  'nl-espn-4': require('../../assets/channels/nl-espn-4.png'),
  'nl-viaplay-tv': require('../../assets/channels/nl-viaplay-tv.png'),
  'nl-rtl-z': require('../../assets/channels/nl-rtl-z.png'),
  'nl-tlc': require('../../assets/channels/nl-tlc.png'),
  'nl-comedy-central': require('../../assets/channels/nl-comedy-central.png'),
  'nl-24kitchen': require('../../assets/channels/nl-24kitchen.png'),
  'nl-eurosport-1': require('../../assets/channels/nl-eurosport-1.png'),
  'nl-eurosport-2': require('../../assets/channels/nl-eurosport-2.png'),
  'nl-discovery': require('../../assets/channels/nl-discovery.png'),
  'nl-national-geographic': require('../../assets/channels/nl-national-geographic.png'),
  'nl-history': require('../../assets/channels/nl-history.png'),
  'nl-bbc-nl': require('../../assets/channels/nl-bbc-nl.png'),
  'nl-bbc-one': require('../../assets/channels/nl-bbc-one.png'),
  'nl-bbc-two': require('../../assets/channels/nl-bbc-two.png'),
  'be-vrt-1': require('../../assets/channels/be-vrt-1.png'),
  'be-vrt-canvas': require('../../assets/channels/be-vrt-canvas.png'),
  'be-vtm': require('../../assets/channels/be-vtm.png'),
  'be-play': require('../../assets/channels/be-play.png'),
  'be-play-fictie': require('../../assets/channels/be-play-fictie.png'),
  'be-vtm-2': require('../../assets/channels/be-vtm-2.png'),
  'be-vtm-3': require('../../assets/channels/be-vtm-3.png'),
  'be-vtm-4': require('../../assets/channels/be-vtm-4.png'),
  'be-play-actie': require('../../assets/channels/be-play-actie.png'),
  'be-play-reality': require('../../assets/channels/be-play-reality.png'),
  'be-play-crime': require('../../assets/channels/be-play-crime.png'),
  'be-vtm-gold': require('../../assets/channels/be-vtm-gold.png'),
  'be-ketnet': require('../../assets/channels/be-ketnet.png'),
};

export type ResolvedChannelLogo = {
  key: string;
  source: ImageSourcePropType;
};

export function resolveChannelLogo(
  channel: Pick<Channel, 'id' | 'logoUrl'>,
): ResolvedChannelLogo | null {
  const localKey = localChannelLogoAssetKeyForChannelId(channel.id);
  if (localKey) {
    return {
      key: `local:${localKey}`,
      source: LOCAL_CHANNEL_LOGO_ASSETS[localKey],
    };
  }
  if (channel.logoUrl) {
    return {
      key: `remote:${channel.logoUrl}`,
      source: { uri: channel.logoUrl },
    };
  }
  return null;
}
