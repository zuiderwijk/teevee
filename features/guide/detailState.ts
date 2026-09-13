import type { Programme } from '@/data/domain/epg';

export type ProgrammeSelection = {
  programme: Programme;
  channelName: string;
};

export type DetailState = {
  selection: ProgrammeSelection | null;
  visible: boolean;
};

export type DetailAction =
  | { type: 'open'; selection: ProgrammeSelection }
  | { type: 'close' };

export const initialDetailState: DetailState = { selection: null, visible: false };

export function detailReducer(state: DetailState, action: DetailAction): DetailState {
  if (action.type === 'open') return { selection: action.selection, visible: true };
  if (!state.visible) return state;
  // Retain content while the native dismissal animates; do not show an empty sheet.
  return { ...state, visible: false };
}
