import { type ComponentType, type ReactNode, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SettingsButton } from '@/components/SettingsButton';
import { detailReducer, initialDetailState, type ProgrammeSelection } from '@/features/guide/detailState';
import { GuidePresentationSelector } from '@/features/guide/GuidePresentationSelector';
import {
  DEFAULT_GUIDE_PRESENTATION,
  type GuidePresentation,
} from '@/features/guide/guidePresentation';
import { GuideView } from '@/features/guide/GuideView';
import { NowNextLoadErrorNotice } from '@/features/guide/NowNextLoadErrorNotice';
import { PerChannelGuideView } from '@/features/guide/PerChannelGuideView';
import { ProgrammeDetail } from '@/features/guide/ProgrammeDetail';
import { useHostedGuideScheduleRuntime } from '@/features/guide/useHostedGuideScheduleRuntime';
import { withGuidePresentation } from '@/features/settings/appPreferences';
import {
  readAppPreferences,
  writeAppPreferences,
} from '@/services/storage/appPreferencesStorage';

const settingsAction = <SettingsButton />;

type NowNextGuideComponent = ComponentType<{
  headerAction?: ReactNode;
  onSelectProgramme: (selection: ProgrammeSelection) => void;
}>;

export default function GuideScreen() {
  const guideDataVersion = useHostedGuideScheduleRuntime();
  const [initialPreferredPresentation] = useState<GuidePresentation>(
    () => readAppPreferences().guidePresentation,
  );
  const [presentation, setPresentation] = useState<GuidePresentation>(() =>
    initialPreferredPresentation === 'now-next'
      ? DEFAULT_GUIDE_PRESENTATION
      : initialPreferredPresentation,
  );
  const requestedPresentationRef = useRef<GuidePresentation>(initialPreferredPresentation);
  const [nowNextComponent, setNowNextComponent] = useState<NowNextGuideComponent | null>(null);
  const [nowNextLoading, setNowNextLoading] = useState(false);
  const [nowNextLoadFailed, setNowNextLoadFailed] = useState(false);
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
    setNowNextLoadFailed(false);

    try {
      const module = await import('@/features/guide/NowNextGuideView');
      setNowNextComponent(() => module.NowNextGuideView);
      if (requestedPresentationRef.current === 'now-next') {
        setPresentation('now-next');
      }
    } catch {
      setNowNextLoadFailed(true);
    } finally {
      setNowNextLoading(false);
    }
  }, [nowNextComponent]);

  useEffect(() => {
    if (initialPreferredPresentation !== 'now-next') return;

    // A persisted Nu & Straks preference still respects the proven deferred-load
    // boundary: let the shell complete its first frame before evaluating the module.
    const frame = requestAnimationFrame(() => {
      void loadAndShowNowNext();
    });
    return () => cancelAnimationFrame(frame);
  }, [initialPreferredPresentation, loadAndShowNowNext]);

  const persistPresentationPreference = useCallback((nextPresentation: GuidePresentation) => {
    const currentPreferences = readAppPreferences();
    writeAppPreferences(withGuidePresentation(currentPreferences, nextPresentation));
  }, []);

  const selectPresentation = useCallback(
    (nextPresentation: GuidePresentation) => {
      requestedPresentationRef.current = nextPresentation;
      setNowNextLoadFailed(false);
      persistPresentationPreference(nextPresentation);

      if (nextPresentation === 'now-next') {
        void loadAndShowNowNext();
        return;
      }

      setPresentation(nextPresentation);
    },
    [loadAndShowNowNext, persistPresentationPreference],
  );

  const guideKey = `guide-data-${guideDataVersion}`;

  return (
    <>
      {showNowNext && NowNextComponent ? (
        <NowNextComponent
          key={guideKey}
          onSelectProgramme={openDetail}
          headerAction={settingsAction}
        />
      ) : showPerChannel ? (
        <PerChannelGuideView
          guideDataVersion={guideDataVersion}
          onSelectProgramme={openDetail}
          headerAction={settingsAction}
        />
      ) : (
        <GuideView
          guideDataVersion={guideDataVersion}
          onSelectProgramme={openDetail}
          headerAction={settingsAction}
        />
      )}

      {nowNextLoadFailed ? (
        <NowNextLoadErrorNotice onRetry={() => void loadAndShowNowNext()} />
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
});
