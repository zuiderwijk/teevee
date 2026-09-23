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
 * Required Teevee fields are optional here on purpose: malformed external records must
 * remain representable so the normalisation boundary can diagnose and reject them.
 */
export type ExternalEpisodeNumber = {
  system?: string;
  value: string;
};

/**
 * Provider production-date evidence. `raw` is deliberately opaque: XMLTV allows
 * provider-specific date semantics and Teevee must not pretend every value is an
 * ISO calendar date. An adapter may expose `year` only when that interpretation is
 * proven safe for its source.
 */
export type ExternalProductionDate = {
  raw: string;
  year?: number;
};

/**
 * Role-preserving provider credit evidence. These names stay server-side and keep
 * the source role exactly: in particular, `actor` is not reinterpreted as cast.
 */
export type ExternalProgrammeCredits = {
  director: string[];
  actor: string[];
  producer: string[];
};

export type ExternalProgramme = {
  id?: string;
  channelId?: string;
  startAt?: string;
  endAt?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  /** Compatibility first category used only for canonical Programme.genre. */
  genre?: string;
  /** Complete provider vocabulary, server-side only. */
  categories?: string[];
  episodeNumbers?: ExternalEpisodeNumber[];
  /** Server-only provider production-date evidence; never canonical/mobile. */
  productionDate?: ExternalProductionDate;
  /** Server-only role-preserving provider credit names; never canonical/mobile. */
  credits?: ExternalProgrammeCredits;
  /**
   * Classification compatibility signal. Undefined means the provider supplied no
   * credits block; false means credits were present without a director credit.
   * Kept separate from `credits.director` so richer parsing cannot silently change
   * the already-reviewed classification contract.
   */
  hasDirectorCredit?: boolean;
  isLive?: boolean;
  isRepeat?: boolean;
};

export type ProviderScheduleQuery = {
  from: Date;
  to: Date;
  channelIds?: string[];
};

/**
 * `complete` means the adapter considers the requested channel/time scope authoritative,
 * including legitimate empty windows. `partial` data may be observed/diagnosed but must
 * never replace an already stored canonical window wholesale.
 */
export type ProviderScheduleBatch = {
  coverage: 'complete' | 'partial';
  programmes: ExternalProgramme[];
};

/**
 * Server-side ingestion contract. Mobile code must never implement or consume this directly.
 */
export interface EpgProvider {
  readonly key: string;
  getChannels(): Promise<ExternalChannel[]>;
  getSchedule(input: ProviderScheduleQuery): Promise<ProviderScheduleBatch>;
}

/** Explicit provider -> Teevee channel identity mapping. */
export type ChannelMapping = {
  providerChannelId: string;
  channelId: Channel['id'];
};
