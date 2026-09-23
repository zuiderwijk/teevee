import { describe, expect, it } from 'vitest';

import { IPTV_EPG_NL_PROVIDER_CHANNEL_IDS } from '../../server/epg/developmentChannelCatalog';

const URL = 'https://iptv-epg.org/files/epg-nl.xml';

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

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp('\\b' + name + '\\s*=\\s*(["\\\'])(.*?)\\1', 'i'));
  return match?.[2] ? decodeXml(match[2]).trim() : undefined;
}

function allElementTexts(block: string, name: string): Array<{ text: string; opening: string }> {
  const re = new RegExp('<' + name + '\\b([^>]*)>([\\s\\S]*?)<\\/' + name + '>', 'gi');
  const out: Array<{ text: string; opening: string }> = [];
  for (const match of block.matchAll(re)) {
    const text = decodeXml(match[2] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    out.push({ text, opening: '<' + name + (match[1] ?? '') + '>' });
  }
  return out;
}

function hasTag(block: string, name: string): boolean {
  return new RegExp('<' + name + '\\b', 'i').test(block);
}

function firstText(block: string, name: string): string | undefined {
  return allElementTexts(block, name)[0]?.text || undefined;
}

describe('temporary raw IPTV-EPG NL richness capture', () => {
  it(
    'measures raw XMLTV metadata before Teevee parsing for the 12 mapped channels',
    async () => {
      const response = await fetch(URL, {
        headers: { Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.1' },
      });
      expect(response.ok).toBe(true);
      const xml = await response.text();

      const requested = new Set<string>(IPTV_EPG_NL_PROVIDER_CHANNEL_IDS);
      const blocks = [...xml.matchAll(/<programme\b[^>]*>[\s\S]*?<\/programme>/gi)]
        .map((m) => m[0])
        .filter((block) => {
          const opening = block.slice(0, block.indexOf('>') + 1);
          const channel = attribute(opening, 'channel');
          return channel !== undefined && requested.has(channel);
        });

      const knownProgrammeTags = [
        'title', 'sub-title', 'desc', 'credits', 'date', 'category', 'keyword',
        'language', 'orig-language', 'length', 'icon', 'url', 'country',
        'episode-num', 'video', 'audio', 'previously-shown', 'premiere',
        'last-chance', 'new', 'subtitles', 'rating', 'star-rating', 'review', 'live',
      ];

      const presence = Object.fromEntries(
        knownProgrammeTags.map((tag) => [tag, blocks.filter((b) => hasTag(b, tag)).length]),
      );

      const nestedTags = [
        'director', 'actor', 'writer', 'adapter', 'producer', 'composer',
        'editor', 'presenter', 'commentator', 'guest', 'value',
      ];
      const nestedPresence = Object.fromEntries(
        nestedTags.map((tag) => [tag, blocks.filter((b) => hasTag(b, tag)).length]),
      );

      const categoryCountDistribution: Record<string, number> = {};
      const categoryValues = new Map<string, number>();
      const secondaryCategoryValues = new Map<string, number>();
      const combinations = new Map<string, number>();
      let multipleCategories = 0;

      const episodeSystems = new Map<string, number>();
      const episodeSamples: Array<Record<string, unknown>> = [];
      const interestingSamples: Array<Record<string, unknown>> = [];
      const iconUrls = new Map<string, number>();
      const iconDomains = new Map<string, number>();
      const wantedTitle = /(Bluey|Spidey|The Resident|Big Bang|Flikken|Spencer Sisters|Poirot|Aspe|I, Robot|The Martian|The Grey|Andere Tijden Sport|Studio Sport|UEFA|World Championships)/i;

      for (const block of blocks) {
        const categories = allElementTexts(block, 'category').map((x) => x.text).filter(Boolean);
        categoryCountDistribution[String(categories.length)] =
          (categoryCountDistribution[String(categories.length)] ?? 0) + 1;
        if (categories.length > 1) multipleCategories += 1;
        for (const [index, value] of categories.entries()) {
          categoryValues.set(value, (categoryValues.get(value) ?? 0) + 1);
          if (index > 0) {
            secondaryCategoryValues.set(value, (secondaryCategoryValues.get(value) ?? 0) + 1);
          }
        }
        const combo = categories.join(' > ') || '(none)';
        combinations.set(combo, (combinations.get(combo) ?? 0) + 1);

        const episodes = allElementTexts(block, 'episode-num');
        for (const episode of episodes) {
          const system = attribute(episode.opening, 'system') ?? '(missing)';
          episodeSystems.set(system, (episodeSystems.get(system) ?? 0) + 1);
        }

        const title = firstText(block, 'title') ?? '';
        const iconTag = block.match(/<icon\\b[^>]*>/i)?.[0];
        const iconSrc = (iconTag ? attribute(iconTag, 'src') : undefined) ?? firstText(block, 'icon');
        if (iconSrc) {
          iconUrls.set(iconSrc, (iconUrls.get(iconSrc) ?? 0) + 1);
          try {
            const host = new globalThis.URL(iconSrc).host || '(no-host)';
            iconDomains.set(host, (iconDomains.get(host) ?? 0) + 1);
          } catch {
            iconDomains.set('(invalid-url)', (iconDomains.get('(invalid-url)') ?? 0) + 1);
          }
        }
        if (episodes.length && episodeSamples.length < 12) {
          episodeSamples.push({
            title,
            channel: attribute(block.slice(0, block.indexOf('>') + 1), 'channel'),
            categories,
            episodes: episodes.map((e) => ({
              system: attribute(e.opening, 'system') ?? null,
              value: e.text,
            })),
          });
        }

        if (wantedTitle.test(title) && interestingSamples.length < 100) {
          interestingSamples.push({
            title,
            channel: attribute(block.slice(0, block.indexOf('>') + 1), 'channel'),
            start: attribute(block.slice(0, block.indexOf('>') + 1), 'start'),
            categories,
            subtitle: firstText(block, 'sub-title') ?? null,
            desc: firstText(block, 'desc') ?? null,
            episodeNum: episodes.map((e) => ({
              system: attribute(e.opening, 'system') ?? null,
              value: e.text,
            })),
            date: firstText(block, 'date') ?? null,
            country: allElementTexts(block, 'country').map((x) => x.text),
            language: allElementTexts(block, 'language').map((x) => x.text),
            credits: {
              director: allElementTexts(block, 'director').map((x) => x.text),
              actor: allElementTexts(block, 'actor').map((x) => x.text).slice(0, 8),
              presenter: allElementTexts(block, 'presenter').map((x) => x.text).slice(0, 8),
            },
            live: hasTag(block, 'live'),
            previouslyShown: hasTag(block, 'previously-shown'),
            new: hasTag(block, 'new'),
            premiere: hasTag(block, 'premiere'),
            programmeIcon: hasTag(block, 'icon'),
            iconSrc: iconSrc ?? null,
            rating: firstText(block, 'rating') ?? null,
          });
        }
      }

      const pct = (n: number) => (blocks.length ? Math.round((n / blocks.length) * 10000) / 100 : 0);
      const sortedMap = (map: Map<string, number>, limit = 100) =>
        [...map.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, limit)
          .map(([value, count]) => ({ value, count }));

      const summary = {
        capturedAt: new Date().toISOString(),
        source: URL,
        rawBytes: Buffer.byteLength(xml, 'utf8'),
        requestedChannels: [...requested],
        programmeRows: blocks.length,
        fieldPresence: Object.fromEntries(
          Object.entries(presence).map(([tag, count]) => [tag, { count, pct: pct(count) }]),
        ),
        nestedFieldPresence: Object.fromEntries(
          Object.entries(nestedPresence).map(([tag, count]) => [tag, { count, pct: pct(count) }]),
        ),
        categories: {
          countDistribution: categoryCountDistribution,
          multipleCategoryRows: multipleCategories,
          multipleCategoryPct: pct(multipleCategories),
          uniqueValues: categoryValues.size,
          topValues: sortedMap(categoryValues, 100),
          uniqueSecondaryValues: secondaryCategoryValues.size,
          topSecondaryValues: sortedMap(secondaryCategoryValues, 100),
          topCombinations: sortedMap(combinations, 120),
        },
        episodeNums: {
          systems: sortedMap(episodeSystems, 50),
          samples: episodeSamples,
        },
        programmeIcons: {
          uniqueUrls: iconUrls.size,
          topDomains: sortedMap(iconDomains, 20),
          mostReused: sortedMap(iconUrls, 20),
        },
        samples: interestingSamples,
      };

      console.log('RAW_XMLTV_RICHNESS_START');
      console.log(JSON.stringify(summary));
      console.log('RAW_XMLTV_RICHNESS_END');

      expect(blocks.length).toBeGreaterThan(0);
    },
    180_000,
  );
});
