import type { Programme } from '@/data/domain/epg';
import {
  withProgrammeReminder,
  type ProgrammePersonalState,
} from '@/features/guide/programmePersonalState';

import {
  readProgrammePersonalState,
  writeProgrammePersonalState,
} from './programmePersonalStateStorage';

export type RemoveReminderIfMatchesResult =
  | { status: 'removed'; state: ProgrammePersonalState }
  | { status: 'changed'; state: ProgrammePersonalState }
  | { status: 'persist-failed'; state: ProgrammePersonalState };

export function removeProgrammeReminderIfMatches(
  programme: Programme,
  notificationId: string,
): RemoveReminderIfMatchesResult {
  const fresh = readProgrammePersonalState();
  if (fresh.reminders[programme.id]?.notificationId !== notificationId) {
    return { status: 'changed', state: fresh };
  }

  const next = withProgrammeReminder(fresh, programme, null);
  if (!writeProgrammePersonalState(next)) {
    return { status: 'persist-failed', state: fresh };
  }
  return { status: 'removed', state: next };
}
