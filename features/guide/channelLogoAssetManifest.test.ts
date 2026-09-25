import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CANONICAL_CHANNEL_CATALOG } from '@/data/domain/channelCatalog';

import {
  LOCAL_CHANNEL_LOGO_ASSET_PATHS,
  localChannelLogoAssetKeyForChannelId,
  localChannelLogoAssetPathForChannelId,
} from './channelLogoAssetManifest';

describe('canonical local channel logo manifest', () => {
  it('covers every canonical channel exactly once in canonical order', () => {
    const canonicalIds = CANONICAL_CHANNEL_CATALOG.map(({ id }) => id);
    const logoIds = Object.keys(LOCAL_CHANNEL_LOGO_ASSET_PATHS);

    expect(canonicalIds).toHaveLength(49);
    expect(logoIds).toEqual(canonicalIds);
    expect(new Set(logoIds).size).toBe(49);
  });

  it('maps every canonical id to its own local PNG path', () => {
    for (const { id } of CANONICAL_CHANNEL_CATALOG) {
      expect(localChannelLogoAssetKeyForChannelId(id)).toBe(id);
      expect(localChannelLogoAssetPathForChannelId(id)).toBe(
        `../../assets/channels/${id}.png`,
      );
    }
  });

  it('keeps unknown channels on the normal fallback path', () => {
    expect(localChannelLogoAssetKeyForChannelId('nl-unknown')).toBeNull();
    expect(localChannelLogoAssetPathForChannelId('nl-unknown')).toBeNull();
  });

  it('locks the final 49 local PNG bytes to SHA256SUMS with adequate intrinsic resolution', () => {
    const sumsUrl = new URL('../../assets/channels/SHA256SUMS', import.meta.url);
    const entries = readFileSync(sumsUrl, 'utf8')
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const match = line.match(/^([a-f0-9]{64})  (.+\.png)$/);
        expect(match, `Invalid SHA256SUMS line: ${line}`).not.toBeNull();
        return { hash: match![1]!, fileName: match![2]! };
      });

    const expectedFileNames = Object.keys(LOCAL_CHANNEL_LOGO_ASSET_PATHS)
      .map((channelId) => `${channelId}.png`)
      .sort();

    expect(entries.map(({ fileName }) => fileName)).toEqual(expectedFileNames);
    expect(new Set(entries.map(({ hash }) => hash)).size).toBe(49);

    for (const { hash, fileName } of entries) {
      const bytes = readFileSync(new URL(`../../assets/channels/${fileName}`, import.meta.url));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash);

      expect(bytes.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
      const width = bytes.readUInt32BE(16);
      const height = bytes.readUInt32BE(20);
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);

      // The smallest production identity box is 40x32 pt. A contain-fitted mark
      // must retain at least 3x intrinsic density on that box.
      const sourcePixelsPerPoint = 1 / Math.min(40 / width, 32 / height);
      expect(sourcePixelsPerPoint).toBeGreaterThanOrEqual(3);
    }
  });

});
