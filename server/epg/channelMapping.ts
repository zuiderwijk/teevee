import type { Channel } from '@/data/domain/epg';

import { dataQualityDiagnostic, type DataQualityDiagnostic } from './diagnostics.ts';
import type { ChannelMapping } from './provider';

export type ResolvedChannelMappings = {
  mappings: ChannelMapping[];
  diagnostics: DataQualityDiagnostic[];
};

/**
 * Resolves provider -> Teevee channel mappings conservatively.
 * Any repeated provider id is considered ambiguous and excluded, even when the
 * repeated rows happen to point to the same canonical channel.
 */
export function resolveChannelMappings(
  canonicalChannels: Channel[],
  channelMappings: ChannelMapping[],
): ResolvedChannelMappings {
  const canonicalById = new Map<Channel['id'], Channel>();
  for (const channel of canonicalChannels) {
    if (canonicalById.has(channel.id)) {
      throw new Error(`Duplicate canonical channel id: ${channel.id}`);
    }
    canonicalById.set(channel.id, channel);
  }

  const acceptedByProviderId = new Map<string, ChannelMapping>();
  const ambiguousProviderIds = new Set<string>();
  const diagnostics: DataQualityDiagnostic[] = [];

  for (const mapping of channelMappings) {
    const providerChannelId = mapping.providerChannelId.trim();
    const channelId = mapping.channelId.trim();

    if (!providerChannelId || !channelId) {
      diagnostics.push(
        dataQualityDiagnostic(
          'error',
          'invalid-channel-mapping',
          'Channel mappings require both provider and canonical ids.',
        ),
      );
      continue;
    }

    if (!canonicalById.has(channelId)) {
      diagnostics.push(
        dataQualityDiagnostic(
          'error',
          'unknown-canonical-channel',
          `Provider channel ${providerChannelId} maps to unknown Teevee channel ${channelId}.`,
          { providerChannelId, channelId },
        ),
      );
      continue;
    }

    if (acceptedByProviderId.has(providerChannelId) || ambiguousProviderIds.has(providerChannelId)) {
      acceptedByProviderId.delete(providerChannelId);
      ambiguousProviderIds.add(providerChannelId);
      diagnostics.push(
        dataQualityDiagnostic(
          'error',
          'duplicate-channel-mapping',
          `Provider channel ${providerChannelId} has more than one mapping and is excluded from this ingest.`,
          { providerChannelId },
        ),
      );
      continue;
    }

    acceptedByProviderId.set(providerChannelId, { providerChannelId, channelId });
  }

  return {
    mappings: [...acceptedByProviderId.values()],
    diagnostics,
  };
}
