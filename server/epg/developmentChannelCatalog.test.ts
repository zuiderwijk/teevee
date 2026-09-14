import { describe, expect, it } from 'vitest';

import {
  DEVELOPMENT_CHANNELS,
  IPTV_EPG_NL_CHANNEL_MAPPINGS,
  IPTV_EPG_NL_PROVIDER_CHANNEL_IDS,
} from './developmentChannelCatalog';

describe('development channel catalog', () => {
  it('keeps Teevee canonical identities unique and ordered independently from provider IDs', () => {
    const canonicalIds = DEVELOPMENT_CHANNELS.map(({ id }) => id);
    const sortOrders = DEVELOPMENT_CHANNELS.map(({ sortOrder }) => sortOrder);

    expect(new Set(canonicalIds).size).toBe(canonicalIds.length);
    expect(sortOrders).toEqual([...sortOrders].sort((left, right) => left - right));
    expect(canonicalIds.every((id) => id.startsWith('nl-'))).toBe(true);
    expect(canonicalIds.some((id) => id.endsWith('.nl'))).toBe(false);
  });

  it('maps every selected provider channel exactly once to an existing canonical channel', () => {
    const canonicalIds = new Set(DEVELOPMENT_CHANNELS.map(({ id }) => id));
    const providerIds = IPTV_EPG_NL_CHANNEL_MAPPINGS.map(({ providerChannelId }) => providerChannelId);
    const mappedCanonicalIds = IPTV_EPG_NL_CHANNEL_MAPPINGS.map(({ channelId }) => channelId);

    expect(new Set(providerIds).size).toBe(providerIds.length);
    expect(new Set(mappedCanonicalIds).size).toBe(mappedCanonicalIds.length);
    expect(mappedCanonicalIds.every((id) => canonicalIds.has(id))).toBe(true);
    expect(IPTV_EPG_NL_PROVIDER_CHANNEL_IDS).toEqual(providerIds);
  });

  it('contains the verified core Netherlands provider IDs used by the vertical slice', () => {
    expect(IPTV_EPG_NL_PROVIDER_CHANNEL_IDS).toEqual([
      'NPO1.nl',
      'NPO2.nl',
      'NPO3.nl',
      'RTL4.nl',
      'RTL5.nl',
      'SBS6.nl',
      'RTL7.nl',
      'RTL8.nl',
      'Net5.nl',
      'VeronicaDisneyXD.nl',
      'SBS9.nl',
      'RTLZ.nl',
    ]);
  });
});
