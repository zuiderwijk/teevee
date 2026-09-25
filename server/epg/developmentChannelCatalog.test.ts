import { describe, expect, it } from 'vitest';

import {
  DEVELOPMENT_CHANNELS,
  IPTV_EPG_BE_CHANNEL_MAPPINGS,
  IPTV_EPG_BE_CHANNELS,
  IPTV_EPG_BE_PROVIDER_CHANNEL_IDS,
  IPTV_EPG_NL_CHANNEL_MAPPINGS,
  IPTV_EPG_NL_CHANNELS,
  IPTV_EPG_NL_PROVIDER_CHANNEL_IDS,
} from './developmentChannelCatalog';

describe('development channel catalog', () => {
  it('keeps all 49 Teevee canonical identities unique and ordered independently from provider ids', () => {
    const canonicalIds = DEVELOPMENT_CHANNELS.map(({ id }) => id);
    const sortOrders = DEVELOPMENT_CHANNELS.map(({ sortOrder }) => sortOrder);

    expect(DEVELOPMENT_CHANNELS).toHaveLength(49);
    expect(new Set(canonicalIds).size).toBe(49);
    expect(sortOrders).toEqual(Array.from({ length: 49 }, (_, index) => index + 1));
    expect(canonicalIds.every((id) => id.startsWith('nl-') || id.startsWith('be-')))
      .toBe(true);
    expect(canonicalIds.some((id) => id.endsWith('.nl') || id.endsWith('.be')))
      .toBe(false);
  });

  it('maps all 49 canonical channels exactly once across the NL and BE sources', () => {
    const canonicalIds = new Set(DEVELOPMENT_CHANNELS.map(({ id }) => id));
    const mappings = [
      ...IPTV_EPG_NL_CHANNEL_MAPPINGS,
      ...IPTV_EPG_BE_CHANNEL_MAPPINGS,
    ];
    const providerIds = mappings.map(({ providerChannelId }) => providerChannelId);
    const mappedCanonicalIds = mappings.map(({ channelId }) => channelId);

    expect(IPTV_EPG_NL_CHANNEL_MAPPINGS).toHaveLength(36);
    expect(IPTV_EPG_BE_CHANNEL_MAPPINGS).toHaveLength(13);
    expect(mappings).toHaveLength(49);
    expect(new Set(providerIds).size).toBe(49);
    expect(new Set(mappedCanonicalIds).size).toBe(49);
    expect(mappedCanonicalIds.every((id) => canonicalIds.has(id))).toBe(true);
    expect(new Set(mappedCanonicalIds)).toEqual(canonicalIds);
    expect(IPTV_EPG_NL_CHANNELS).toHaveLength(36);
    expect(IPTV_EPG_BE_CHANNELS).toHaveLength(13);
  });

  it('keeps renamed provider vocabulary at the adapter boundary', () => {
    expect(IPTV_EPG_NL_CHANNEL_MAPPINGS).toEqual(
      expect.arrayContaining([
        { providerChannelId: 'FOX.nl', channelId: 'nl-star-channel' },
        { providerChannelId: 'BBCFirst.nl', channelId: 'nl-bbc-nl' },
        {
          providerChannelId: 'VeronicaDisneyXD.nl',
          channelId: 'nl-veronica-disney-xd',
        },
      ]),
    );
    expect(IPTV_EPG_BE_CHANNEL_MAPPINGS).toEqual(
      expect.arrayContaining([
        { providerChannelId: 'Play4.be', channelId: 'be-play' },
        { providerChannelId: 'Play5.be', channelId: 'be-play-fictie' },
        { providerChannelId: 'Play6.be', channelId: 'be-play-actie' },
        { providerChannelId: 'Play7.be', channelId: 'be-play-reality' },
      ]),
    );
  });

  it('uses the empirically observed provider ids for each source', () => {
    expect(IPTV_EPG_NL_PROVIDER_CHANNEL_IDS).toHaveLength(36);
    expect(IPTV_EPG_NL_PROVIDER_CHANNEL_IDS).toEqual(
      expect.arrayContaining([
        'NPO1.nl',
        'RTL4.nl',
        'FOX.nl',
        'ZiggoSport6.nl',
        'ESPN4.nl',
        'BBCFirst.nl',
        'BBCTwo.nl',
      ]),
    );
    expect(IPTV_EPG_BE_PROVIDER_CHANNEL_IDS).toEqual([
      'VRT1.be',
      'VRTCANVAS.be',
      'vtm.be',
      'Play4.be',
      'Play5.be',
      'VTM2.be',
      'VTM3.be',
      'VTM4.be',
      'Play6.be',
      'Play7.be',
      'PlayCrime.be',
      'VTMGOLD.be',
      'Ketnet.be',
    ]);
  });
});
