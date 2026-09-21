import { describe, expect, it, vi } from 'vitest';

import { parseXmltvDocument, parseXmltvTimestamp, XmltvEpgProvider } from './xmltvProvider';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tv>
  <channel id="npo1.nl">
    <display-name lang="nl">NPO 1</display-name>
    <icon src="https://example.test/npo1.png" />
  </channel>
  <channel id="rtl4.nl"><display-name>RTL 4</display-name></channel>
  <programme start="20260914180000 +0200" stop="20260914190000 +0200" channel="npo1.nl">
    <title lang="nl">Nieuws &amp; Actualiteiten</title>
    <sub-title>Avond</sub-title>
    <desc><![CDATA[Het laatste nieuws.]]></desc>
    <category>Nieuws</category>
    <live />
  </programme>
  <programme start="20260914190000 +0200" stop="20260914200000 +0200" channel="npo1.nl">
    <title>Programma twee</title>
    <previously-shown />
  </programme>
  <programme start="20260914180000 +0200" stop="20260914183000 +0200" channel="rtl4.nl">
    <title>RTL vroeg</title>
  </programme>
  <programme start="20260914184500 +0200" stop="20260914200000 +0200" channel="rtl4.nl">
    <title>RTL laat</title>
  </programme>
</tv>`;

function response(body = xml, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'application/xml' } });
}

describe('parseXmltvTimestamp', () => {
  it('normalises XMLTV timestamps with explicit offsets to UTC', () => {
    expect(parseXmltvTimestamp('20260914203000 +0200')).toBe('2026-09-14T18:30:00.000Z');
    expect(parseXmltvTimestamp('20261025023000 +0100')).toBe('2026-10-25T01:30:00.000Z');
  });

  it('refuses ambiguous timestamps without an offset', () => {
    expect(parseXmltvTimestamp('20260914203000')).toBeUndefined();
    expect(parseXmltvTimestamp('not-a-date')).toBeUndefined();
  });
});

describe('parseXmltvDocument', () => {
  it('extracts neutral channels and programme metadata without provider leakage', () => {
    const parsed = parseXmltvDocument(xml);

    expect(parsed.channels).toEqual([
      {
        id: 'npo1.nl',
        name: 'NPO 1',
        displayName: 'NPO 1',
        logoUrl: 'https://example.test/npo1.png',
      },
      { id: 'rtl4.nl', name: 'RTL 4', displayName: 'RTL 4' },
    ]);
    expect(parsed.programmes[0]?.programme).toEqual({
      channelId: 'npo1.nl',
      startAt: '2026-09-14T16:00:00.000Z',
      endAt: '2026-09-14T17:00:00.000Z',
      title: 'Nieuws & Actualiteiten',
      subtitle: 'Avond',
      description: 'Het laatste nieuws.',
      genre: 'Nieuws',
      isLive: true,
    });
    expect(parsed.programmes[1]?.programme.isRepeat).toBe(true);
  });

  it('keeps malformed external timestamps representable for downstream diagnostics', () => {
    const parsed = parseXmltvDocument(`
      <tv>
        <channel id="broken"><display-name>Broken</display-name></channel>
        <programme start="bad-start" stop="20260914190000 +0200" channel="broken">
          <title>Test</title>
        </programme>
      </tv>
    `);

    expect(parsed.programmes[0]?.programme.startAt).toBe('bad-start');
    expect(parsed.programmes[0]?.startMs).toBeNull();
  });
});

describe('XmltvEpgProvider', () => {
  it('loads channels through an injectable server-side fetch boundary', async () => {
    const fetcher = vi.fn(async () => response());
    const provider = new XmltvEpgProvider({ url: 'https://feed.test/nl.xml', fetcher });

    await expect(provider.getChannels()).resolves.toMatchObject([
      { id: 'npo1.nl', displayName: 'NPO 1' },
      { id: 'rtl4.nl', displayName: 'RTL 4' },
    ]);
    expect(fetcher).toHaveBeenCalledWith('https://feed.test/nl.xml', {
      headers: { Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.1' },
    });
  });

  it('marks a requested window complete only when every requested channel is continuously covered', async () => {
    const fetcher = vi.fn(async () => response());
    const provider = new XmltvEpgProvider({ fetcher });
    const from = new Date('2026-09-14T16:00:00.000Z');
    const to = new Date('2026-09-14T18:00:00.000Z');

    const npo = await provider.getSchedule({ from, to, channelIds: ['npo1.nl'] });
    const both = await provider.getSchedule({ from, to, channelIds: ['npo1.nl', 'rtl4.nl'] });

    expect(npo.coverage).toBe('complete');
    expect(npo.programmes).toHaveLength(2);
    expect(both.coverage).toBe('partial');
    expect(both.programmes).toHaveLength(4);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('returns only programmes intersecting the explicit [from,to) query', async () => {
    const provider = new XmltvEpgProvider({ fetcher: vi.fn(async () => response()) });
    const result = await provider.getSchedule({
      from: new Date('2026-09-14T17:00:00.000Z'),
      to: new Date('2026-09-14T17:30:00.000Z'),
      channelIds: ['npo1.nl'],
    });

    expect(result.coverage).toBe('complete');
    expect(result.programmes.map(({ title }) => title)).toEqual(['Programma twee']);
  });

  it('propagates upstream HTTP failures without fabricating empty authoritative coverage', async () => {
    const provider = new XmltvEpgProvider({ fetcher: vi.fn(async () => response('unavailable', 503)) });

    await expect(
      provider.getSchedule({
        from: new Date('2026-09-14T16:00:00Z'),
        to: new Date('2026-09-14T17:00:00Z'),
        channelIds: ['npo1.nl'],
      }),
    ).rejects.toThrow('HTTP 503');
  });
});
