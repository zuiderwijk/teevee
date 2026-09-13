import { useCallback, useReducer, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { detailReducer, initialDetailState, type ProgrammeSelection } from '@/features/guide/detailState';
import { GuideView } from '@/features/guide/GuideView';
import { NowNextGuideView } from '@/features/guide/NowNextGuideView';
import { PerChannelGuideView } from '@/features/guide/PerChannelGuideView';
import { ProgrammeDetail } from '@/features/guide/ProgrammeDetail';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

type PrototypePresentation = 'total' | 'per-channel' | 'now-next';

const NEXT_PRESENTATION: Record<PrototypePresentation, PrototypePresentation> = {
  total: 'per-channel',
  'per-channel': 'now-next',
  'now-next': 'total',
};

const PRESENTATION_LABEL: Record<PrototypePresentation, string> = {
  total: 'Totaal',
  'per-channel': 'Per zender',
  'now-next': 'Nu & Straks',
};

export default function GuideScreen() {
  const theme = useTeeveeTheme();
  const [presentation, setPresentation] = useState<PrototypePresentation>('total');
  const [detail, dispatch] = useReducer(detailReducer, initialDetailState);
  // Stable props are essential: selecting a programme must not rebuild the Guide.
  const openDetail = useCallback((selection: ProgrammeSelection) => {
    dispatch({ type: 'open', selection });
  }, []);
  const closeDetail = useCallback(() => dispatch({ type: 'close' }), []);

  const nextPresentation = NEXT_PRESENTATION[presentation];

  return (
    <>
      {presentation === 'per-channel' ? (
        <PerChannelGuideView onSelectProgramme={openDetail} />
      ) : presentation === 'now-next' ? (
        <NowNextGuideView onSelectProgramme={openDetail} />
      ) : (
        <GuideView onSelectProgramme={openDetail} />
      )}

      {/* Temporary Phase 1B test control. This is not the final Guide presentation UI. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Toon ${PRESENTATION_LABEL[nextPresentation]}-weergave`}
        onPress={() => setPresentation(nextPresentation)}
        style={({ pressed }) => [
          styles.prototypeSwitch,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={[styles.prototypeSwitchText, { color: theme.colors.text }]}>
          {PRESENTATION_LABEL[nextPresentation]}
        </Text>
      </Pressable>

      <ProgrammeDetail state={detail} onClose={closeDetail} />
    </>
  );
}

const styles = StyleSheet.create({
  prototypeSwitch: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    zIndex: 20,
    minHeight: 44,
    minWidth: 92,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prototypeSwitchText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
});
