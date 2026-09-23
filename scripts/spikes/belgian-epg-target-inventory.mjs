const FEED_URL = 'https://iptv-epg.org/files/epg-be.xml';

function decodeXml(value = '') {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const response = await fetch(FEED_URL, {
  headers: { 'user-agent': 'Teevee/Belgian-EPG-channel-research' },
});
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const xml = await response.text();

const channels = [];
for (const match of xml.matchAll(/<channel\b([^>]*)>([\s\S]*?)<\/channel>/gi)) {
  const attrs = match[1] ?? '';
  const body = match[2] ?? '';
  const id = decodeXml((attrs.match(/\bid=["']([^"']+)["']/i)?.[1] ?? '').trim());
  const displayNames = [...body.matchAll(/<display-name\b[^>]*>([\s\S]*?)<\/display-name>/gi)]
    .map((m) => decodeXml((m[1] ?? '').replace(/<[^>]+>/g, '').trim()))
    .filter(Boolean);
  channels.push({ id, displayNames });
}

const counts = new Map();
for (const match of xml.matchAll(/<programme\b([^>]*)>/gi)) {
  const attrs = match[1] ?? '';
  const channelId = decodeXml((attrs.match(/\bchannel=["']([^"']+)["']/i)?.[1] ?? '').trim());
  if (!channelId) continue;
  counts.set(channelId, (counts.get(channelId) ?? 0) + 1);
}

const inventory = channels.map((channel, index) => ({
  sourceOrder: index + 1,
  id: channel.id,
  displayNames: channel.displayNames,
  programmeCount: counts.get(channel.id) ?? 0,
}));

const targets = [
  'VRT 1', 'VRT Canvas', 'VTM', 'Play', 'Play Fictie', 'VTM2', 'VTM3', 'VTM4',
  'Play Actie', 'Play Reality', 'Play Crime', 'VTM Gold', 'Ketnet'
];

function norm(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const targetResults = targets.map((target) => {
  const wanted = norm(target);
  const matches = inventory.filter((row) =>
    [row.id, ...row.displayNames].some((value) => {
      const n = norm(value.replace(/^BE\s*-\s*/i, ''));
      return n === wanted || n.includes(wanted) || wanted.includes(n);
    })
  );
  return { target, matches };
});

console.log('BE_EPG_META ' + JSON.stringify({
  observedAt: new Date().toISOString(),
  url: FEED_URL,
  responseContentType: response.headers.get('content-type'),
  bytes: Buffer.byteLength(xml),
  channelCount: channels.length,
  uniqueChannelIds: new Set(channels.map((channel) => channel.id)).size,
  programmeCount: [...counts.values()].reduce((sum, count) => sum + count, 0),
}));

console.log('BE_EPG_TARGETS ' + JSON.stringify(targetResults));

for (const channel of inventory) {
  console.log('BE_EPG_CHANNEL ' + JSON.stringify(channel));
}
