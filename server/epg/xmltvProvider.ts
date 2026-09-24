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

export type XmltvStreamingStats = {
  channelBlocksScanned: number;
  programmeBlocksScanned: number;
  programmeTimestampHeadersParsed: number;
  programmeBlocksMaterialised: number;
  maxBufferedChars: number;
};

export type XmltvScheduleStreamResult = {
  channels: ExternalChannel[];
  batches: ProviderScheduleBatch[];
  stats: XmltvStreamingStats;
};

type PreparedScheduleQuery = {
  fromMs: number;
  toMs: number;
  requestedChannelIds: string[] | null;
  requestedChannelSet: Set<string> | null;
  programmes: ParsedProgramme[];
};

type XmltvBlockTag = 'channel' | 'programme';

type BlockStart =
  | { kind: 'block'; index: number; tag: XmltvBlockTag }
  | { kind: 'incomplete'; index: number }
  | null;

function normalizedRequestedIds(channelIds: readonly string[] | undefined): string[] | null {
  if (channelIds === undefined) return null;
  const ids = new Set<string>();
  for (const id of channelIds) {
    const trimmed = id.trim();
    if (trimmed) ids.add(trimmed);
  }
  return [...ids];
}

function prepareScheduleQuery(input: ProviderScheduleQuery): PreparedScheduleQuery {
  const fromMs = input.from.getTime();
  const toMs = input.to.getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    throw new Error('XMLTV schedule query must contain a valid [from,to) range');
  }

  const requestedChannelIds = normalizedRequestedIds(input.channelIds);
  return {
    fromMs,
    toMs,
    requestedChannelIds,
    requestedChannelSet:
      requestedChannelIds === null ? null : new Set(requestedChannelIds),
    programmes: [],
  };
}

function findNextBlockStart(lowerSource: string, fromIndex: number): BlockStart {
  let cursor = fromIndex;

  while (cursor < lowerSource.length) {
    const index = lowerSource.indexOf('<', cursor);
    if (index < 0) return null;

    if (lowerSource.startsWith('<!--', index)) {
      const end = lowerSource.indexOf('-->', index + 4);
      if (end < 0) return { kind: 'incomplete', index };
      cursor = end + 3;
      continue;
    }

    if (lowerSource.startsWith('<?', index)) {
      const end = lowerSource.indexOf('?>', index + 2);
      if (end < 0) return { kind: 'incomplete', index };
      cursor = end + 2;
      continue;
    }

    for (const tag of ['channel', 'programme'] as const) {
      const prefix = `<${tag}`;
      if (!lowerSource.startsWith(prefix, index)) continue;
      const boundary = lowerSource[index + prefix.length];
      if (boundary === undefined) return { kind: 'incomplete', index };
      if (/\s|>/.test(boundary)) return { kind: 'block', index, tag };
    }

    const remaining = lowerSource.length - index;
    if (remaining < '<programme'.length) {
      return { kind: 'incomplete', index };
    }
    cursor = index + 1;
  }

  return null;
}

function findBlockEnd(
  source: string,
  lowerSource: string,
  startIndex: number,
  tag: XmltvBlockTag,
): number | null {
  const openingEnd = source.indexOf('>', startIndex);
  if (openingEnd < 0) return null;

  const closingPrefix = `</${tag}`;
  let cursor = openingEnd + 1;

  while (cursor < source.length) {
    const cdataIndex = lowerSource.indexOf('<![cdata[', cursor);
    const commentIndex = lowerSource.indexOf('<!--', cursor);
    const closingIndex = lowerSource.indexOf(closingPrefix, cursor);
    const candidates = [cdataIndex, commentIndex, closingIndex].filter((index) => index >= 0);
    if (candidates.length === 0) return null;

    const nextIndex = Math.min(...candidates);
    if (nextIndex === cdataIndex) {
      const cdataEnd = lowerSource.indexOf(']]>', cdataIndex + 9);
      if (cdataEnd < 0) return null;
      cursor = cdataEnd + 3;
      continue;
    }

    if (nextIndex === commentIndex) {
      const commentEnd = lowerSource.indexOf('-->', commentIndex + 4);
      if (commentEnd < 0) return null;
      cursor = commentEnd + 3;
      continue;
    }

    const boundary = lowerSource[closingIndex + closingPrefix.length];
    if (boundary !== undefined && !/\s|>/.test(boundary)) {
      cursor = closingIndex + closingPrefix.length;
      continue;
    }
    const closingEnd = source.indexOf('>', closingIndex + closingPrefix.length);
    return closingEnd < 0 ? null : closingEnd + 1;
  }

  return null;
}

