import { useCallback, useReducer } from 'react';

import { detailReducer, initialDetailState, type ProgrammeSelection } from '@/features/guide/detailState';
import { PerChannelGuideView } from '@/features/guide/PerChannelGuideView';
import { ProgrammeDetail } from '@/features/guide/ProgrammeDetail';

export default function GuideScreen() {
  const [detail, dispatch] = useReducer(detailReducer, initialDetailState);
  // Stable props are essential: selecting a programme must not rebuild the Guide.
  const openDetail = useCallback((selection: ProgrammeSelection) => {
    dispatch({ type: 'open', selection });
  }, []);
  const closeDetail = useCallback(() => dispatch({ type: 'close' }), []);

  return (
    <>
      {/* Phase 1B deliberately exposes Per zender as the active interaction prototype.
          The physically accepted Totaal implementation remains intact in GuideView. */}
      <PerChannelGuideView onSelectProgramme={openDetail} />
      <ProgrammeDetail state={detail} onClose={closeDetail} />
    </>
  );
}
