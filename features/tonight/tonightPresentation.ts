import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';
import type { Channel, GuideSchedule, Programme } from '@/data/domain/epg';
import {
  GUIDE_TIME_ZONE,
} from '@/data/domain/guideTime';
import {
  isTonightFilmClassification,
  isTonightSeriesClassification,
  isTonightSportClassification,
  type ProgrammeClassification,
} from '@/data/domain/programmeClassification';
import {
  programmeHasEndedAt,
  programmeIntersectsWindow,
  programmeIsCurrentAt,
  programmeStartsInWindow,
  tonightEveningDateLabel,
  tonightWindow,
} from '@/data/domain/tonight';
import type {
  ProgrammePersonalState,
  SavedProgrammeRecord,
} from '@/features/guide/programmePersonalState';

export type TonightDiscoveryKind = 'kijktip' | 'film' | 'series' | 'sport';

export type TonightDiscoveryItem = {
  programme: Programme;
  channel: Channel;
  current: boolean;
};

export type TonightSavedItem = {
  snapshot: SavedProgrammeRecord;
  programme: Programme | null;
  channel: Channel | null;
  channelLabel: string;
  temporalState: 'upcoming' | 'current' | 'ended';
};

export type TonightViewModel = {
  eveningDateLabel: string;
  saved: TonightSavedItem[];
  kijktips: TonightDiscoveryItem[];
  films: TonightDiscoveryItem[];
  series: TonightDiscoveryItem[];
  sport: TonightDiscoveryItem[];
};

const timeFormatter = new Intl.DateTimeFormat('nl-NL', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: GUIDE_TIME_ZONE,
});

function channelSortOrder(channel: Channel | null): number {
  return channel?.sortOrder ?? Number.MAX_SAFE_INTEGER;
}

function compareProgrammeItems(
  left: Pick<TonightDiscoveryItem, 'programme' | 'channel'>,
  right: Pick<TonightDiscoveryItem, 'programme' | 'channel'>,
): number {
  return (
    Date.parse(left.programme.startAt) - Date.parse(right.programme.startAt) ||
    channelSortOrder(left.channel) - channelSortOrder(right.channel) ||
    left.programme.id.localeCompare(right.programme.id)
  );
}

function discoveryItem(
  programme: Programme,
  channelById: ReadonlyMap<string, Channel>,
  nowMs: number,
): TonightDiscoveryItem | null {
  const channel = channelById.get(programme.channelId);
  if (!channel) return null;
  return {
    programme,
    channel,
    current: programmeIsCurrentAt(programme, nowMs),
  };
}

function discoveryItems(
  programmes: readonly Programme[],
  channelById: ReadonlyMap<string, Channel>,
  nowMs: number,
): TonightDiscoveryItem[] {
  return programmes
    .map((programme) => discoveryItem(programme, channelById, nowMs))
    .filter((item): item is TonightDiscoveryItem => item !== null)
    .sort(compareProgrammeItems);
}

function savedTemporalState(
  broadcast: Pick<Programme, 'startAt' | 'endAt'>,
  nowMs: number,
): TonightSavedItem['temporalState'] {
  if (Date.parse(broadcast.endAt) <= nowMs) return 'ended';
  if (Date.parse(broadcast.startAt) <= nowMs) return 'current';
  return 'upcoming';
}

function savedItems(
  state: ProgrammePersonalState,
  schedule: GuideSchedule | null,
  nowMs: number,
): TonightSavedItem[] {
  const window = tonightWindow(nowMs);
  const programmes = new Map(
    schedule?.programmes
      .filter((programme) =>
        programmeIntersectsWindow(
          programme,
          window.eveningStartMs,
          window.eveningEndMs,
        ),
      )
      .map((programme) => [programme.id, programme]) ?? [],
  );
  const channels = new Map(
    schedule?.channels.map((channel) => [channel.id, channel]) ?? [],
  );

  return Object.values(state.saved)
    .map((snapshot) => {
      const programme = programmes.get(snapshot.programmeId) ?? null;
      return {
        snapshot,
        programme,
        source: programme ?? snapshot,
      };
    })
    .filter(({ source }) =>
      programmeIntersectsWindow(
        source,
        window.eveningStartMs,
        window.eveningEndMs,
      ),
    )
    .map(({ snapshot, programme, source }) => {
      const channel =
        channels.get(programme?.channelId ?? snapshot.channelId) ?? null;
      return {
        snapshot,
        programme,
        channel,
        channelLabel: channel?.displayName ?? 'Zender tijdelijk niet beschikbaar',
        temporalState: savedTemporalState(source, nowMs),
      };
    })
    .sort(
      (left, right) =>
        Date.parse(left.programme?.startAt ?? left.snapshot.startAt) -
          Date.parse(right.programme?.startAt ?? right.snapshot.startAt) ||
        channelSortOrder(left.channel) - channelSortOrder(right.channel) ||
        left.snapshot.programmeId.localeCompare(right.snapshot.programmeId),
    );
}

