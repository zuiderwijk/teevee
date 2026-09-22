import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';

export const KIJKTIP_LABEL = 'Kijktip';

export function kijktipProgrammeIds(
  signals: readonly ProgrammeEditorialSignal[],
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const signal of signals) {
    if (signal.type === 'kijktip') ids.add(signal.programmeId);
  }
  return ids;
}

export function guideProgrammeAccessibilityLabel({
  channelName,
  title,
  startLabel,
  endLabel,
  current,
  isKijktip,
}: {
  channelName: string;
  title: string;
  startLabel: string;
  endLabel: string;
  current: boolean;
  isKijktip: boolean;
}): string {
  return [
    channelName,
    title,
    ...(isKijktip ? [KIJKTIP_LABEL] : []),
    `${startLabel} tot ${endLabel}`,
    ...(current ? ['nu bezig'] : []),
  ].join(', ');
}
