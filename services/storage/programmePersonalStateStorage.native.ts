import { File, Paths } from 'expo-file-system';

import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  parseSerializedProgrammePersonalState,
  serializeProgrammePersonalState,
  type ProgrammePersonalState,
} from '@/features/guide/programmePersonalState';

const PERSONAL_STATE_FILE_NAME = 'teevee-programme-personal-state-v1.json';

function stateFile() {
  return new File(Paths.document, PERSONAL_STATE_FILE_NAME);
}

export function readProgrammePersonalState(): ProgrammePersonalState {
  try {
    const file = stateFile();
    if (!file.exists) return EMPTY_PROGRAMME_PERSONAL_STATE;
    return parseSerializedProgrammePersonalState(file.textSync());
  } catch {
    return EMPTY_PROGRAMME_PERSONAL_STATE;
  }
}

export function writeProgrammePersonalState(state: ProgrammePersonalState): boolean {
  try {
    const file = stateFile();
    if (!file.exists) file.create({ intermediates: true });
    file.write(serializeProgrammePersonalState(state));
    return true;
  } catch {
    return false;
  }
}
