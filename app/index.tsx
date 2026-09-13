import { type ComponentType, useCallback, useReducer, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { detailReducer, initialDetailState, type ProgrammeSelection } from '@/features/guide/detailState';
import { GuideView } from '@/features/guide/GuideView';
import { PerChannelGuideView } from '@/features/guide/PerChannelGuideView';
import { ProgrammeDetail } from '@/features/guide/ProgrammeDetail';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

type PrototypePresentation = 'total' | 'per-channel' | 'now-next';
type NowNextPrototypeComponent = ComponentType<{
  onSelectProgramme: (selection: ProgrammeSelection) => void;
}>;

export default function GuideScreen() {
  const theme = useTeeveeTheme();
  const [presentation, setPresentation] = useState<PrototypePresentation>('total');
  const [nowNextComponent, setNowNextComponent] = useState<NowNextPrototypeComponent | null>(null);
  const [nowNextLoading, setNowNextLoading] = useState(false);
  const [nowNextLoadError, setNowNextLoadError] = useState<string | null>(null);
  const [detail, dispatch] = useReducer(detailReducer, initialDetailState);

  // Stable props are essential: selecting a programme must not rebuild the Guide.
  const openDetail = useCallback((selection: ProgrammeSelection) => {
    dispatch({ type: 'open', selection });
  }, []);
  const closeDetail = useCallback(() => dispatch({ type: 'close' }), []);

  const showPerChannel = presentation === 'per-channel';
  const showNowNext = presentation === 'now-next' && nowNextComponent !== null;
  const NowNextComponent = nowNextComponent;

  const loadAndShowNowNext = useCallback(async () => {
    if (nowNextComponent) {
      setPresentation('now-next');
      return;
    }

    setNowNextLoading(true);
    setNowNextLoadError(null);

    try {
      const module = await import('@/features/guide/NowNextGuideView');
      setNowNextComponent(() => module.NowNextGuideView);
      setPresentation('now-next');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setNowNextLoadError(message);
    } finally {
      setNowNextLoading(false);
    }
  }, [nowNextComponent]);

  const showNextPrototype = useCallback(() => {
    if (presentation === 'total') {
      setNowNextLoadError(null);
      setPresentation('per-channel');
      return;
    }

    if (presentation === 'per-channel') {
      void loadAndShowNowNext();
      return;
    }

    setNowNextLoadError(null);
    setPresentation('total');
  }, [loadAndShowNowNext, presentation]);

  const nextLabel =
    presentation === 'total'
      ? 'Per zender'
      : presentation === 'per-channel'
        ? nowNextLoading
          ? 'Laden…'
          : 'Nu & Straks'
        : 'Totaal';

  return (
    <>
      {showNowNext && NowNextComponent ? (
        <NowNextComponent onSelectProgramme={openDetail} />
      ) : showPerChannel ? (
        <PerChannelGuideView onSelectProgramme={openDetail} />
      ) : (
        <GuideView onSelectProgramme={openDetail} />
      )}

      {nowNextLoadError ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.prototypeError,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.prototypeErrorTitle, { color: theme.colors.text }]}>Nu & Straks kon niet laden</Text>
          <Text selectable style={[styles.prototypeErrorText, { color: theme.colors.textSecondary }]}>
            {nowNextLoadError}
          </Text>
        </View>
      ) : null}

      {/* Temporary Phase 1B test control. This is not the final Guide presentation UI. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Toon ${nextLabel}-weergave`}
        disabled={nowNextLoading}
        onPress={showNextPrototype}
        style={({ pressed }) => [
          styles.prototypeSwitch,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            opacity: nowNextLoading ? 0.55 : pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={[styles.prototypeSwitchText, { color: theme.colors.text }]}>{nextLabel}</Text>
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
  prototypeError: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 76,
    zIndex: 21,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  prototypeErrorTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  prototypeErrorText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
});
