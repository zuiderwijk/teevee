import type {
  Channel,
  GuideFixture,
  GuideSchedule,
  Programme,
} from '@/data/domain/epg';
import {
  guideTelevisionDayStart,
  guideTelevisionDayTime,
} from '@/data/domain/guideTime';

export const NOW_NEXT_SLOT_MINUTES = 30;
export const NOW_NEXT_FOLLOWING_COUNT = 3;

export type NowNextProgrammeSet = {
  referenceProgramme: Programme | null;
  followingProgrammes: Programme[];
};

export type NowNextTemporalControlState = 'active' | 'action';

export type NowNextTemporalControlStates = {
  nu: NowNextTemporalControlState;
  primetime: NowNextTemporalControlState;
};

export type NowNextSchedulePresentation = {
  channels: Channel[];
  schedule: GuideSchedule | null;
  source: 'runtime' | 'established-channels' | 'fixture' | 'unavailable';
};

export function nowNextTelevisionDayBounds(anchorMs: number) {
  const startMs = guideTelevisionDayStart(anchorMs);
  return {
    startMs,
    endMs: guideTelevisionDayStart(startMs, 1),
  } as const;
}

export function nowNextPrimetimeMs(anchorMs: number) {
  const { startMs } = nowNextTelevisionDayBounds(anchorMs);
  return guideTelevisionDayTime(startMs, 20, 30);
}

export function programmesAroundReferenceFromProgrammes(
  programmes: readonly Programme[],
  referenceMs: number,
  followingCount = NOW_NEXT_FOLLOWING_COUNT,
): NowNextProgrammeSet {
  const sorted = [...programmes].sort(
    (left, right) =>
      Date.parse(left.startAt) - Date.parse(right.startAt) ||
      left.id.localeCompare(right.id),
  );

  const referenceIndex = sorted.findIndex((programme) => {
    const startMs = Date.parse(programme.startAt);
    const endMs = Date.parse(programme.endAt);
    return startMs <= referenceMs && referenceMs < endMs;
  });

  if (referenceIndex >= 0) {
    return {
      referenceProgramme: sorted[referenceIndex] ?? null,
      followingProgrammes: sorted.slice(
        referenceIndex + 1,
        referenceIndex + 1 + followingCount,
      ),
    };
  }

  return {
    referenceProgramme: null,
    followingProgrammes: sorted
      .filter((programme) => Date.parse(programme.startAt) >= referenceMs)
      .slice(0, followingCount),
  };
}

export function programmesAroundReference(
  fixture: GuideFixture,
  channelId: string,
  referenceMs: number,
  followingCount = NOW_NEXT_FOLLOWING_COUNT,
): NowNextProgrammeSet {
  return programmesAroundReferenceFromProgrammes(
    fixture.programmes.filter((programme) => programme.channelId === channelId),
    referenceMs,
    followingCount,
  );
}

export function indexProgrammesByChannel(
  schedule: GuideSchedule,
): ReadonlyMap<string, Programme[]> {
  const byChannel = new Map<string, Programme[]>();
  for (const programme of schedule.programmes) {
    const existing = byChannel.get(programme.channelId);
    if (existing) existing.push(programme);
    else byChannel.set(programme.channelId, [programme]);
  }
  for (const programmes of byChannel.values()) {
    programmes.sort(
      (left, right) =>
        Date.parse(left.startAt) - Date.parse(right.startAt) ||
        left.id.localeCompare(right.id),
    );
  }
  return byChannel;
}

export function clampReferenceTime(
  referenceMs: number,
  dayStartMs: number,
  dayEndMs: number,
) {
  if (dayEndMs <= dayStartMs) return dayStartMs;
  return Math.min(dayEndMs - 1, Math.max(dayStartMs, referenceMs));
}

export function timeSlotsForDay(
  dayStartMs: number,
  dayEndMs: number,
  slotMinutes = NOW_NEXT_SLOT_MINUTES,
): number[] {
  if (slotMinutes <= 0 || !Number.isFinite(slotMinutes)) {
    throw new RangeError('slotMinutes must be positive');
  }
  const stepMs = slotMinutes * 60_000;
  const slots: number[] = [];
  for (let slot = dayStartMs; slot < dayEndMs; slot += stepMs) slots.push(slot);
  return slots;
}

export function nearestSlotIndex(slots: readonly number[], referenceMs: number) {
  if (slots.length === 0) return 0;
  let bestIndex = 0;
  let bestDistance = Math.abs(slots[0]! - referenceMs);
  for (let index = 1; index < slots.length; index += 1) {
    const distance = Math.abs(slots[index]! - referenceMs);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}

export function railSlotIndexForOffset(
  offsetX: number,
  slotCount: number,
  slotWidth: number,
) {
  if (slotCount <= 0 || slotWidth <= 0) return 0;
  return Math.max(
    0,
    Math.min(slotCount - 1, Math.round(Math.max(0, offsetX) / slotWidth)),
  );
}

export function railDragCommitsWithoutMomentum(velocityX: number | undefined) {
  return Math.abs(velocityX ?? 0) < 0.01;
}

export function resolveNowNextTemporalControlStates({
  live,
  referenceMs,
  primetimeMs,
}: {
  live: boolean;
  referenceMs: number;
  primetimeMs: number;
}): NowNextTemporalControlStates {
  if (live) return { nu: 'active', primetime: 'action' };
  return {
    nu: 'action',
    primetime: referenceMs === primetimeMs ? 'active' : 'action',
  };
}

export function explicitRailActionAnimation(reduceMotion: boolean) {
  return !reduceMotion;
}

export function resolveNowNextSchedulePresentation(
  runtimeSchedule: GuideSchedule | null,
  establishedChannels: Channel[] | null,
  fixtureSchedule: GuideFixture | null,
): NowNextSchedulePresentation {
  if (runtimeSchedule) {
    return {
      channels: runtimeSchedule.channels,
      schedule: runtimeSchedule,
      source: 'runtime',
    };
  }

  if (establishedChannels?.length) {
    return {
      channels: establishedChannels,
      schedule: null,
      source: 'established-channels',
    };
  }

  if (fixtureSchedule) {
    return {
      channels: fixtureSchedule.channels,
      schedule: fixtureSchedule,
      source: 'fixture',
    };
  }

  return {
    channels: [],
    schedule: null,
    source: 'unavailable',
  };
}
