import { type ComponentType, useCallback, useReducer, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { detailReducer, initialDetailState, type ProgrammeSelection } from '@/features/guide/detailState';
import { GuidePresentationSelector } from '@/features/guide/GuidePresentationSelector';
import {
  DEFAULT_GUIDE_PRESENTATION,
  type GuidePresentation,
} from '@/features/guide/guidePresentation';
import { GuideView } from '@/features/guide/GuideView';
import { PerChannelGuideView } from '@/features/guide/PerChannelGuideView';
import { ProgrammeDetail } from '@/features/guide/ProgrammeDetail';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

type NowNextGuideComponent = ComponentType<{
  onSelectProgramme: (selection: ProgrammeSelection) => void;
}>;

export default function GuideScreen() {
  const theme = useTeeveeTheme();
  const [presentation, setPresentation] = useState<GuidePresentation>(DEFAULT_GUIDE_PRESENTATION);
  const requestedPresentationRef = useRef<GuidePresentation>(DEFAULT_GUIDE_PRESENTATION);
  const [nowNextComponent, setNowNextComponent] = useState<NowNextGuideComponent | null>(null);
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
      if (requestedPresentationRef.current === 'now-next') {
        setPresentation('now-next');
      }
      return;
    }

    setNowNextLoading(true);
    setNowNextLoadError(null);

    try {
      const module = await import('@/features/guide/NowNextGuideView');
      setNowNextComponent(() => module.NowNextGuideView);
      if (requestedPresentationRef.current === 'now-next') {
        setPresentation('now-next');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setNowNextLoadError(message);
    } finally {
      setNowNextLoading(false);
    }
  }, [nowNextComponent]);

  const selectPresentation = useCallback(
    (nextPresentation: GuidePresentation) => {
      requestedPresentationRef.current = nextPresentation;
      setNowNextLoadError(null);

      if (nextPresentation === 'now-next') {
        void loadAndShowNowNext();
        return;
      }

      setPresentation(nextPresentation);
    },
    [loadAndShowNowNext],
  );

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
            styles.loadError,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.loadErrorTitle, { color: theme.colors.text }]}>Nu & Straks kon niet laden</Text>
          <Text selectable style={[styles.loadErrorText, { color: theme.colors.textSecondary }]}>
            {nowNextLoadError}
          </Text>
        </View>
      ) : null}

      <View pointerEvents="box-none" style={styles.presentationSelectorDock}>
        <GuidePresentationSelector
          selected={presentation}
          loadingPresentation={nowNextLoading ? 'now-next' : null}
          onSelect={selectPresentation}
        />
      </View>

      <ProgrammeDetail state={detail} onClose={closeDetail} />
    </>
  );
}

const styles = StyleSheet.create({
  presentationSelectorDock: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    zIndex: 20,
    alignItems: 'center',
  },
  loadError: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 72,
    zIndex: 21,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  loadErrorTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  loadErrorText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
});
