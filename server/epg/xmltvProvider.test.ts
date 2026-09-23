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
    <category>Actualiteit</category>
    <episode-num system="onscreen">S2 E3</episode-num>
    <credits>
      <actor>Nieuwslezer</actor>
      <director>Regisseur</director>
    </credits>
    <live />
  </programme>
  <programme start="20260914190000 +0200" stop="20260914200000 +0200" channel="npo1.nl">
    <title>Programma twee</title>
    <credits><actor>Presentator</actor></credits>
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
      categories: ['Nieuws', 'Actualiteit'],
      episodeNumbers: [{ system: 'onscreen', value: 'S2 E3' }],
      credits: {
        director: ['Regisseur'],
        actor: ['Nieuwslezer'],
        producer: [],
      },
      hasDirectorCredit: true,
      isLive: true,
    });
    expect(parsed.programmes[1]?.programme).toMatchObject({
      hasDirectorCredit: false,
      isRepeat: true,
    });
  });

  it('preserves proven YYYY production evidence and role-preserving Film credits', () => {
    const parsed = parseXmltvDocument(`
      <tv>
        <channel id="film"><display-name>Film</display-name></channel>
        <programme start="20260914200000 +0200" stop="20260914220000 +0200" channel="film">
          <title>Billy Elliot</title>
          <date>2000</date>
          <category>Drama</category>
          <category>Film</category>
          <credits>
            <director>Stephen Daldry</director>
            <director>Regisseur &amp; Co</director>
            <actor>Julie Walters</actor>
            <actor>Jamie Bell</actor>
            <producer>Jon Finn</producer>
            <producer>Greg Brenman</producer>
          </credits>
        </programme>
      </tv>
    `);

    expect(parsed.programmes[0]?.programme).toMatchObject({
      productionDate: { raw: '2000', year: 2000 },
      credits: {
        director: ['Stephen Daldry', 'Regisseur & Co'],
        actor: ['Julie Walters', 'Jamie Bell'],
        producer: ['Jon Finn', 'Greg Brenman'],
      },
      hasDirectorCredit: true,
    });
  });

  it('keeps non-YYYY date evidence opaque instead of pretending it is a universal calendar date', () => {
    const parsed = parseXmltvDocument(`
      <tv>
        <channel id="date"><display-name>Date</display-name></channel>
        <programme start="20260914200000 +0200" stop="20260914210000 +0200" channel="date">
          <title>Future provider date shape</title>
          <date>2026-09-14</date>
        </programme>
        <programme start="20260914210000 +0200" stop="20260914220000 +0200" channel="date">
          <title>No date</title>
        </programme>
      </tv>
    `);

    expect(parsed.programmes[0]?.programme.productionDate).toEqual({
      raw: '2026-09-14',
    });
    expect(parsed.programmes[1]?.programme.productionDate).toBeUndefined();
  });

  it('preserves actor as the provider role, filters empty names and deduplicates deterministically', () => {
    const source = `
      <tv>
        <channel id="news"><display-name>News</display-name></channel>
        <programme start="20260914200000 +0200" stop="20260914210000 +0200" channel="news">
          <title>Hart van Nederland</title>
          <credits>
            <actor>Maarten Steendam</actor>
            <actor> Maarten   Steendam </actor>
            <actor>Sandra Schuurhof</actor>
            <actor>Tom &amp; Jerry</actor>
            <actor>   </actor>
            <director></director>
            <producer>Jos&#233; Producer</producer>
            <producer>Jos&#xE9; Producer</producer>
          </credits>
        </programme>
      </tv>
    `;

    const first = parseXmltvDocument(source);
    const second = parseXmltvDocument(source);
    const programme = first.programmes[0]?.programme;

    expect(first).toEqual(second);
    expect(programme?.credits).toEqual({
      director: [],
      actor: ['Maarten Steendam', 'Sandra Schuurhof', 'Tom & Jerry'],
      producer: ['José Producer'],
    });
    expect(programme).not.toHaveProperty('cast');
    expect(programme?.hasDirectorCredit).toBe(true);
  });

  it('leaves credit evidence absent when the provider supplies no credits block', () => {
    const parsed = parseXmltvDocument(`
      <tv>
        <channel id="plain"><display-name>Plain</display-name></channel>
        <programme start="20260914200000 +0200" stop="20260914210000 +0200" channel="plain">
          <title>Plain programme</title>
        </programme>
      </tv>
    `);

    expect(parsed.programmes[0]?.programme.credits).toBeUndefined();
    expect(parsed.programmes[0]?.programme.hasDirectorCredit).toBeUndefined();
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
