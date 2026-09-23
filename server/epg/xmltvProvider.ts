import type {
  EpgProvider,
  ExternalChannel,
  ExternalEpisodeNumber,
  ExternalProgramme,
  ExternalProgrammeCredits,
  ExternalProductionDate,
  ProviderScheduleBatch,
  ProviderScheduleQuery,
} from './provider';

export const DEFAULT_DEVELOPMENT_XMLTV_URL = 'https://iptv-epg.org/files/epg-nl.xml';

export type XmltvProviderOptions = {
  url?: string;
  fetcher?: typeof fetch;
  key?: string;
};

type ParsedProgramme = {
  programme: ExternalProgramme;
  startMs: number | null;
  endMs: number | null;
};

type ParsedDocument = {
  channels: ExternalChannel[];
  programmes: ParsedProgramme[];
};

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, digits: string) =>
      String.fromCodePoint(Number.parseInt(digits, 16)),
    );
}

function attribute(openingTag: string, name: string): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = openingTag.match(new RegExp(`\\b${escapedName}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  const value = match?.[2] ? decodeXml(match[2]).trim() : '';
  return value || undefined;
}

function elementText(block: string, name: string): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(
    new RegExp(`<${escapedName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedName}>`, 'i'),
  );
  const value = match?.[1]
    ? decodeXml(match[1]).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    : '';
  return value || undefined;
}

function elementTexts(block: string, name: string): string[] {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...block.matchAll(
    new RegExp(`<${escapedName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedName}>`, 'gi'),
  )]
    .map((match) =>
      decodeXml(match[1] ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    )
    .filter(Boolean);
}

function uniqueText(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function productionDateEvidence(block: string): ExternalProductionDate | undefined {
  const raw = elementText(block, 'date');
  if (!raw) return undefined;

  if (/^\d{4}$/.test(raw)) {
    const year = Number(raw);
    if (year >= 1000 && year <= 9999) {
      return { raw, year };
    }
  }

  return { raw };
}

function programmeCredits(block: string): ExternalProgrammeCredits | undefined {
  const creditBlocks = [...block.matchAll(/<credits\b[^>]*>[\s\S]*?<\/credits>/gi)].map(
    (match) => match[0],
  );
  if (creditBlocks.length === 0) return undefined;

  const namesFor = (role: 'director' | 'actor' | 'producer') =>
    uniqueText(creditBlocks.flatMap((credits) => elementTexts(credits, role)));

  return {
    director: namesFor('director'),
    actor: namesFor('actor'),
    producer: namesFor('producer'),
  };
}

function episodeNumbers(block: string): ExternalEpisodeNumber[] {
  return [...block.matchAll(/<episode-num\b[^>]*>[\s\S]*?<\/episode-num>/gi)]
    .map((match) => {
      const value = decodeXml(
        match[0]
          .replace(/^<episode-num\b[^>]*>/i, '')
          .replace(/<\/episode-num>$/i, ''),
      )
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const system = attribute(openingTag(match[0]), 'system');
      return value ? { ...(system ? { system } : {}), value } : null;
    })
    .filter((item): item is ExternalEpisodeNumber => item !== null);
}
function directorCreditEvidence(block: string): boolean | undefined {
  const credits = block.match(/<credits\b[^>]*>[\s\S]*?<\/credits>/i)?.[0];
  if (!credits) return undefined;
  return /<director\b/i.test(credits);
}

function openingTag(block: string): string {
  const end = block.indexOf('>');
  return end >= 0 ? block.slice(0, end + 1) : block;
}

/**
 * XMLTV timestamps are compact local timestamps with an explicit numeric UTC offset,
 * e.g. `20260914200000 +0200`. Teevee deliberately requires the offset here so the
 * server never guesses a timezone for external data.
 */
export function parseXmltvTimestamp(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value
    .trim()
    .match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-])(\d{2})(\d{2})$/);
  if (!match) return undefined;

  const [, year, month, day, hour, minute, second = '00', sign, offsetHour, offsetMinute] =
    match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${offsetHour}:${offsetMinute}`;
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function parseChannel(block: string): ExternalChannel | null {
  const id = attribute(openingTag(block), 'id');
  if (!id) return null;
  const name = elementText(block, 'display-name') ?? id;
  const iconTag = block.match(/<icon\b[^>]*>/i)?.[0];
  const logoUrl = iconTag ? attribute(iconTag, 'src') : undefined;

  return {
    id,
    name,
    displayName: name,
    ...(logoUrl ? { logoUrl } : {}),
  };
}

function parseProgramme(block: string): ParsedProgramme {
  const tag = openingTag(block);
  const channelId = attribute(tag, 'channel');
  const rawStart = attribute(tag, 'start');
  const rawEnd = attribute(tag, 'stop');
  const startAt = parseXmltvTimestamp(rawStart);
  const endAt = parseXmltvTimestamp(rawEnd);
  const title = elementText(block, 'title');
  const subtitle = elementText(block, 'sub-title');
  const description = elementText(block, 'desc');
  const categories = elementTexts(block, 'category');
  const genre = categories[0];
  const parsedEpisodeNumbers = episodeNumbers(block);
  const productionDate = productionDateEvidence(block);
  const credits = programmeCredits(block);
  const hasDirectorCredit = directorCreditEvidence(block);
  const isLive = /<live\b[^>]*\/>/i.test(block) ? true : undefined;
  const isRepeat = /<previously-shown\b[^>]*\/?\s*>/i.test(block) ? true : undefined;

  return {
    programme: {
      ...(channelId ? { channelId } : {}),
      ...(startAt ? { startAt } : rawStart ? { startAt: rawStart } : {}),
      ...(endAt ? { endAt } : rawEnd ? { endAt: rawEnd } : {}),
      ...(title ? { title } : {}),
      ...(subtitle ? { subtitle } : {}),
      ...(description ? { description } : {}),
      ...(genre ? { genre } : {}),
      ...(categories.length > 0 ? { categories } : {}),
      ...(parsedEpisodeNumbers.length > 0 ? { episodeNumbers: parsedEpisodeNumbers } : {}),
      ...(productionDate ? { productionDate } : {}),
      ...(credits ? { credits } : {}),
      ...(hasDirectorCredit !== undefined ? { hasDirectorCredit } : {}),
      ...(isLive !== undefined ? { isLive } : {}),
      ...(isRepeat !== undefined ? { isRepeat } : {}),
    },
    startMs: startAt ? Date.parse(startAt) : null,
    endMs: endAt ? Date.parse(endAt) : null,
  };
}

export function parseXmltvDocument(xml: string): ParsedDocument {
  const channels = [...xml.matchAll(/<channel\b[^>]*>[\s\S]*?<\/channel>/gi)]
    .map((match) => parseChannel(match[0]))
    .filter((channel): channel is ExternalChannel => channel !== null);

  const programmes = [...xml.matchAll(/<programme\b[^>]*>[\s\S]*?<\/programme>/gi)].map(
    (match) => parseProgramme(match[0]),
  );

  return { channels, programmes };
}

function requestedIds(input: ProviderScheduleQuery, document: ParsedDocument): string[] {
  const source = input.channelIds ?? document.channels.map(({ id }) => id);
  const ids = new Set<string>();
  for (const id of source) {
    const trimmed = id.trim();
    if (trimmed) ids.add(trimmed);
  }
  return [...ids];
}

function hasContinuousCoverage(
  programmes: ParsedProgramme[],
  channelId: string,
  fromMs: number,
  toMs: number,
): boolean {
  const candidates = programmes
    .filter(
      ({ programme, startMs, endMs }) =>
        programme.channelId === channelId &&
        startMs !== null &&
        endMs !== null &&
        endMs > startMs &&
        endMs > fromMs &&
        startMs < toMs,
    )
    .sort((left, right) => left.startMs! - right.startMs! || left.endMs! - right.endMs!);

  if (candidates.length === 0) return false;
  if (candidates[0]!.startMs! > fromMs) return false;

  let coveredUntil = Math.max(fromMs, candidates[0]!.endMs!);
  for (const candidate of candidates.slice(1)) {
    if (coveredUntil >= toMs) return true;
    if (candidate.startMs! > coveredUntil) return false;
    coveredUntil = Math.max(coveredUntil, candidate.endMs!);
  }
  return coveredUntil >= toMs;
}

function intersectsQuery(programme: ParsedProgramme, fromMs: number, toMs: number): boolean {
  return (
    programme.startMs !== null &&
    programme.endMs !== null &&
    programme.startMs < toMs &&
    programme.endMs > fromMs
  );
}

export class XmltvEpgProvider implements EpgProvider {
  readonly key: string;
  private readonly url: string;
  private readonly fetcher: typeof fetch;
  private documentPromise: Promise<ParsedDocument> | null = null;

  constructor(options: XmltvProviderOptions = {}) {
    this.key = options.key?.trim() || 'development-xmltv';
    this.url = options.url?.trim() || DEFAULT_DEVELOPMENT_XMLTV_URL;
    this.fetcher = options.fetcher ?? fetch;
  }

  private document(): Promise<ParsedDocument> {
    this.documentPromise ??= (async () => {
      const response = await this.fetcher(this.url, {
        headers: { Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.1' },
      });
      if (!response.ok) {
        throw new Error(`XMLTV provider request failed with HTTP ${response.status}`);
      }
      return parseXmltvDocument(await response.text());
    })();
    return this.documentPromise;
  }

  async getChannels(): Promise<ExternalChannel[]> {
    return (await this.document()).channels;
  }

  async getSchedule(input: ProviderScheduleQuery): Promise<ProviderScheduleBatch> {
    const fromMs = input.from.getTime();
    const toMs = input.to.getTime();
    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
      throw new Error('XMLTV schedule query must contain a valid [from,to) range');
    }

    const document = await this.document();
    const channelIds = requestedIds(input, document);
    const requested = new Set(channelIds);
    const programmes = document.programmes
      .filter(({ programme }) => programme.channelId && requested.has(programme.channelId))
      .filter((programme) => intersectsQuery(programme, fromMs, toMs));

    const complete =
      channelIds.length > 0 &&
      channelIds.every((channelId) =>
        hasContinuousCoverage(document.programmes, channelId, fromMs, toMs),
      );

    return {
      coverage: complete ? 'complete' : 'partial',
      programmes: programmes.map(({ programme }) => programme),
    };
  }
}
