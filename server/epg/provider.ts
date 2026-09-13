import type { Channel } from '@/data/domain/epg';

/**
 * Provider-facing channel shape. Provider-specific adapters may enrich this internally,
 * but only these neutral fields are allowed across the ingestion boundary.
 */
export type ExternalChannel = {
  id: string;
  name: string;
  displayName?: string;
  shortName?: string;
  logoUrl?: string;
};

/**
 * Provider-facing programme shape before channel mapping and canonical validation.
 * Timestamps deliberately remain strings here because adapters may receive multiple formats.
 */
export type ExternalProgramme = {
  id?: string;
  channelId: string;
  startAt: string;
  endAt: string;
  title: string;
  subtitle?: string;
  description?: string;
  genre?: string;
  isLive?: boolean;
  isRepeat?: boolean;
};

export type ProviderScheduleQuery = {
  from: Date;
  to: Date;
  channelIds?: string[];
};

/**
 * Server-side ingestion contract. Mobile code must never implement or consume this directly.
 */
export interface EpgProvider {
  readonly key: string;
  getChannels(): Promise<ExternalChannel[]>;
  getSchedule(input: ProviderScheduleQuery): Promise<ExternalProgramme[]>;
}

/** Explicit provider -> Teevee channel identity mapping. */
export type ChannelMapping = {
  providerChannelId: string;
  channelId: Channel['id'];
};