async function consumeXmltvBlocks(
  body: ReadableStream<Uint8Array>,
  stats: XmltvStreamingStats,
  onBlock: (tag: XmltvBlockTag, block: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const drain = (final: boolean) => {
    const lower = buffer.toLowerCase();
    let consumedUntil = 0;

    while (consumedUntil < buffer.length) {
      const start = findNextBlockStart(lower, consumedUntil);
      if (!start) {
        consumedUntil = buffer.length;
        break;
      }
      if (start.kind === 'incomplete') {
        consumedUntil = start.index;
        break;
      }

      const end = findBlockEnd(buffer, lower, start.index, start.tag);
      if (end === null) {
        consumedUntil = start.index;
        break;
      }

      onBlock(start.tag, buffer.slice(start.index, end));
      consumedUntil = end;
    }

    if (consumedUntil > 0) buffer = buffer.slice(consumedUntil);
    if (final) buffer = '';
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      stats.maxBufferedChars = Math.max(stats.maxBufferedChars, buffer.length);
      drain(false);
    }
    buffer += decoder.decode();
    stats.maxBufferedChars = Math.max(stats.maxBufferedChars, buffer.length);
    drain(true);
  } finally {
    reader.releaseLock();
  }
}

function queryRequestsChannel(query: PreparedScheduleQuery, channelId: string): boolean {
  return query.requestedChannelSet === null || query.requestedChannelSet.has(channelId);
}

function programmeTimes(tag: string): { startMs: number | null; endMs: number | null } {
  const startAt = parseXmltvTimestamp(attribute(tag, 'start'));
  const endAt = parseXmltvTimestamp(attribute(tag, 'stop'));
  return {
    startMs: startAt ? Date.parse(startAt) : null,
    endMs: endAt ? Date.parse(endAt) : null,
  };
}

function timesIntersectQuery(
  times: ReturnType<typeof programmeTimes>,
  query: PreparedScheduleQuery,
): boolean {
  return (
    times.startMs !== null &&
    times.endMs !== null &&
    times.startMs < query.toMs &&
    times.endMs > query.fromMs
  );
}

