const FEED_URL = 'https://iptv-epg.org/files/epg-nl.xml';

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
  headers: { 'user-agent': 'Teevee/EPG-channel-inventory-research' },
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
  const icon = decodeXml((body.match(/<icon\b[^>]*\bsrc=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1] ?? '').trim());
  channels.push({ id, displayNames, icon: icon || null });
}

const counts = new Map();
const firstStart = new Map();
const lastStart = new Map();
for (const match of xml.matchAll(/<programme\b([^>]*)>/gi)) {
  const attrs = match[1] ?? '';
  const channelId = decodeXml((attrs.match(/\bchannel=["']([^"']+)["']/i)?.[1] ?? '').trim());
  const start = (attrs.match(/\bstart=["']([^"']+)["']/i)?.[1] ?? '').trim();
  if (!channelId) continue;
  counts.set(channelId, (counts.get(channelId) ?? 0) + 1);
  if (start) {
    const first = firstStart.get(channelId);
    const last = lastStart.get(channelId);
    if (!first || start < first) firstStart.set(channelId, start);
    if (!last || start > last) lastStart.set(channelId, start);
  }
}

const inventory = channels.map((channel, index) => ({
  sourceOrder: index + 1,
  id: channel.id,
  displayNames: channel.displayNames,
  programmeCount: counts.get(channel.id) ?? 0,
  firstStart: firstStart.get(channel.id) ?? null,
  lastStart: lastStart.get(channel.id) ?? null,
  hasIcon: Boolean(channel.icon),
}));

const programmeChannelIds = [...counts.keys()];
const unknownProgrammeChannelIds = programmeChannelIds.filter(
  (id) => !channels.some((channel) => channel.id === id),
);

console.log('EPG_CHANNEL_META ' + JSON.stringify({
  observedAt: new Date().toISOString(),
  url: FEED_URL,
  responseContentType: response.headers.get('content-type'),
  bytes: Buffer.byteLength(xml),
  channelCount: channels.length,
  channelIdsUnique: new Set(channels.map((channel) => channel.id)).size,
  totalProgrammes: [...counts.values()].reduce((sum, count) => sum + count, 0),
  channelsWithProgrammes: inventory.filter((channel) => channel.programmeCount > 0).length,
  channelsWithoutProgrammes: inventory.filter((channel) => channel.programmeCount === 0).length,
  unknownProgrammeChannelIds,
}));

for (const channel of inventory) {
  console.log('EPG_CHANNEL ' + JSON.stringify(channel));
}
