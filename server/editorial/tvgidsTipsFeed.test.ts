import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import {
  parseTvgidsTipsFeedBytes,
  parseTvgidsTipsFeedXml,
} from './tvgidsTipsFeed';

function rss(item: string): string {
  return '<?xml version="1.0" encoding="ISO-8859-1"?><rss><channel>' +
    item +
    '</channel></rss>';
}

describe('TVgids tips RSS parsing', () => {
  it('decodes declared ISO-8859-1 before parsing non-ASCII content', () => {
    const xml = rss(
      '<item>' +
        '<title><![CDATA[Dwars door de Pyreneeën]]></title>' +
        '<link>https://www.tvgids.nl/tip/pyreneeen</link>' +
        '<guid>tip-1</guid>' +
        '<channel_name>NPO 1</channel_name>' +
        '<start>2026-09-22T20:30:00+02:00</start>' +
        '<end>2026-09-22T21:30:00+02:00</end>' +
        '<pubDate>Tue, 22 Sep 2026 08:00:00 +0200</pubDate>' +
      '</item>',
    );
    const bytes = new Uint8Array(Buffer.from(xml, 'latin1'));

    expect(
      parseTvgidsTipsFeedBytes(
        bytes,
        'application/rss+xml; charset=ISO-8859-1',
      ),
    ).toEqual({
      invalidItemCount: 0,
      items: [
        {
          sourceItemId: 'tip-1',
          sourceUrl: 'https://www.tvgids.nl/tip/pyreneeen',
          title: 'Dwars door de Pyreneeën',
          channelName: 'NPO 1',
          startAt: '2026-09-22T18:30:00.000Z',
          endAt: '2026-09-22T19:30:00.000Z',
          publishedAt: '2026-09-22T06:00:00.000Z',
        },
      ],
    });
  });

  it('counts malformed items without making valid siblings unsafe', () => {
    const parsed = parseTvgidsTipsFeedXml(
      rss(
        '<item>' +
          '<title>Valid</title><guid>ok</guid><channel_name>RTL 4</channel_name>' +
          '<start>2026-09-22T20:00:00Z</start><end>2026-09-22T21:00:00Z</end>' +
        '</item>' +
        '<item><title>Broken</title><guid>bad</guid></item>',
      ),
    );

    expect(parsed.items).toHaveLength(1);
    expect(parsed.invalidItemCount).toBe(1);
  });

  it('rejects a non-RSS payload instead of treating it as an empty authoritative source', () => {
    expect(() => parseTvgidsTipsFeedXml('<html>temporary error</html>')).toThrow(
      'not an RSS channel',
    );
  });
});
