export const LOCAL_CHANNEL_LOGO_ASSET_PATHS = {
  'nl-npo-1': '../../assets/channels/nl-npo-1.png',
  'nl-npo-2': '../../assets/channels/nl-npo-2.png',
  'nl-npo-3': '../../assets/channels/nl-npo-3.png',
  'nl-rtl-4': '../../assets/channels/nl-rtl-4.png',
  'nl-rtl-5': '../../assets/channels/nl-rtl-5.png',
  'nl-sbs-6': '../../assets/channels/nl-sbs-6.png',
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
