const RSS_URL = 'https://www.tvgids.nl/tips.rss';
const GUIDE_URL = 'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/guide-schedule';
const USER_AGENT = 'Teevee technical spike/2026-09-22 (+https://github.com/zuiderwijk/teevee)';

function decodeXml(value = '') {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/i, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function textOf(xml, tag) {
  const re = new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i');
  const match = xml.match(re);
  return match ? decodeXml(match[1]) : null;
}

function elementNames(xml) {
  return [...xml.matchAll(/<([A-Za-z_][\w:.-]*)\b[^>]*>/g)].map((m) => m[1]);
}

function lineairIds(value = '') {
  return [...value.matchAll(/\/lineair\/(\d+)/gi)].map((m) => m[1]);
}

function stripHtml(html = '') {
  return decodeXml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  );
}

async function fetchText(url, init = {}) {
  const response = await fetch(url, {
    redirect: 'follow',
    ...init,
    headers: {
      'User-Agent': USER_AGENT,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get('content-type'),
    finalUrl: response.url,
    text,
  };
}

async function inspectRss() {
  const response = await fetchText(RSS_URL, {
    headers: { Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1' },
  });
  console.log('SPIKE_RSS_RESPONSE ' + JSON.stringify({
    url: RSS_URL,
    ok: response.ok,
    status: response.status,
    contentType: response.contentType,
    bytes: Buffer.byteLength(response.text),
    finalUrl: response.finalUrl,
  }));
  if (!response.ok) throw new Error('RSS fetch failed: ' + response.status);

  const rssOpen = (response.text.match(/<rss\b([^>]*)>/i) || [])[1] || '';
  const namespaces = Object.fromEntries(
    [...rssOpen.matchAll(/xmlns:([\w-]+)=["']([^"']+)["']/g)].map((m) => [m[1], m[2]]),
  );
  const channelBlock = (response.text.match(/<channel\b[^>]*>([\s\S]*?)<\/channel>/i) || [])[1] || '';
  const itemBlocks = [...response.text.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

  const items = itemBlocks.slice(0, 100).map((xml, index) => {
    const title = textOf(xml, 'title');
    const link = textOf(xml, 'link');
    const guid = textOf(xml, 'guid');
    const pubDate = textOf(xml, 'pubDate');
    const description = textOf(xml, 'description');
    const contentEncoded = textOf(xml, 'content:encoded');
    const start = textOf(xml, 'start');
    const end = textOf(xml, 'end');
    const channelName = textOf(xml, 'channel_name');
    const category = textOf(xml, 'category');
    return {
      index,
      title,
      link,
      guid,
      pubDate,
      start,
      end,
      channelName,
      category,
      descriptionLength: description ? description.length : 0,
      contentEncodedLength: contentEncoded ? contentEncoded.length : 0,
      elementNames: [...new Set(elementNames(xml))],
      idsByField: {
        title: lineairIds(title || ''),
        link: lineairIds(link || ''),
        guid: lineairIds(guid || ''),
        description: lineairIds(description || ''),
        contentEncoded: lineairIds(contentEncoded || ''),
        raw: lineairIds(xml),
      },
    };
  });

  console.log('SPIKE_RSS_SCHEMA ' + JSON.stringify({
    namespaces,
    channelElements: [...new Set(elementNames(channelBlock))],
    itemCount: itemBlocks.length,
    sampleItemElements: [...new Set(items.flatMap((item) => item.elementNames))],
    fields: ['title', 'link', 'guid', 'pubDate', 'start', 'end', 'channel_name', 'category', 'description', 'content:encoded'],
  }));
  console.log('SPIKE_RSS_ITEMS ' + JSON.stringify(items));
  return items;
}

async function inspectLinkedPages(items) {
  const candidates = items.filter((item) => item.link).slice(0, 8);
  const results = [];
  for (const item of candidates) {
    const response = await fetchText(item.link, { headers: { Accept: 'text/html,*/*;q=0.5' } });
    const plain = stripHtml(response.text);
    const timeMatches = [...plain.matchAll(/\b([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d\b/g)]
      .slice(0, 8)
      .map((m) => m[0]);
    const dateMatches = [...plain.matchAll(/\b\d{1,2}\s+(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+2026\b/gi)]
      .slice(0, 8)
      .map((m) => m[0]);
    const channelMatches = [...new Set(
      [...plain.matchAll(/\b(NPO\s*[123]|RTL\s*[4578Z]|SBS\s*6|NET\s*5|Veronica(?:\s*\/\s*Disney XD)?|SBS\s*9)\b/gi)]
        .map((m) => m[1]),
    )].slice(0, 8);
    const ogTitle = (response.text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) || [])[1] || null;
    const h1Block = (response.text.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i) || [])[0] || '';
    results.push({
      sourceIndex: item.index,
      sourceTitle: item.title,
      requestedUrl: item.link,
      ok: response.ok,
      status: response.status,
      finalUrl: response.finalUrl,
      lineairIds: [...new Set([...lineairIds(response.finalUrl), ...lineairIds(response.text)])].slice(0, 20),
      ogTitle,
      h1: stripHtml(h1Block),
      timeMatches,
      dateMatches,
      channelMatches,
      textSnippet: plain.slice(0, 1200),
    });
  }
  console.log('SPIKE_LINKED_PAGES ' + JSON.stringify(results));
}

async function inspectTeeveeSchedule() {
  const windows = [];
  const start = new Date(Date.UTC(2026, 8, 20, 4, 0, 0));
  for (let i = 0; i < 10; i += 1) {
    const from = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    windows.push({ from: from.toISOString(), to: to.toISOString() });
  }

  const all = [];
  const windowResults = [];
  for (const window of windows) {
    const response = await fetchText(GUIDE_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(window),
    });
    let payload = null;
    try { payload = JSON.parse(response.text); } catch {}
    const schedule = payload && payload.status === 'ok' ? payload.schedule : null;
    if (schedule && schedule.programmes) all.push(...schedule.programmes);
    windowResults.push({
      ...window,
      httpStatus: response.status,
      apiStatus: payload ? payload.status || null : null,
      channels: schedule && schedule.channels ? schedule.channels.length : 0,
      programmes: schedule && schedule.programmes ? schedule.programmes.length : 0,
      generatedAt: schedule ? schedule.generatedAt || null : null,
      error: payload && payload.error ? payload.error : null,
    });
  }
  const programmes = [...new Map(all.map((p) => [p.id, p])).values()];
  console.log('SPIKE_TEEVEE_SCHEDULE ' + JSON.stringify({
    windows: windowResults,
    uniqueProgrammes: programmes.length,
    sample: programmes.slice(0, 12),
  }));
}

async function main() {
  console.log('SPIKE_META ' + JSON.stringify({
    capturedAt: new Date().toISOString(),
    rssUrl: RSS_URL,
    guideUrl: GUIDE_URL,
    requestedHorizon: 'D-2..D+7 television days for 2026-09-22, Europe/Amsterdam',
  }));
  const items = await inspectRss();
  await inspectLinkedPages(items);
  await inspectTeeveeSchedule();
}

main().catch((error) => {
  console.error('SPIKE_ERROR', error);
  process.exitCode = 1;
});
