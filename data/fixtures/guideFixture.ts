import type { Channel, GuideFixture, Programme } from '../domain/epg';

const START_MS = Date.parse('2026-09-11T00:00:00+02:00');
const HOUR_MS = 60 * 60 * 1000;

const primaryChannelNames = [
  'Publiek 1',
  'Publiek 2',
  'Publiek 3',
  'Vier',
  'Vijf',
  'Zes',
  'Zeven',
  'Acht',
  'Film',
  'Series',
  'Sport',
  'Nieuws',
  'Kids',
  'Docu',
  'Muziek',
  'Internationaal',
] as const;

const additionalChannelNames = [
  'Regionaal 1',
  'Regionaal 2',
  'Nieuws Extra',
  'Sport Extra 1',
  'Sport Extra 2',
  'Film Extra 1',
  'Film Extra 2',
  'Series Extra 1',
  'Series Extra 2',
  'Reality',
  'Lifestyle',
  'Food',
  'Travel',
  'History',
  'Science',
  'Nature',
  'Crime',
  'Comedy',
  'Drama',
  'Kids Extra 1',
  'Kids Extra 2',
  'Muziek Extra',
  'Cultuur',
  'Klassiek',
  'Internationaal 2',
  'Internationaal 3',
  'Nieuws Wereld',
  'Sport Wereld',
  'Film Wereld',
  'Series Wereld',
  'Documentaire 2',
  'Thema',
] as const;

const channelNames = [...primaryChannelNames, ...additionalChannelNames];

export const fixtureChannels: Channel[] = channelNames.map((name, index) => ({
  id: `channel-${index + 1}`,
  name,
  displayName: name,
  shortName: name.slice(0, 8),
  sortOrder: index,
  isActive: true,
}));

const titles = [
  'Ochtendnieuws',
  'De Grote Keuken',
  'Vandaag',
  'Studio Live',
  'Het Geheim van de Haven',
  'Binnenstebuiten',
  'Avondjournaal',
  'De Laatste Ronde',
  'Nachtfilm: Een Onverwacht Lange Titel voor een Programma',
  'Korte Update',
  'Documentaire',
  'De Wedstrijd',
] as const;

const durations = [30, 60, 45, 90, 120, 15, 75, 30, 150, 20, 55, 105] as const;

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function buildProgrammes(channel: Channel, channelIndex: number): Programme[] {
  const programmes: Programme[] = [];
  let cursor = START_MS;
  const end = START_MS + 49 * HOUR_MS;
  let sequence = 0;

  while (cursor < end) {
    const duration = durations[(sequence + channelIndex) % durations.length] ?? 60;
    const start = cursor;
    const programmeEnd = Math.min(cursor + duration * 60_000, end);
    const title = titles[(sequence * 3 + channelIndex) % titles.length] ?? 'Programma';
    const optionalMetadata = sequence % 7 !== 0;

    programmes.push({
      id: `${channel.id}-${sequence}`,
      channelId: channel.id,
      startAt: iso(start),
      endAt: iso(programmeEnd),
      title,
      ...(optionalMetadata
        ? {
            description: `Deterministische fixture voor ${channel.displayName}.`,
            genre: channelIndex === 10 ? 'Sport' : channelIndex === 8 ? 'Film' : 'Algemeen',
          }
        : {}),
      ...(channelIndex === 10 && sequence % 8 === 0 ? { isLive: true } : {}),
      ...(sequence % 11 === 0 ? { isRepeat: true } : {}),
    });

    cursor = programmeEnd;
    sequence += 1;

    // Deliberate schedule gap for edge-case testing on one channel.
    if (channelIndex === 13 && sequence === 12) cursor += 25 * 60_000;
  }

  return programmes;
}

export const guideFixture: GuideFixture = {
  generatedAt: '2026-09-11T12:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels: fixtureChannels,
  programmes: fixtureChannels.flatMap(buildProgrammes),
};

export function programmesForChannel(channelId: string): Programme[] {
  return guideFixture.programmes.filter((programme) => programme.channelId === channelId);
}
