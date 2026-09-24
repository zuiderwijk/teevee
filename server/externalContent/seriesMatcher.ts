import type { ExternalEpisodeNumber, ExternalProgramme } from '../epg/provider.ts';
import {
  EXTERNAL_CONTENT_MATCHER_VERSION,
  type ExternalContentMatchDecision,
} from './types.ts';
import type {
  TmdbGateway,
  TmdbSeriesIdentityCandidate,
} from './tmdbGateway.ts';
import {
  conservativeTitleIdentity,
  deriveSeriesBaseTitle,
  leadingArticleTitleIdentity,
  peopleOverlap,
} from './titleIdentity.ts';

const SEARCH_CANDIDATE_LIMIT = 5;

type SeasonEpisode = {
  seasonNumber: number;
  episodeNumber: number;
};

export type SeriesIdentityInput = {
  title: string;
  programme: ExternalProgramme;
};

function parseSeasonEpisode(
  values: readonly ExternalEpisodeNumber[] | undefined,
): SeasonEpisode | null {
  if (!values) return null;

  const parsed: SeasonEpisode[] = [];
  for (const entry of values) {
    const onscreen = entry.value.trim().match(/\bS(\d+)\s*E(\d+)\b/i);
    if (onscreen) {
      parsed.push({
        seasonNumber: Number(onscreen[1]),
        episodeNumber: Number(onscreen[2]),
      });
      continue;
    }

    if (entry.system?.trim().toLocaleLowerCase('en-US') === 'xmltv_ns') {
      const parts = entry.value.trim().split('.');
      if (
        parts.length >= 2 &&
        /^\d+$/.test(parts[0] ?? '') &&
        /^\d+$/.test(parts[1] ?? '')
      ) {
        parsed.push({
          seasonNumber: Number(parts[0]) + 1,
          episodeNumber: Number(parts[1]) + 1,
        });
      }
    }
  }

  const unique = new Map(
    parsed.map((item) => [
      `${item.seasonNumber}:${item.episodeNumber}`,
      item,
    ]),
  );
  return unique.size === 1 ? [...unique.values()][0]! : null;
}

function seriesTitles(candidate: TmdbSeriesIdentityCandidate): string[] {
  return [
    candidate.name,
    candidate.originalName,
    ...candidate.alternativeTitles,
  ];
}

function resolved(candidate: TmdbSeriesIdentityCandidate): ExternalContentMatchDecision {
  return {
    status: 'resolved',
    source: 'tmdb',
    mediaType: 'series',
    externalContentId: candidate.id,
    confidence: 'high',
    matcherVersion: EXTERNAL_CONTENT_MATCHER_VERSION,
  };
}

async function loadCandidates(
  query: string,
  gateway: TmdbGateway,
): Promise<TmdbSeriesIdentityCandidate[]> {
  const ids = [...new Set(await gateway.searchSeriesIds(query))]
    .slice(0, SEARCH_CANDIDATE_LIMIT);
  const candidates: TmdbSeriesIdentityCandidate[] = [];
  for (const id of ids) candidates.push(await gateway.getSeries(id));
  return candidates;
}

export async function matchSeriesIdentity(
  input: SeriesIdentityInput,
  gateway: TmdbGateway,
): Promise<ExternalContentMatchDecision> {
  const actors = input.programme.credits?.actor ?? [];
  if (actors.length === 0) {
    return { status: 'unresolved', reason: 'insufficient-people-evidence' };
  }

  const seasonEpisode = parseSeasonEpisode(input.programme.episodeNumbers);
  const fullCandidates = await loadCandidates(input.title, gateway);
  const fullQualifying: TmdbSeriesIdentityCandidate[] = [];

  for (const candidate of fullCandidates) {
    const titleMatches =
      conservativeTitleIdentity(input.title, seriesTitles(candidate)) ||
      leadingArticleTitleIdentity(input.title, seriesTitles(candidate));
    if (!titleMatches || peopleOverlap(actors, candidate.cast) < 1) continue;

    if (seasonEpisode) {
      const coherent = await gateway.seriesHasEpisode(
        candidate.id,
        seasonEpisode.seasonNumber,
        seasonEpisode.episodeNumber,
      );
      if (!coherent) continue;
    }
    fullQualifying.push(candidate);
  }

  if (fullQualifying.length > 1) return { status: 'ambiguous' };
  if (fullQualifying.length === 1) return resolved(fullQualifying[0]!);

  const baseTitle = deriveSeriesBaseTitle(input.title);
  if (!baseTitle || !seasonEpisode) {
    return { status: 'unresolved', reason: 'no-qualifying-candidate' };
  }

  const baseCandidates = await loadCandidates(baseTitle, gateway);
  const baseQualifying: TmdbSeriesIdentityCandidate[] = [];

  for (const candidate of baseCandidates) {
    const baseTitleMatches =
      conservativeTitleIdentity(baseTitle, seriesTitles(candidate)) ||
      leadingArticleTitleIdentity(baseTitle, seriesTitles(candidate));
    if (!baseTitleMatches) continue;

    const overlap = peopleOverlap(actors, candidate.cast);
    const coherent = await gateway.seriesHasEpisode(
      candidate.id,
      seasonEpisode.seasonNumber,
      seasonEpisode.episodeNumber,
    );

    if ((coherent && overlap >= 2) || (!coherent && overlap >= 4)) {
      baseQualifying.push(candidate);
    }
  }

  if (baseQualifying.length > 1) return { status: 'ambiguous' };
  if (baseQualifying.length === 1) return resolved(baseQualifying[0]!);

  return { status: 'unresolved', reason: 'no-qualifying-candidate' };
}

export const __seriesIdentityTestOnly = {
  parseSeasonEpisode,
};