function uniqueChannelIds(channels: readonly ExternalChannel[]): string[] {
  const ids = new Set<string>();
  for (const channel of channels) {
    const id = channel.id.trim();
    if (id) ids.add(id);
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

/**
 * Incrementally consumes one XMLTV response body and materialises full programme
 * evidence only for requested channel/window intersections. The scanner retains at
 * most the unread tail/current top-level XMLTV block plus the requested result set;
 * it never constructs a feed-wide ParsedProgramme[].
 */
export async function parseXmltvScheduleStream(
  body: ReadableStream<Uint8Array>,
  inputs: readonly ProviderScheduleQuery[],
): Promise<XmltvScheduleStreamResult> {
  if (inputs.length === 0) {
    throw new Error('XMLTV schedule stream requires at least one query');
  }

  const queries = inputs.map(prepareScheduleQuery);
  const needsAllChannels = queries.some(({ requestedChannelIds }) => requestedChannelIds === null);
  const requestedChannelUnion = new Set(
    queries.flatMap(({ requestedChannelIds }) => requestedChannelIds ?? []),
  );
  const channels: ExternalChannel[] = [];
  const stats: XmltvStreamingStats = {
    channelBlocksScanned: 0,
    programmeBlocksScanned: 0,
    programmeTimestampHeadersParsed: 0,
    programmeBlocksMaterialised: 0,
    maxBufferedChars: 0,
  };

  await consumeXmltvBlocks(body, stats, (tag, block) => {
    if (tag === 'channel') {
      stats.channelBlocksScanned += 1;
      const id = attribute(openingTag(block), 'id');
      if (!needsAllChannels && (!id || !requestedChannelUnion.has(id))) return;
      const channel = parseChannel(block);
      if (channel) channels.push(channel);
      return;
    }

    stats.programmeBlocksScanned += 1;
    const tagText = openingTag(block);
    const channelId = attribute(tagText, 'channel');
    if (!channelId) return;

    const channelQueries = queries.filter((query) => queryRequestsChannel(query, channelId));
    if (channelQueries.length === 0) return;

    stats.programmeTimestampHeadersParsed += 1;
    const times = programmeTimes(tagText);
    const matchingQueries = channelQueries.filter((query) => timesIntersectQuery(times, query));
    if (matchingQueries.length === 0) return;

    const parsed = parseProgramme(block);
    stats.programmeBlocksMaterialised += 1;
    for (const query of matchingQueries) query.programmes.push(parsed);
  });

  const discoveredChannelIds = uniqueChannelIds(channels);
  const batches = queries.map((query): ProviderScheduleBatch => {
    const channelIds = query.requestedChannelIds ?? discoveredChannelIds;
    const channelSet = new Set(channelIds);
    const programmes =
      query.requestedChannelIds === null
        ? query.programmes.filter(
            ({ programme }) => programme.channelId && channelSet.has(programme.channelId),
          )
        : query.programmes;
    const complete =
      channelIds.length > 0 &&
      channelIds.every((channelId) =>
        hasContinuousCoverage(programmes, channelId, query.fromMs, query.toMs),
      );

    return {
      coverage: complete ? 'complete' : 'partial',
      programmes: programmes.map(({ programme }) => programme),
    };
  });

  return { channels, batches, stats };
}

async function parseXmltvChannelStream(
  body: ReadableStream<Uint8Array>,
): Promise<ExternalChannel[]> {
  const channels: ExternalChannel[] = [];
  const stats: XmltvStreamingStats = {
    channelBlocksScanned: 0,
    programmeBlocksScanned: 0,
    programmeTimestampHeadersParsed: 0,
    programmeBlocksMaterialised: 0,
    maxBufferedChars: 0,
  };
  await consumeXmltvBlocks(body, stats, (tag, block) => {
    if (tag !== 'channel') return;
    const channel = parseChannel(block);
    if (channel) channels.push(channel);
  });
  return channels;
}

export class XmltvEpgProvider implements EpgProvider {
  readonly key: string;
  private readonly url: string;
  private readonly fetcher: typeof fetch;
  private channelsPromise: Promise<ExternalChannel[]> | null = null;

  constructor(options: XmltvProviderOptions = {}) {
    this.key = options.key?.trim() || 'development-xmltv';
    this.url = options.url?.trim() || DEFAULT_DEVELOPMENT_XMLTV_URL;
    this.fetcher = options.fetcher ?? fetch;
  }

  private async responseBody(): Promise<ReadableStream<Uint8Array>> {
    const response = await this.fetcher(this.url, {
      headers: { Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.1' },
    });
    if (!response.ok) {
      throw new Error(`XMLTV provider request failed with HTTP ${response.status}`);
    }
    if (!response.body) {
      throw new Error('XMLTV provider response body is unavailable');
    }
    return response.body;
  }

  async getChannels(): Promise<ExternalChannel[]> {
    // Hosted refresh never calls this path. It is intentionally isolated so channel
    // discovery cannot force getSchedule() back to feed-wide programme materialisation.
    this.channelsPromise ??= this.responseBody().then(parseXmltvChannelStream);
    return this.channelsPromise;
  }

  async getSchedule(input: ProviderScheduleQuery): Promise<ProviderScheduleBatch> {
    return (await this.getSchedules([input]))[0]!;
  }

  async getSchedules(inputs: ProviderScheduleQuery[]): Promise<ProviderScheduleBatch[]> {
    const result = await parseXmltvScheduleStream(await this.responseBody(), inputs);
    return result.batches;
  }
}
