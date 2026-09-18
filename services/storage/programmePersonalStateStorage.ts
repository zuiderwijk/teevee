import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  parseSerializedProgrammePersonalState,
  serializeProgrammePersonalState,
  type ProgrammePersonalState,
} from '@/features/guide/programmePersonalState';

let memoryValue: string | null = null;

export function readProgrammePersonalState(): ProgrammePersonalState {
  return memoryValue
    ? parseSerializedProgrammePersonalState(memoryValue)
    : EMPTY_PROGRAMME_PERSONAL_STATE;
}

export function writeProgrammePersonalState(state: ProgrammePersonalState): boolean {
  memoryValue = serializeProgrammePersonalState(state);
  return true;
}
