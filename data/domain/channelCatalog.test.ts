import { describe, expect, it } from 'vitest';

import {
  CANONICAL_CHANNEL_CATALOG,
  canonicalActiveChannels,
} from './channelCatalog';

const expected = [
  ['nl-npo-1', 'NPO 1'],
  ['nl-npo-2', 'NPO 2'],
  ['nl-npo-3', 'NPO 3'],
  ['nl-rtl-4', 'RTL 4'],
  ['nl-rtl-5', 'RTL 5'],
  ['nl-sbs-6', 'SBS6'],
  ['nl-rtl-7', 'RTL 7'],
  ['nl-veronica-disney-xd', 'Veronica'],
  ['nl-net-5', 'Net5'],
  ['nl-rtl-8', 'RTL 8'],
  ['nl-star-channel', 'STAR Channel'],
  ['nl-sbs-9', 'SBS9'],
  ['nl-paramount-network', 'Paramount Network'],
  ['nl-ziggo-sport', 'Ziggo Sport'],
  ['nl-ziggo-sport-2', 'Ziggo Sport 2'],
  ['nl-ziggo-sport-3', 'Ziggo Sport 3'],
  ['nl-ziggo-sport-4', 'Ziggo Sport 4'],
  ['nl-ziggo-sport-5', 'Ziggo Sport 5'],
  ['nl-ziggo-sport-6', 'Ziggo Sport 6'],
  ['nl-espn', 'ESPN'],
  ['nl-espn-2', 'ESPN 2'],
  ['nl-espn-3', 'ESPN 3'],
  ['nl-espn-4', 'ESPN 4'],
  ['nl-viaplay-tv', 'Viaplay TV'],
  ['nl-rtl-z', 'RTL Z'],
  ['nl-tlc', 'TLC'],
  ['nl-comedy-central', 'Comedy Central'],
  ['nl-24kitchen', '24Kitchen'],
  ['nl-eurosport-1', 'Eurosport 1'],
  ['nl-eurosport-2', 'Eurosport 2'],
  ['nl-discovery', 'Discovery'],
  ['nl-national-geographic', 'National Geographic'],
  ['nl-history', 'History'],
  ['nl-bbc-nl', 'BBC NL'],
  ['nl-bbc-one', 'BBC One'],
  ['nl-bbc-two', 'BBC Two'],
  ['be-vrt-1', 'VRT 1'],
  ['be-vrt-canvas', 'VRT Canvas'],
  ['be-vtm', 'VTM'],
  ['be-play', 'Play'],
  ['be-play-fictie', 'Play Fictie'],
  ['be-vtm-2', 'VTM2'],
  ['be-vtm-3', 'VTM3'],
  ['be-vtm-4', 'VTM4'],
  ['be-play-actie', 'Play Actie'],
  ['be-play-reality', 'Play Reality'],
  ['be-play-crime', 'Play Crime'],
  ['be-vtm-gold', 'VTM Gold'],
  ['be-ketnet', 'Ketnet'],
] as const;

describe('canonical channel catalog', () => {
  it('matches the owner-approved 49-channel default lineup exactly', () => {
    const active = canonicalActiveChannels(CANONICAL_CHANNEL_CATALOG);

    expect(active).toHaveLength(49);
    expect(active.map(({ id, displayName, sortOrder }) => [
      id,
      displayName,
      sortOrder,
    ])).toEqual(
      expected.map(([id, displayName], index) => [
        id,
        displayName,
        index + 1,
      ]),
    );
  });

  it('keeps canonical identity unique and provider-independent', () => {
    const ids = CANONICAL_CHANNEL_CATALOG.map(({ id }) => id);
    expect(new Set(ids).size).toBe(49);
    expect(ids.every((id) => !id.endsWith('.nl') && !id.endsWith('.be'))).toBe(true);
  });

  it('preserves the already-shipped Veronica canonical id across the display-name update', () => {
    const veronica = CANONICAL_CHANNEL_CATALOG.find(
      ({ id }) => id === 'nl-veronica-disney-xd',
    );
    expect(veronica).toMatchObject({
      displayName: 'Veronica',
      shortName: 'Veronica',
      sortOrder: 8,
    });
  });
});
