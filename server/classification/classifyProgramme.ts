import {
  triStateFromBoolean,
  type ProgrammeClassification,
  type ProgrammeSportType,
} from '../../data/domain/programmeClassification.ts';
import type { Programme } from '../../data/domain/epg.ts';
import type { ExternalEpisodeNumber, ExternalProgramme } from '../epg/provider.ts';

const DEVELOPMENT_XMLTV_PROVIDER_KEY = 'development-xmltv';

const FILM_CATEGORIES = new Set(['Film']);

/**
 * These source categories are strong scripted-form evidence for the current XMLTV
 * provider. Broader labels such as Miniseries are intentionally not treated as
 * strong because the source also uses them for documentary/factual series.
 */
const EXPLICIT_SCRIPTED_SERIES_CATEGORIES = new Set([
  'Dramaseries',
  'Misdaaddrama',
  'Sitcoms',
  'Soap',
]);

const SCRIPTED_SERIES_SUPPORT_CATEGORIES = new Set([
  ...EXPLICIT_SCRIPTED_SERIES_CATEGORIES,
  'Actie',
  'Animatie',
  'Avontuur',
  'Drama',
  'Fantasy',
  'Historisch Drama',
  'Horror',
  'Komedie',
  'Medisch',
  'Misdaad',
  'Mysterie',
  'Romantiek',
  'Romantische Komedie',
  'Sciencefiction',
  'Thriller',
  'Western',
  'Zwarte Komedie',
]);

const CHILDREN_AUDIENCE_CATEGORIES = new Set([
  'Kinderen',
  'Kids En Familie',
]);

/**
 * Strong format evidence that contradicts scripted episodic classification even
 * when a provider also emits a nominal series label.
 */
const STRONG_NON_SCRIPTED_FORM_CATEGORIES = new Set([
  "Actualiteitenprogramma's",
  'Actualiteit',
  'Documentaire',
  'Educatie',
  'Interview',
  'Nieuws',
  'Reality',
  'Reality Competitie',
  'Spelshow',
  'Sport',
  'Sports',
  'Sporttalkshow',
  'Talkshow',
  'Weer',
]);

/**
 * Broader factual/format context used only to gate generic-series inference.
 * Strong explicit scripted-form labels may coexist with some of these subject
 * categories (for example Sitcoms + Politiek), so they are not global vetoes.
 */
const GENERIC_SERIES_BLOCKER_CATEGORIES = new Set([
  ...STRONG_NON_SCRIPTED_FORM_CATEGORIES,
  "Auto's",
  'Beeldende Kunst',
  'Bouwen En Verbouwen',
  'Business & Financial',
  "Consumentenprogramma's",
  'Culinair',
  'Debat',
  'Dieren',
  'Doe Het Zelf',
  'Entertainment',
  'Exercise',
  'Geschiedenis',
  'Home & Garden',
  'Landbouw',
  'Mode',
  'Muziek',
  'Natuur',
  'Natuur En Milieu',
  'Politiek',
  'Reizen',
  'Religie',
  'Samenleving',
  'Shoppen',
  'Technologie',
  'Variété',
  'Veiling',
  'Wetenschap',
]);

/**
 * Positive high-confidence "other" evidence is intentionally narrower than the
 * generic-Series blocker set. Blocking generic scripted inference only means
 * "Series is not proven"; it must never be promoted into "other is proven".
 */
const POSITIVE_OTHER_CONTENT_CATEGORIES = STRONG_NON_SCRIPTED_FORM_CATEGORIES;

const SPORT_ROOT_CATEGORIES = new Set(['Sport', 'Sports', 'Sporttalkshow']);
const SPORT_TALK_CATEGORIES = new Set(['Sporttalkshow', 'Talkshow']);
const SPORT_DOCUMENTARY_CATEGORIES = new Set([
  'Documentaire',
  'Geschiedenis',
  'Biografie',
]);
const SPORT_EVENT_CATEGORIES = new Set([
  'American Football',
  'Atletiek',
  'Basketbal',
  'Event',
  'Extreme Sporten',
  'Gewichtheffen',
  'Golf',
  'Hockey',
  'Honkbal',
  'Motorracen',
  'Motorsport',
  'Mountainbiken',
  'Multisportevenement',
  'Paardensport',
  'Rugby',
  'Rugby Union',
  'Running',
  'Snooker',
  'Tennis',
  'Triathlon',
  'Vissen',
  'Vliegsport',
  'Voetbal',
  'Volleybal',
  'Wielrennen',
  'Zeilen',
]);

