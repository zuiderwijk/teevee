export const LOCAL_CHANNEL_LOGO_ASSET_PATHS = {
  'nl-npo-1': '../../assets/channels/nl-npo-1.png',
  'nl-npo-2': '../../assets/channels/nl-npo-2.png',
  'nl-npo-3': '../../assets/channels/nl-npo-3.png',
  'nl-rtl-4': '../../assets/channels/nl-rtl-4.png',
  'nl-rtl-5': '../../assets/channels/nl-rtl-5.png',
  'nl-sbs-6': '../../assets/channels/nl-sbs-6.png',
  'nl-rtl-7': '../../assets/channels/nl-rtl-7.png',
  'nl-veronica-disney-xd': '../../assets/channels/nl-veronica-disney-xd.png',
  'nl-net-5': '../../assets/channels/nl-net-5.png',
  'nl-rtl-8': '../../assets/channels/nl-rtl-8.png',
  'nl-star-channel': '../../assets/channels/nl-star-channel.png',
  'nl-sbs-9': '../../assets/channels/nl-sbs-9.png',
  'nl-paramount-network': '../../assets/channels/nl-paramount-network.png',
  'nl-ziggo-sport': '../../assets/channels/nl-ziggo-sport.png',
  'nl-ziggo-sport-2': '../../assets/channels/nl-ziggo-sport-2.png',
  'nl-ziggo-sport-3': '../../assets/channels/nl-ziggo-sport-3.png',
  'nl-ziggo-sport-4': '../../assets/channels/nl-ziggo-sport-4.png',
  'nl-ziggo-sport-5': '../../assets/channels/nl-ziggo-sport-5.png',
  'nl-ziggo-sport-6': '../../assets/channels/nl-ziggo-sport-6.png',
  'nl-espn': '../../assets/channels/nl-espn.png',
  'nl-espn-2': '../../assets/channels/nl-espn-2.png',
  'nl-espn-3': '../../assets/channels/nl-espn-3.png',
  'nl-espn-4': '../../assets/channels/nl-espn-4.png',
  'nl-viaplay-tv': '../../assets/channels/nl-viaplay-tv.png',
  'nl-rtl-z': '../../assets/channels/nl-rtl-z.png',
  'nl-tlc': '../../assets/channels/nl-tlc.png',
  'nl-comedy-central': '../../assets/channels/nl-comedy-central.png',
  'nl-24kitchen': '../../assets/channels/nl-24kitchen.png',
  'nl-eurosport-1': '../../assets/channels/nl-eurosport-1.png',
  'nl-eurosport-2': '../../assets/channels/nl-eurosport-2.png',
  'nl-discovery': '../../assets/channels/nl-discovery.png',
  'nl-national-geographic': '../../assets/channels/nl-national-geographic.png',
  'nl-history': '../../assets/channels/nl-history.png',
  'nl-bbc-nl': '../../assets/channels/nl-bbc-nl.png',
  'nl-bbc-one': '../../assets/channels/nl-bbc-one.png',
  'nl-bbc-two': '../../assets/channels/nl-bbc-two.png',
  'be-vrt-1': '../../assets/channels/be-vrt-1.png',
  'be-vrt-canvas': '../../assets/channels/be-vrt-canvas.png',
  'be-vtm': '../../assets/channels/be-vtm.png',
  'be-play': '../../assets/channels/be-play.png',
  'be-play-fictie': '../../assets/channels/be-play-fictie.png',
  'be-vtm-2': '../../assets/channels/be-vtm-2.png',
  'be-vtm-3': '../../assets/channels/be-vtm-3.png',
  'be-vtm-4': '../../assets/channels/be-vtm-4.png',
  'be-play-actie': '../../assets/channels/be-play-actie.png',
  'be-play-reality': '../../assets/channels/be-play-reality.png',
  'be-play-crime': '../../assets/channels/be-play-crime.png',
  'be-vtm-gold': '../../assets/channels/be-vtm-gold.png',
  'be-ketnet': '../../assets/channels/be-ketnet.png',
} as const;

export type LocalChannelLogoAssetKey = keyof typeof LOCAL_CHANNEL_LOGO_ASSET_PATHS;

export function localChannelLogoAssetKeyForChannelId(channelId: string): LocalChannelLogoAssetKey | null {
  return Object.prototype.hasOwnProperty.call(LOCAL_CHANNEL_LOGO_ASSET_PATHS, channelId)
    ? (channelId as LocalChannelLogoAssetKey)
    : null;
}

export function localChannelLogoAssetPathForChannelId(channelId: string) {
  const key = localChannelLogoAssetKeyForChannelId(channelId);
  return key ? LOCAL_CHANNEL_LOGO_ASSET_PATHS[key] : null;
}
