import type { GuideFixture, Programme } from '@/data/domain/epg';

export const NOW_NEXT_SLOT_MINUTES = 30;
export const NOW_NEXT_FOLLOWING_COUNT = 3;

export type NowNextProgrammeSet = {
  referenceProgramme: Programme | null;
  followingProgrammes: Programme[];
};

export function programmesAroundReference(
  fixture: GuideFixture,
  channelId: string,
  referenceMs: number,
  followingCount = NOW_NEXT_FOLLOWING_COUNT,
): NowNextProgrammeSet {
  const programmes = fixture.programmes
    .filter((programme) => programme.channelId === channelId)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));

  const referenceIndex = programmes.findIndex((programme) => {
    const startMs = Date.parse(programme.startAt);
    const endMs = Date.parse(programme.endAt);
    return startMs <= referenceMs && referenceMs < endMs;
  });

  if (referenceIndex >= 0) {
    return {
      referenceProgramme: programmes[referenceIndex] ?? null,
      followingProgrammes: programmes.slice(referenceIndex + 1, referenceIndex + 1 + followingCount),
    };
  }

  return {
    referenceProgramme: null,
    followingProgrammes: programmes
      .filter((programme) => Date.parse(programme.startAt) >= referenceMs)
      .slice(0, followingCount),
  };
}

export function clampReferenceTime(referenceMs: number, dayStartMs: number, dayEndMs: number) {
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

export function nearestSlotIndex(slots: number[], referenceMs: number) {
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
