import { describe, expect, it } from 'vitest';

import {
  localChannelLogoAssetKeyForChannelId,
  localChannelLogoAssetPathForChannelId,
} from './channelLogoAssetManifest';

const expected = [
  ['nl-npo-1', '../../assets/channels/nl-npo-1.png'],
  ['nl-npo-2', '../../assets/channels/nl-npo-2.png'],
  ['nl-npo-3', '../../assets/channels/nl-npo-3.png'],
  ['nl-rtl-4', '../../assets/channels/nl-rtl-4.png'],
  ['nl-rtl-5', '../../assets/channels/nl-rtl-5.png'],
  ['nl-sbs-6', '../../assets/channels/nl-sbs-6.png'],
] as const;

describe('canonical local channel logo manifest', () => {
  it.each(expected)('resolves %s to its Teevee-owned local asset', (channelId, path) => {
    expect(localChannelLogoAssetKeyForChannelId(channelId)).toBe(channelId);
    expect(localChannelLogoAssetPathForChannelId(channelId)).toBe(path);
  });

  it('keeps unknown channels on the normal fallback path', () => {
    expect(localChannelLogoAssetKeyForChannelId('nl-unknown')).toBeNull();
    expect(localChannelLogoAssetPathForChannelId('nl-unknown')).toBeNull();
  });
});
