import { useCallback, useReducer } from 'react';

import { detailReducer, initialDetailState, type ProgrammeSelection } from '@/features/guide/detailState';
import { GuideView } from '@/features/guide/GuideView';
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
      <GuideView onSelectProgramme={openDetail} />
      <ProgrammeDetail state={detail} onClose={closeDetail} />
    </>
  );
}