function trimmedUnique(values: readonly string[] | undefined): string[] {
  if (!values) return [];
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function hasAny(values: ReadonlySet<string>, categories: readonly string[]): boolean {
  return categories.some((category) => values.has(category));
}

function countAny(values: ReadonlySet<string>, categories: readonly string[]): number {
  return categories.reduce(
    (count, category) => count + Number(values.has(category)),
    0,
  );
}

function normalizedEvidenceText(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('nl-NL')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function explicitSeasonEpisode(numbers: readonly ExternalEpisodeNumber[] | undefined): boolean {
  if (!numbers) return false;
  return numbers.some(({ system, value }) => {
    const normalized = value.trim();
    if (/\bS\d+\s*E\d+\b/i.test(normalized)) return true;
    if (system?.trim().toLocaleLowerCase('en-US') === 'xmltv_ns') {
      const parts = normalized.split('.');
      return (
        parts.length >= 2 &&
        /^\d+$/.test(parts[0] ?? '') &&
        /^\d+$/.test(parts[1] ?? '')
      );
    }
    return false;
  });
}

function containsWord(text: string, word: string): boolean {
  return new RegExp(`(?:^| )${word}(?: |$)`).test(text);
}

function classifySportType(
  categories: readonly string[],
  description: string | undefined,
): ProgrammeSportType {
  const evidenceText = normalizedEvidenceText(description);

  if (
    hasAny(SPORT_TALK_CATEGORIES, categories) ||
    containsWord(evidenceText, 'voorbeschouwing') ||
    containsWord(evidenceText, 'nabeschouwing')
  ) {
    return 'talk';
  }

  if (hasAny(SPORT_DOCUMENTARY_CATEGORIES, categories)) {
    return 'magazine-documentary';
  }

  if (
    containsWord(evidenceText, 'hoogtepunten') ||
    containsWord(evidenceText, 'samenvatting') ||
    containsWord(evidenceText, 'samenvattingen')
  ) {
    return 'highlights';
  }

  if (
    categories.includes('Multisportevenement') ||
    categories.includes('Event') ||
    (hasAny(SPORT_EVENT_CATEGORIES, categories) &&
      containsWord(evidenceText, 'verslag'))
  ) {
    return 'event';
  }

  return 'unknown';
}

function baseClassification(
  programmeId: Programme['id'],
  programme: ExternalProgramme,
): ProgrammeClassification {
  return {
    programmeId,
    contentType: 'unknown',
    seriesType: 'unknown',
    audience: 'unknown',
    sportType: 'unknown',
    liveStatus: triStateFromBoolean(programme.isLive),
    repeatStatus: triStateFromBoolean(programme.isRepeat),
    confidence: 'unknown',
  };
}

function developmentXmltvClassification(
  programmeId: Programme['id'],
  programme: ExternalProgramme,
): ProgrammeClassification {
  const base = baseClassification(programmeId, programme);
  const categories = trimmedUnique(
    programme.categories ?? (programme.genre ? [programme.genre] : []),
  );

  const film = hasAny(FILM_CATEGORIES, categories);
  const sport = hasAny(SPORT_ROOT_CATEGORIES, categories);

  const hasExplicitScriptedSeriesCategory = hasAny(
    EXPLICIT_SCRIPTED_SERIES_CATEGORIES,
    categories,
  );
  const hasStrongNonScriptedForm = hasAny(
    STRONG_NON_SCRIPTED_FORM_CATEGORIES,
    categories,
  );
  const hasGenericSeriesBlocker = hasAny(
    GENERIC_SERIES_BLOCKER_CATEGORIES,
    categories,
  );
  const scriptedSupportCount = countAny(
    SCRIPTED_SERIES_SUPPORT_CATEGORIES,
    categories,
  );
  const hasSeasonEpisode = explicitSeasonEpisode(programme.episodeNumbers);
  const hasChildrenAudience = hasAny(
    CHILDREN_AUDIENCE_CATEGORIES,
    categories,
  );

  const explicitScriptedSeries =
    hasExplicitScriptedSeriesCategory && !hasStrongNonScriptedForm;

  const childrenAnimatedSeries =
    hasSeasonEpisode &&
    hasChildrenAudience &&
    categories.includes('Animatie') &&
    !hasStrongNonScriptedForm;

  const genericScriptedSeries =
    hasSeasonEpisode &&
    !hasChildrenAudience &&
    !hasGenericSeriesBlocker &&
    (
      scriptedSupportCount >= 2 ||
      (scriptedSupportCount >= 1 && programme.hasDirectorCredit === true)
    );

  const series =
    explicitScriptedSeries ||
    childrenAnimatedSeries ||
    genericScriptedSeries;

  const targetFamilies = Number(film) + Number(series) + Number(sport);
  if (targetFamilies > 1) return base;

  if (film) {
    return { ...base, contentType: 'film', confidence: 'high' };
  }

  if (series) {
    const audience = hasChildrenAudience
      ? 'primarily-children'
      : 'general-mainstream';

    return {
      ...base,
      contentType: 'series',
      seriesType: 'scripted-episodic',
      audience,
      confidence: 'high',
    };
  }

  if (sport) {
    const kind = classifySportType(categories, programme.description);
    return {
      ...base,
      contentType: 'sport',
      sportType: kind,
      confidence: kind === 'unknown' ? 'unknown' : 'high',
    };
  }

  if (
    categories.length > 0 &&
    (
      hasChildrenAudience ||
      hasAny(POSITIVE_OTHER_CONTENT_CATEGORIES, categories)
    )
  ) {
    return {
      ...base,
      contentType: 'other',
      audience: hasChildrenAudience
        ? 'primarily-children'
        : 'unknown',
      confidence: 'high',
    };
  }

  return base;
}

/**
 * Central provider-classification boundary.
 *
 * Provider vocabulary is interpreted here and nowhere in mobile/public contracts.
 * A future provider adds/replaces one mapping branch while public Teevee semantics
 * remain stable.
 */
export function classifyExternalProgramme(input: {
  providerKey: string;
  programmeId: Programme['id'];
  programme: ExternalProgramme;
}): ProgrammeClassification {
  if (input.providerKey === DEVELOPMENT_XMLTV_PROVIDER_KEY) {
    return developmentXmltvClassification(input.programmeId, input.programme);
  }
  return baseClassification(input.programmeId, input.programme);
}
