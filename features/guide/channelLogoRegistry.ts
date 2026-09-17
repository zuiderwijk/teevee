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
    return { key: `local:${localKey}`, source: LOCAL_CHANNEL_LOGO_ASSETS[localKey] };
  }
  if (channel.logoUrl) {
    return { key: `remote:${channel.logoUrl}`, source: { uri: channel.logoUrl } };
  }
  return null;
}
