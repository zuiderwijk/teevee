export const TVGIDS_TIPS_RSS_URL = 'https://www.tvgids.nl/tips.rss';

export type TvgidsTipSourceItem = {
  sourceItemId: string;
  sourceUrl?: string;
  title: string;
  channelName: string;
  startAt: string;
  endAt: string;
  publishedAt?: string;
};

export type TvgidsTipsFeedSnapshot = {
  items: TvgidsTipSourceItem[];
  invalidItemCount: number;
};

export interface TvgidsTipsSource {
  fetchSnapshot(): Promise<TvgidsTipsFeedSnapshot>;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);/g, (_match, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function elementText(xml: string, tag: string): string | undefined {
  const escaped = tag.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&');
  const match = xml.match(
    new RegExp('<' + escaped + '\\b[^>]*>([\\s\\S]*?)<\\/' + escaped + '>', 'i'),
  );
  if (!match) return undefined;
  const raw = match[1]!.trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/i);
  return decodeXmlEntities((cdata ? cdata[1]! : raw).trim());
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function timestamp(value: string | undefined): string | undefined {
  const text = nonEmpty(value);
  if (!text) return undefined;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined;
}

function charsetFromContentType(contentType: string | null): string | null {
  const match = contentType?.match(/charset\s*=\s*["']?([^;"'\s]+)/i);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

function charsetFromXmlDeclaration(bytes: Uint8Array): string | null {
  const sample = Array.from(bytes.slice(0, 256), (byte) =>
    String.fromCharCode(byte),
  ).join('');
  const match = sample.match(/<\?xml\b[^>]*encoding\s*=\s*["']([^"']+)["']/i);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

function normalizeCharset(label: string | null): string {
  const normalized = label?.replace(/_/g, '-').toLowerCase();
  if (!normalized) return 'utf-8';
  if (
    normalized === 'iso-8859-1' ||
    normalized === 'latin1' ||
    normalized === 'latin-1'
  ) {
    return 'iso-8859-1';
  }
  if (normalized === 'utf-8' || normalized === 'utf8') return 'utf-8';
  if (normalized === 'windows-1252') return 'windows-1252';
  throw new Error('Unsupported TVgids RSS charset: ' + label);
}

export function decodeTvgidsTipsFeed(
  bytes: Uint8Array,
  contentType: string | null,
): string {
  const charset = normalizeCharset(
    charsetFromContentType(contentType) ?? charsetFromXmlDeclaration(bytes),
  );
  try {
    return new TextDecoder(charset, { fatal: true }).decode(bytes);
  } catch {
    throw new Error('TVgids RSS could not be decoded as ' + charset);
  }
}

export function parseTvgidsTipsFeedXml(xml: string): TvgidsTipsFeedSnapshot {
  if (!/<rss\b/i.test(xml) || !/<channel\b/i.test(xml)) {
    throw new Error('TVgids tips response is not an RSS channel');
  }

  const itemBlocks = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(
    (match) => match[1]!,
  );
  const items: TvgidsTipSourceItem[] = [];
  let invalidItemCount = 0;

  for (const block of itemBlocks) {
    const guid = nonEmpty(elementText(block, 'guid'));
    const link = nonEmpty(elementText(block, 'link'));
    const sourceItemId = guid ?? link;
    const title = nonEmpty(elementText(block, 'title'));
    const channelName = nonEmpty(elementText(block, 'channel_name'));
    const startAt = timestamp(elementText(block, 'start'));
    const endAt = timestamp(elementText(block, 'end'));
    const rawPublishedAt = nonEmpty(elementText(block, 'pubDate'));
    const publishedAt = rawPublishedAt ? timestamp(rawPublishedAt) : undefined;

    if (
      !sourceItemId ||
      !title ||
      !channelName ||
      !startAt ||
      !endAt ||
      Date.parse(endAt) <= Date.parse(startAt) ||
      (rawPublishedAt !== undefined && publishedAt === undefined)
    ) {
      invalidItemCount += 1;
      continue;
    }

    items.push({
      sourceItemId,
      ...(link ? { sourceUrl: link } : {}),
      title,
      channelName,
      startAt,
      endAt,
      ...(publishedAt ? { publishedAt } : {}),
    });
  }

  return { items, invalidItemCount };
}

export function parseTvgidsTipsFeedBytes(
  bytes: Uint8Array,
  contentType: string | null,
): TvgidsTipsFeedSnapshot {
  return parseTvgidsTipsFeedXml(decodeTvgidsTipsFeed(bytes, contentType));
}

export class HttpTvgidsTipsSource implements TvgidsTipsSource {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly url = TVGIDS_TIPS_RSS_URL,
  ) {}

  async fetchSnapshot(): Promise<TvgidsTipsFeedSnapshot> {
    const response = await this.fetcher(this.url, {
      headers: {
        Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
      },
    });
    if (!response.ok) {
      throw new Error(
        'TVgids tips RSS request failed with HTTP ' + response.status,
      );
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    return parseTvgidsTipsFeedBytes(
      bytes,
      response.headers.get('content-type'),
    );
  }
}