export function buildTonightViewModel(input: {
  schedule: GuideSchedule | null;
  editorialSignals: readonly ProgrammeEditorialSignal[];
  classifications: readonly ProgrammeClassification[];
  personalState: ProgrammePersonalState;
  nowMs: number;
}): TonightViewModel {
  const { schedule, editorialSignals, classifications, personalState, nowMs } =
    input;
  const window = tonightWindow(nowMs);
  const channelById = new Map(
    schedule?.channels.map((channel) => [channel.id, channel]) ?? [],
  );
  const eveningProgrammes =
    schedule?.programmes.filter((programme) =>
      programmeIntersectsWindow(
        programme,
        window.eveningStartMs,
        window.eveningEndMs,
      ),
    ) ?? [];
  const programmeById = new Map(
    eveningProgrammes.map((programme) => [programme.id, programme]),
  );
  const classificationById = new Map(
    classifications.map((classification) => [
      classification.programmeId,
      classification,
    ]),
  );

  const discoverable = (programme: Programme, fromMs: number) =>
    programmeStartsInWindow(programme, fromMs, window.eveningEndMs) &&
    !programmeHasEndedAt(programme, nowMs);

  const kijktipProgrammeIds = new Set(
    editorialSignals
      .filter((signal) => signal.type === 'kijktip')
      .map((signal) => signal.programmeId),
  );
  const kijktipProgrammes = [...kijktipProgrammeIds]
    .map((programmeId) => programmeById.get(programmeId))
    .filter(
      (programme): programme is Programme =>
        programme !== undefined &&
        discoverable(programme, window.eveningStartMs),
    );

  const categoryProgrammes = eveningProgrammes.filter((programme) =>
    discoverable(programme, window.categoryStartMs),
  );

  const films: Programme[] = [];
  const series: Programme[] = [];
  const sport: Programme[] = [];

  for (const programme of categoryProgrammes) {
    const classification = classificationById.get(programme.id);
    if (!classification) continue;
    if (isTonightFilmClassification(classification)) films.push(programme);
    if (isTonightSeriesClassification(classification)) series.push(programme);
    if (isTonightSportClassification(classification)) sport.push(programme);
  }

  return {
    eveningDateLabel: tonightEveningDateLabel(nowMs),
    saved: savedItems(personalState, schedule, nowMs),
    kijktips: discoveryItems(kijktipProgrammes, channelById, nowMs),
    films: discoveryItems(films, channelById, nowMs),
    series: discoveryItems(series, channelById, nowMs),
    sport: discoveryItems(sport, channelById, nowMs),
  };
}

export function tonightProgrammeTimeLabel(
  programme: Pick<Programme, 'startAt'>,
): string {
  return timeFormatter.format(new Date(programme.startAt));
}

export function tonightProgrammeAccessibilityLabel(input: {
  programme: Pick<Programme, 'title' | 'startAt' | 'endAt'>;
  channelName: string;
  current: boolean;
  prefix?: string;
}): string {
  const { programme, channelName, current, prefix } = input;
  const start = timeFormatter.format(new Date(programme.startAt));
  const end = timeFormatter.format(new Date(programme.endAt));
  return [
    ...(prefix ? [prefix] : []),
    programme.title,
    channelName,
    `${start} tot ${end}`,
    ...(current ? ['nu bezig'] : []),
  ].join(', ');
}

export function tonightSavedAccessibilityLabel(item: TonightSavedItem): string {
  const source = item.programme ?? item.snapshot;
  const start = timeFormatter.format(new Date(source.startAt));
  const end = timeFormatter.format(new Date(source.endAt));
  return [
    source.title,
    item.channelLabel,
    `${start} tot ${end}`,
    ...(item.temporalState === 'current'
      ? ['nu bezig']
      : item.temporalState === 'ended'
        ? ['Afgelopen']
        : []),
    ...(!item.programme ? ['Details tijdelijk niet beschikbaar'] : []),
  ].join(', ');
}

export type TonightCardMetrics = {
  width: number;
  mediaHeight: number;
};

export function tonightCardMetrics(input: {
  kind: TonightDiscoveryKind;
  contentWidth: number;
  fontScale: number;
}): TonightCardMetrics {
  const { kind, contentWidth } = input;
  const fontScale = Number.isFinite(input.fontScale) ? input.fontScale : 1;

  if (fontScale <= 1.35) {
    if (kind === 'kijktip') return { width: 168, mediaHeight: 94.5 };
    if (kind === 'film') return { width: 108, mediaHeight: 162 };
    if (kind === 'series') return { width: 96, mediaHeight: 144 };
    return { width: 220, mediaHeight: 112 };
  }

  if (fontScale <= 1.7) {
    if (kind === 'kijktip') {
      const width = Math.max(168, contentWidth * 0.72);
      return { width, mediaHeight: width * (9 / 16) };
    }
    if (kind === 'film') return { width: 142, mediaHeight: 213 };
    if (kind === 'series') return { width: 132, mediaHeight: 198 };
    const width = Math.max(220, contentWidth * 0.82);
    return { width, mediaHeight: width * (112 / 220) };
  }

  if (kind === 'kijktip') {
    const width = Math.max(168, contentWidth * 0.86);
    return { width, mediaHeight: width * (9 / 16) };
  }
  if (kind === 'film') {
    const width = Math.max(158, Math.min(196, contentWidth * 0.54));
    return { width, mediaHeight: width * 1.5 };
  }
  if (kind === 'series') {
    const width = Math.max(148, Math.min(184, contentWidth * 0.5));
    return { width, mediaHeight: width * 1.5 };
  }
  const width = Math.max(220, contentWidth * 0.86);
  return { width, mediaHeight: width * (112 / 220) };
}
