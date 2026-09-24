import { describe, expect, it, vi } from 'vitest';

import {
  parseXmltvDocument,
  parseXmltvScheduleStream,
  parseXmltvTimestamp,
  XmltvEpgProvider,
} from './xmltvProvider';

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

function streamFromChunks(chunks: readonly string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

function tinyChunks(source: string, size = 3): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < source.length; index += size) {
    chunks.push(source.slice(index, index + size));
  }
  return chunks;
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

  it('marks independent requested windows complete only when every requested channel is continuously covered in one provider session', async () => {
    const fetcher = vi.fn(async () => response());
    const provider = new XmltvEpgProvider({ fetcher });
    const from = new Date('2026-09-14T16:00:00.000Z');
    const to = new Date('2026-09-14T18:00:00.000Z');

    const [npo, both] = await provider.getSchedules([
      { from, to, channelIds: ['npo1.nl'] },
      { from, to, channelIds: ['npo1.nl', 'rtl4.nl'] },
    ]);

    expect(npo?.coverage).toBe('complete');
    expect(npo?.programmes).toHaveLength(2);
    expect(both?.coverage).toBe('partial');
    expect(both?.programmes).toHaveLength(4);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('preserves all-channel query semantics when channelIds are omitted', async () => {
    const provider = new XmltvEpgProvider({ fetcher: vi.fn(async () => response()) });
    const result = await provider.getSchedule({
      from: new Date('2026-09-14T16:00:00.000Z'),
      to: new Date('2026-09-14T18:00:00.000Z'),
    });

    expect(result.coverage).toBe('partial');
    expect(result.programmes.map(({ title }) => title)).toEqual([
      'Nieuws & Actualiteiten',
      'Programma twee',
      'RTL vroeg',
      'RTL laat',
    ]);
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


describe('parseXmltvScheduleStream', () => {
  it('preserves current XMLTV evidence semantics when every opening/closing tag crosses tiny stream chunks', async () => {
    const from = new Date('2026-09-14T16:00:00.000Z');
    const to = new Date('2026-09-14T18:00:00.000Z');
    const result = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(xml, 3)), [
      { from, to, channelIds: ['npo1.nl'] },
    ]);

    expect(result.channels).toEqual([
      {
        id: 'npo1.nl',
        name: 'NPO 1',
        displayName: 'NPO 1',
        logoUrl: 'https://example.test/npo1.png',
      },
    ]);
    expect(result.batches).toEqual([
      {
        coverage: 'complete',
        programmes: [
          {
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
          },
          {
            channelId: 'npo1.nl',
            startAt: '2026-09-14T17:00:00.000Z',
            endAt: '2026-09-14T18:00:00.000Z',
            title: 'Programma twee',
            credits: {
              director: [],
              actor: ['Presentator'],
              producer: [],
            },
            hasDirectorCredit: false,
            isRepeat: true,
          },
        ],
      },
    ]);
    expect(result.stats.programmeBlocksScanned).toBe(4);
    expect(result.stats.programmeBlocksMaterialised).toBe(2);
  });

  it('keeps CDATA closing-tag text opaque to the top-level scanner', async () => {
    const source = String.raw`<tv>
      <channel id="one"><display-name>One</display-name></channel>
      <programme start="20260914180000 +0200" stop="20260914190000 +0200" channel="one">
        <title>CDATA test</title>
        <desc><![CDATA[Literal </programme> text &amp; more]]></desc>
      </programme>
    </tv>`;
    const result = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(source, 5)), [
      {
        from: new Date('2026-09-14T16:00:00Z'),
        to: new Date('2026-09-14T17:00:00Z'),
        channelIds: ['one'],
      },
    ]);

    expect(result.batches[0]?.programmes).toEqual([
      expect.objectContaining({
        title: 'CDATA test',
        description: 'Literal text & more',
      }),
    ]);
  });

  it('treats comments as opaque before interpreting CDATA-like or programme-closing text inside them', async () => {
    const source = String.raw`<tv>
      <channel id="one"><display-name>One</display-name></channel>
      <programme start="20260914180000 +0200" stop="20260914190000 +0200" channel="one">
        <title>Comment-safe scanner</title>
        <!-- literal <![CDATA[ and </programme> markers are not structural -->
        <desc>Still inside the programme.</desc>
      </programme>
      <programme start="20260914190000 +0200" stop="20260914200000 +0200" channel="one">
        <title>Following programme</title>
      </programme>
    </tv>`;
    const result = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(source, 5)), [
      {
        from: new Date('2026-09-14T16:00:00Z'),
        to: new Date('2026-09-14T18:00:00Z'),
        channelIds: ['one'],
      },
    ]);

    expect(result.batches[0]?.programmes.map(({ title }) => title)).toEqual([
      'Comment-safe scanner',
      'Following programme',
    ]);
    expect(result.batches[0]?.coverage).toBe('complete');
  });
  it('keeps source and scan-buffer indices aligned across Unicode uppercase programme text', async () => {
    const source = String.raw`<tv>
      <channel id="one"><display-name>One</display-name></channel>
      <programme start="20260914180000 +0200" stop="20260914190000 +0200" channel="one">
        <title>İstanbul Één</title>
        <desc>Unicode content must not shift structural indices.</desc>
      </programme>
      <programme start="20260914190000 +0200" stop="20260914200000 +0200" channel="one">
        <title>Volgende</title>
      </programme>
    </tv>`;
    const result = await parseXmltvScheduleStream(streamFromChunks([source]), [
      {
        from: new Date('2026-09-14T16:00:00Z'),
        to: new Date('2026-09-14T18:00:00Z'),
        channelIds: ['one'],
      },
    ]);

    expect(result.batches[0]?.programmes.map(({ title }) => title)).toEqual([
      'İstanbul Één',
      'Volgende',
    ]);
    expect(result.batches[0]?.coverage).toBe('complete');
  });
  it('preserves production date, complete categories, credits, episode numbers and live/repeat tri-state', async () => {
    const source = String.raw`<tv>
      <channel id="film"><display-name>Film</display-name></channel>
      <programme start="20260914200000 +0200" stop="20260914220000 +0200" channel="film">
        <title>Billy &amp; Elliot</title>
        <sub-title><![CDATA[Episode <one>]]></sub-title>
        <desc>Beschrijving &lt;test&gt;</desc>
        <date>2000</date>
        <category>Drama</category>
        <category>Film</category>
        <episode-num system="xmltv_ns">1.2.</episode-num>
        <credits>
          <director>Stephen Daldry</director>
          <director>Stephen Daldry</director>
          <actor>Julie Walters</actor>
          <producer>Jon Finn</producer>
        </credits>
        <live />
        <previously-shown />
      </programme>
    </tv>`;
    const streamed = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(source, 7)), [
      {
        from: new Date('2026-09-14T18:00:00Z'),
        to: new Date('2026-09-14T20:00:00Z'),
        channelIds: ['film'],
      },
    ]);
    const document = parseXmltvDocument(source);

    expect(streamed.batches[0]?.programmes[0]).toEqual(document.programmes[0]?.programme);
    expect(streamed.batches[0]?.programmes[0]).toMatchObject({
      productionDate: { raw: '2000', year: 2000 },
      categories: ['Drama', 'Film'],
      episodeNumbers: [{ system: 'xmltv_ns', value: '1.2.' }],
      credits: {
        director: ['Stephen Daldry'],
        actor: ['Julie Walters'],
        producer: ['Jon Finn'],
      },
      hasDirectorCredit: true,
      isLive: true,
      isRepeat: true,
    });
  });

  it('requires explicit timezone offsets and does not retain malformed-timestamp programmes in a bounded schedule', async () => {
    const source = String.raw`<tv>
      <channel id="one"><display-name>One</display-name></channel>
      <programme start="20260914180000" stop="20260914190000 +0200" channel="one">
        <title>Ambiguous start</title>
      </programme>
    </tv>`;
    const result = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(source, 4)), [
      {
        from: new Date('2026-09-14T16:00:00Z'),
        to: new Date('2026-09-14T17:00:00Z'),
        channelIds: ['one'],
      },
    ]);

    expect(result.batches[0]).toEqual({ coverage: 'partial', programmes: [] });
    expect(result.stats.programmeBlocksScanned).toBe(1);
    expect(result.stats.programmeBlocksMaterialised).toBe(0);
  });

  it('retains a programme that overlaps the requested window by one side and excludes touching non-overlaps', async () => {
    const source = String.raw`<tv>
      <channel id="one"><display-name>One</display-name></channel>
      <programme start="20260914150000 +0000" stop="20260914160000 +0000" channel="one"><title>Ends at from</title></programme>
      <programme start="20260914153000 +0000" stop="20260914163000 +0000" channel="one"><title>Overlaps from</title></programme>
      <programme start="20260914163000 +0000" stop="20260914173000 +0000" channel="one"><title>Overlaps to</title></programme>
      <programme start="20260914170000 +0000" stop="20260914180000 +0000" channel="one"><title>Starts at to</title></programme>
    </tv>`;
    const result = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(source, 11)), [
      {
        from: new Date('2026-09-14T16:00:00Z'),
        to: new Date('2026-09-14T17:00:00Z'),
        channelIds: ['one'],
      },
    ]);

    expect(result.batches[0]?.programmes.map(({ title }) => title)).toEqual([
      'Overlaps from',
      'Overlaps to',
    ]);
    expect(result.batches[0]?.coverage).toBe('complete');
  });

  it('preserves complete, gap, no-programme and multi-channel coverage semantics independently', async () => {
    const source = String.raw`<tv>
      <channel id="one"><display-name>One</display-name></channel>
      <channel id="two"><display-name>Two</display-name></channel>
      <channel id="empty"><display-name>Empty</display-name></channel>
      <programme start="20260914160000 +0000" stop="20260914170000 +0000" channel="one"><title>One A</title></programme>
      <programme start="20260914170000 +0000" stop="20260914180000 +0000" channel="one"><title>One B</title></programme>
      <programme start="20260914160000 +0000" stop="20260914164500 +0000" channel="two"><title>Two A</title></programme>
      <programme start="20260914170000 +0000" stop="20260914180000 +0000" channel="two"><title>Two B</title></programme>
    </tv>`;
    const from = new Date('2026-09-14T16:00:00Z');
    const to = new Date('2026-09-14T18:00:00Z');
    const result = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(source, 13)), [
      { from, to, channelIds: ['one'] },
      { from, to, channelIds: ['two'] },
      { from, to, channelIds: ['empty'] },
      { from, to, channelIds: ['one', 'two'] },
    ]);

    expect(result.batches.map(({ coverage }) => coverage)).toEqual([
      'complete',
      'partial',
      'partial',
      'partial',
    ]);
    expect(result.batches[2]?.programmes).toEqual([]);
  });

  it('produces deterministic output regardless of network chunk boundaries', async () => {
    const query = {
      from: new Date('2026-09-14T16:00:00Z'),
      to: new Date('2026-09-14T18:00:00Z'),
      channelIds: ['npo1.nl', 'rtl4.nl'],
    };
    const tiny = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(xml, 2)), [query]);
    const coarse = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(xml, 97)), [query]);

    expect(tiny.channels).toEqual(coarse.channels);
    expect(tiny.batches).toEqual(coarse.batches);
  });

  it('bounds full programme materialisation to requested channel/window scope in a large irrelevant feed', async () => {
    const channels = ['wanted'];
    const programmeBlocks: string[] = [];
    const irrelevantDescription = 'x'.repeat(400);
    for (let channelIndex = 0; channelIndex < 183; channelIndex += 1) {
      const channelId = 'noise-' + channelIndex;
      channels.push(channelId);
      for (let programmeIndex = 0; programmeIndex < 220; programmeIndex += 1) {
        const minute = String(programmeIndex % 60).padStart(2, '0');
        programmeBlocks.push(
          '<programme start="20260913' +
            String(10 + (programmeIndex % 10)).padStart(2, '0') +
            minute +
            '00 +0000" stop="20260913' +
            String(10 + (programmeIndex % 10)).padStart(2, '0') +
            String((programmeIndex + 1) % 60).padStart(2, '0') +
            '00 +0000" channel="' +
            channelId +
            '"><title>Noise</title><desc>' +
            irrelevantDescription +
            '</desc></programme>',
        );
      }
    }
    for (let programmeIndex = 0; programmeIndex < 50; programmeIndex += 1) {
      programmeBlocks.push(
        '<programme start="20260923100000 +0000" stop="20260923110000 +0000" channel="wanted">' +
          '<title>Wanted channel, wrong window</title><desc>Must not be fully decoded</desc></programme>',
      );
    }
    programmeBlocks.push(
      '<programme start="20260924100000 +0000" stop="20260924110000 +0000" channel="wanted">' +
        '<title>Wanted</title><category>Film</category><date>2024</date></programme>',
    );
    const source =
      '<tv>' +
      channels
        .map((channelId) => '<channel id="' + channelId + '"><display-name>' + channelId + '</display-name></channel>')
        .join('') +
      programmeBlocks.join('') +
      '</tv>';

    const result = await parseXmltvScheduleStream(streamFromChunks(tinyChunks(source, 4096)), [
      {
        from: new Date('2026-09-24T10:00:00Z'),
        to: new Date('2026-09-24T11:00:00Z'),
        channelIds: ['wanted'],
      },
    ]);

    expect(result.stats.channelBlocksScanned).toBe(184);
    expect(result.stats.programmeBlocksScanned).toBe(40311);
    expect(result.stats.programmeTimestampHeadersParsed).toBe(51);
    expect(result.stats.programmeBlocksMaterialised).toBe(1);
    expect(result.stats.maxBufferedChars).toBeLessThan(source.length / 10);
    expect(result.channels).toEqual([
      { id: 'wanted', name: 'wanted', displayName: 'wanted' },
    ]);
    expect(result.batches[0]?.programmes).toEqual([
      expect.objectContaining({
        channelId: 'wanted',
        title: 'Wanted',
        productionDate: { raw: '2024', year: 2024 },
      }),
    ]);
  });
});
