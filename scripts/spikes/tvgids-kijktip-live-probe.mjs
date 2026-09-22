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

function normalizeComparable(value = '') {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('nl-NL')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/^[\s\p{P}]+|[\s\p{P}]+$/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeChannel(value = '') {
  return normalizeComparable(value).replace(/\s+/g, '');
}

function evaluateMatches(items, schedule) {
  const channelByAlias = new Map();
  for (const channel of schedule.channels) {
    for (const alias of [channel.name, channel.displayName, channel.shortName].filter(Boolean)) {
      channelByAlias.set(normalizeChannel(alias), channel.id);
    }
  }

  const okWindows = schedule.windows.filter((window) => window.apiStatus === 'ok');
  const withinOkWindow = (ms) => okWindows.some((window) => ms >= Date.parse(window.from) && ms < Date.parse(window.to));

  const results = items.map((item) => {
    const startMs = Date.parse(item.start || '');
    const canonicalChannelId = channelByAlias.get(normalizeChannel(item.channelName || '')) || null;
    const inCoverage = Number.isFinite(startMs) && withinOkWindow(startMs);
    if (!inCoverage) return { index: item.index, title: item.title, channelName: item.channelName, start: item.start, status: 'outside-canonical-coverage' };
    if (!canonicalChannelId) return { index: item.index, title: item.title, channelName: item.channelName, start: item.start, status: 'unsupported-channel' };

    const wantedTitle = normalizeComparable(item.title || '');
    const sameChannel = schedule.programmes.filter((p) => p.channelId === canonicalChannelId);
    const sameTitle = sameChannel.filter((p) => normalizeComparable(p.title) === wantedTitle);
    const candidates = sameTitle
      .map((p) => ({ ...p, startDeltaMinutes: Math.abs(Date.parse(p.startAt) - startMs) / 60000 }))
      .filter((p) => p.startDeltaMinutes <= 5)
      .sort((a, b) => a.startDeltaMinutes - b.startDeltaMinutes);

    if (candidates.length === 1) {
      const match = candidates[0];
      return {
        index: item.index,
        title: item.title,
        channelName: item.channelName,
        start: item.start,
        status: 'matched',
        programmeId: match.id,
        canonicalTitle: match.title,
        canonicalStartAt: match.startAt,
        startDeltaMinutes: match.startDeltaMinutes,
      };
    }
    if (candidates.length > 1) {
      return { index: item.index, title: item.title, channelName: item.channelName, start: item.start, status: 'ambiguous', candidateCount: candidates.length };
    }

    const nearestSameTitle = sameTitle
      .map((p) => ({ title: p.title, startAt: p.startAt, deltaMinutes: Math.abs(Date.parse(p.startAt) - startMs) / 60000 }))
      .sort((a, b) => a.deltaMinutes - b.deltaMinutes)
      .slice(0, 3);
    const nearestByTime = sameChannel
      .map((p) => ({ title: p.title, startAt: p.startAt, deltaMinutes: Math.abs(Date.parse(p.startAt) - startMs) / 60000 }))
      .sort((a, b) => a.deltaMinutes - b.deltaMinutes)
      .slice(0, 3);
    return {
      index: item.index,
      title: item.title,
      channelName: item.channelName,
      start: item.start,
      status: sameTitle.length ? 'time-mismatch' : 'title-mismatch',
      nearestSameTitle,
      nearestByTime,
    };
  });

  const counts = Object.fromEntries([...new Set(results.map((r) => r.status))].map((status) => [status, results.filter((r) => r.status === status).length]));
  const eligible = results.filter((r) => !['outside-canonical-coverage', 'unsupported-channel'].includes(r.status));
  const matched = eligible.filter((r) => r.status === 'matched').length;
  const empiricalMatchRate = eligible.length ? matched / eligible.length : 0;

  console.log('SPIKE_MATCH_SUMMARY ' + JSON.stringify({
    totalItems: items.length,
    counts,
    eligibleItems: eligible.length,
    matchedItems: matched,
    empiricalMatchRate,
    sourceIdItems: items.filter((item) => Object.values(item.idsByField).flat().length > 0).length,
    rules: {
      title: 'small deterministic normalization + exact equality',
      channel: 'explicit canonical channel alias',
      startToleranceMinutes: 5,
      candidateCardinality: 'exactly one',
    },
  }));
  console.log('SPIKE_MATCH_RESULTS ' + JSON.stringify(results));
  return results;
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
  const allChannels = [];
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
    if (schedule && schedule.channels) allChannels.push(...schedule.channels);
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
  const channels = [...new Map(allChannels.map((channel) => [channel.id, channel])).values()];
  console.log('SPIKE_TEEVEE_SCHEDULE ' + JSON.stringify({
    windows: windowResults,
    uniqueProgrammes: programmes.length,
    channels,
    sample: programmes.slice(0, 12),
  }));
  return { windows: windowResults, programmes, channels };
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
  const schedule = await inspectTeeveeSchedule();
  evaluateMatches(items, schedule);
}

main().catch((error) => {
  console.error('SPIKE_ERROR', error);
  process.exitCode = 1;
});
