import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  parseSerializedProgrammePersonalState,
  serializeProgrammePersonalState,
  type ProgrammePersonalState,
} from '@/features/guide/programmePersonalState';

const PERSONAL_STATE_STORAGE_KEY = 'teevee.programmePersonalState.v1';

export function readProgrammePersonalState(): ProgrammePersonalState {
  try {
    if (typeof globalThis.localStorage === 'undefined') return EMPTY_PROGRAMME_PERSONAL_STATE;
    return parseSerializedProgrammePersonalState(
      globalThis.localStorage.getItem(PERSONAL_STATE_STORAGE_KEY),
    );
  } catch {
    return EMPTY_PROGRAMME_PERSONAL_STATE;
  }
}

export function writeProgrammePersonalState(state: ProgrammePersonalState): boolean {
  try {
    if (typeof globalThis.localStorage === 'undefined') return false;
    globalThis.localStorage.setItem(
      PERSONAL_STATE_STORAGE_KEY,
      serializeProgrammePersonalState(state),
    );
    return true;
  } catch {
    return false;
  }
}
