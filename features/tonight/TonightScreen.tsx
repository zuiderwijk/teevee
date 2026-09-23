import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppScreenHeader } from '@/components/AppScreenHeader';
import { SettingsButton } from '@/components/SettingsButton';
import { guideTelevisionDayStart } from '@/data/domain/guideTime';
import {
  detailReducer,
  initialDetailState,
  type ProgrammeSelection,
} from '@/features/guide/detailState';
import { ProgrammeDetail } from '@/features/guide/ProgrammeDetail';
import type { ProgrammePersonalState } from '@/features/guide/programmePersonalState';
import { useGuideClock } from '@/features/guide/useGuideClock';
import { ChannelIdentity } from '@/features/guide/ChannelIdentity';
import {
  readProgrammePersonalState,
} from '@/services/storage/programmePersonalStateStorage';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import type { TeeveeTheme } from '@/theme/tokens';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  applyTonightDevelopmentModuleState,
  resolveTonightDevelopmentState,
  TONIGHT_DEVELOPMENT_SCENARIOS,
  tonightDevelopmentRefreshAnchor,
  type TonightDevelopmentScenario,
} from './tonightDevelopmentState';
import {
  buildTonightViewModel,
  tonightCardMetrics,
  tonightProgrammeAccessibilityLabel,
  tonightProgrammeTimeLabel,
  tonightSavedAccessibilityLabel,
  type TonightDiscoveryItem,
  type TonightDiscoveryKind,
  type TonightSavedItem,
} from './tonightPresentation';
import {
  tonightRuntime,
  useTonightRuntime,
} from './tonightRuntime';

const PAGE_INSET = 20;
const MODULE_GAP = 28;
const HEADING_CONTENT_GAP = 12;
const CAROUSEL_GAP = 12;
const DEVELOPMENT_CONTROLS_ENABLED =
  typeof __DEV__ !== 'undefined' && __DEV__;

function alpha(hex: string, opacity: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const value = match[1]!;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function SectionHeading({
  title,
  support,
}: {
  title: string;
  support?: string;
}) {
  const theme = useTeeveeTheme();
  return (
    <View>
      <Text
        accessibilityRole="header"
        style={[
          styles.sectionHeading,
          {
            color: theme.colors.text,
            fontFamily: TEEVEE_FONT_FAMILIES.semibold,
          },
        ]}
      >
        {title}
      </Text>
      {support ? (
        <Text
          style={[
            styles.sectionSupport,
            {
              color: theme.colors.textSecondary,
              fontFamily: TEEVEE_FONT_FAMILIES.regular,
            },
          ]}
        >
          {support}
        </Text>
      ) : null}
    </View>
  );
}

const SavedRow = memo(function SavedRow({
  item,
  largeText,
  onSelect,
}: {
  item: TonightSavedItem;
  largeText: boolean;
  onSelect: (selection: ProgrammeSelection) => void;
}) {
  const theme = useTeeveeTheme();
  const source = item.programme ?? item.snapshot;
  const startLabel = tonightProgrammeTimeLabel(source);
  const resolved =
    item.programme && item.channel
      ? { programme: item.programme, channel: item.channel }
      : null;
  const current = item.temporalState === 'current';
  const ended = item.temporalState === 'ended';

  const contents = (
    <>
      {largeText ? (
        <View style={styles.savedStackedTopLine}>
          <Text
            style={[
              styles.savedTime,
              {
                color: ended ? theme.colors.textMuted : theme.colors.textSecondary,
                fontFamily: TEEVEE_FONT_FAMILIES.regular,
              },
            ]}
          >
            {startLabel}
          </Text>
          {current ? <NowCapsule colors={theme.colors} /> : null}
        </View>
      ) : (
        <View style={styles.savedTimeColumn}>
          <Text
            style={[
              styles.savedTime,
              {
                color: ended ? theme.colors.textMuted : theme.colors.textSecondary,
                fontFamily: TEEVEE_FONT_FAMILIES.regular,
              },
            ]}
          >
            {startLabel}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.savedProgrammeContent,
          largeText ? styles.savedProgrammeContentStacked : null,
        ]}
      >
        <View style={styles.savedTitleLine}>
          <Text
            style={[
              styles.savedTitle,
              {
                color: ended ? theme.colors.textSecondary : theme.colors.text,
                fontFamily: current
                  ? TEEVEE_FONT_FAMILIES.semibold
                  : TEEVEE_FONT_FAMILIES.medium,
              },
            ]}
          >
            {source.title}
          </Text>
          {!largeText && current ? <NowCapsule colors={theme.colors} /> : null}
        </View>
        <Text
          style={[
            styles.savedChannel,
            {
              color: ended ? theme.colors.textMuted : theme.colors.textSecondary,
              fontFamily: TEEVEE_FONT_FAMILIES.regular,
            },
          ]}
        >
          {item.channelLabel}
          {ended ? ' · Afgelopen' : ''}
        </Text>
      </View>
    </>
  );

  const sharedStyle = [
    styles.savedRow,
    largeText ? styles.savedRowStacked : styles.savedRowColumns,
    { borderBottomColor: theme.colors.border },
  ];

  if (!resolved) {
    return (
      <View
        testID={`tonight-saved-${item.snapshot.programmeId}`}
        accessible
        accessibilityLabel={tonightSavedAccessibilityLabel(item)}
        style={sharedStyle}
      >
        {contents}
      </View>
    );
  }

  return (
    <Pressable
      testID={`tonight-saved-${item.snapshot.programmeId}`}
      accessibilityRole="button"
      accessibilityLabel={tonightSavedAccessibilityLabel(item)}
      accessibilityHint="Opent programmadetails"
      onPress={() => onSelect(resolved)}
      style={({ pressed }) => [
        ...sharedStyle,
        { backgroundColor: pressed ? theme.colors.surface : 'transparent' },
      ]}
    >
      {contents}
    </Pressable>
  );
}, (previous, next) =>
  previous.item.snapshot === next.item.snapshot &&
  previous.item.programme === next.item.programme &&
  previous.item.channel === next.item.channel &&
  previous.item.channelLabel === next.item.channelLabel &&
  previous.item.temporalState === next.item.temporalState &&
  previous.largeText === next.largeText &&
  previous.onSelect === next.onSelect,
);

function NowCapsule({ colors }: { colors: TeeveeTheme['colors'] }) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.nowCapsule,
        { backgroundColor: alpha(colors.currentTime, 0.12) },
      ]}
    >
      <Text
        style={[
          styles.nowCapsuleText,
          {
            color: colors.currentTime,
            fontFamily: TEEVEE_FONT_FAMILIES.semibold,
          },
        ]}
      >
        Nu
      </Text>
    </View>
  );
}

const DiscoveryCard = memo(function DiscoveryCard({
  kind,
  item,
  width,
  mediaHeight,
  onSelect,
}: {
  kind: TonightDiscoveryKind;
  item: TonightDiscoveryItem;
  width: number;
  mediaHeight: number;
  onSelect: (selection: ProgrammeSelection) => void;
}) {
  const theme = useTeeveeTheme();
  const { programme, channel, current } = item;
  const selection = useMemo(() => ({ programme, channel }), [programme, channel]);
  const kijktip = kind === 'kijktip';
  const sport = kind === 'sport';
  const metadata = current
    ? `Nu · ${channel.displayName}`
    : kind === 'kijktip'
      ? `${tonightProgrammeTimeLabel(programme)} · ${channel.displayName}`
      : `${channel.displayName} · ${tonightProgrammeTimeLabel(programme)}`;

  return (
    <Pressable
      testID={`tonight-${kind}-${programme.id}`}
      accessibilityRole="button"
      accessibilityLabel={tonightProgrammeAccessibilityLabel({
        programme,
        channelName: channel.displayName,
        current,
        ...(kijktip ? { prefix: 'Kijktip' } : {}),
      })}
      accessibilityHint="Opent programmadetails"
      onPress={() => onSelect(selection)}
      style={({ pressed }) => [
        styles.discoveryCard,
        { width, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.mediaFallback,
          {
            width,
            height: mediaHeight,
            borderRadius: kijktip || sport ? 10 : 8,
            backgroundColor:
              kijktip
                ? theme.colors.editorialAccentSurface
                : theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.mediaChannelIdentity}>
          <ChannelIdentity
            channel={channel}
            textColor={theme.colors.text}
            mutedTextColor={theme.colors.textSecondary}
            accessible={false}
          />
        </View>
        {sport ? (
          <View style={styles.sportTextBlock}>
            <Text
              numberOfLines={2}
              style={[
                styles.sportFallbackTitle,
                {
                  color: theme.colors.text,
                  fontFamily: TEEVEE_FONT_FAMILIES.semibold,
                },
              ]}
            >
              {programme.title}
            </Text>
            <Text
              style={[
                styles.sportFallbackMetadata,
                {
                  color: current
                    ? theme.colors.currentTime
                    : theme.colors.textSecondary,
                  fontFamily: current
                    ? TEEVEE_FONT_FAMILIES.semibold
                    : TEEVEE_FONT_FAMILIES.regular,
                },
              ]}
            >
              {metadata}
            </Text>
          </View>
        ) : null}
      </View>

      {!sport ? (
        <View
          style={[
            kijktip
              ? [
                  styles.kijktipTextPanel,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]
              : null,
          ]}
        >
          <Text
            style={[
              kind === 'series'
                ? styles.seriesCardTitle
                : styles.discoveryCardTitle,
              {
                color: theme.colors.text,
                fontFamily: TEEVEE_FONT_FAMILIES.medium,
              },
            ]}
          >
            {programme.title}
          </Text>
          <Text
            style={[
              kind === 'series'
                ? styles.seriesCardMetadata
                : kind === 'kijktip'
                  ? styles.kijktipMetadata
                  : styles.discoveryCardMetadata,
              {
                color: current
                  ? theme.colors.currentTime
                  : theme.colors.textSecondary,
                fontFamily: current
                  ? TEEVEE_FONT_FAMILIES.semibold
                  : TEEVEE_FONT_FAMILIES.regular,
              },
            ]}
          >
            {metadata}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}, (previous, next) =>
  previous.kind === next.kind &&
  previous.item.programme === next.item.programme &&
  previous.item.channel === next.item.channel &&
  previous.item.current === next.item.current &&
  previous.width === next.width &&
  previous.mediaHeight === next.mediaHeight &&
  previous.onSelect === next.onSelect,
);

function DiscoveryModule({
  kind,
  title,
  support,
  items,
  contentWidth,
  fontScale,
  onSelect,
}: {
  kind: TonightDiscoveryKind;
  title: string;
  support?: string;
  items: TonightDiscoveryItem[];
  contentWidth: number;
  fontScale: number;
  onSelect: (selection: ProgrammeSelection) => void;
}) {
  if (items.length === 0) return null;
  const metrics = tonightCardMetrics({ kind, contentWidth, fontScale });

  return (
    <View style={styles.module}>
      <View style={styles.moduleHeadingInset}>
        <SectionHeading title={title} {...(support ? { support } : {})} />
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        style={styles.carousel}
      >
        {items.map((item, index) => (
          <DiscoveryCard
            key={`${item.programme.id}-${index}`}
            kind={kind}
            item={item}
            width={metrics.width}
            mediaHeight={metrics.mediaHeight}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function AvailabilityNotice({
  kind,
  onRetry,
}: {
  kind: 'loading' | 'partial' | 'unavailable';
  onRetry: () => void;
}) {
  const theme = useTeeveeTheme();
  const text =
    kind === 'loading'
      ? 'Vanavond laden…'
      : kind === 'partial'
        ? "Niet alle programma's voor vanavond zijn beschikbaar."
        : 'Kijktips en categorieën zijn tijdelijk niet beschikbaar.';

  return (
    <View
      accessibilityLiveRegion="polite"
      style={styles.availabilityNotice}
    >
      <Text
        style={[
          styles.availabilityText,
          {
            color: theme.colors.textSecondary,
            fontFamily: TEEVEE_FONT_FAMILIES.regular,
          },
        ]}
      >
        {text}
      </Text>
      {kind === 'unavailable' ? (
        <Pressable
          testID="tonight-retry"
          accessibilityRole="button"
          accessibilityLabel="Vanavond opnieuw laden"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            {
              borderColor: theme.colors.border,
              backgroundColor: pressed ? theme.colors.surface : 'transparent',
            },
          ]}
        >
          <Text
            style={[
              styles.retryText,
              {
                color: theme.colors.text,
                fontFamily: TEEVEE_FONT_FAMILIES.semibold,
              },
            ]}
          >
            Opnieuw
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function TonightScreen() {
  const theme = useTeeveeTheme();
  const router = useRouter();
  const { width: windowWidth, fontScale = 1 } = useWindowDimensions();
  const liveNowMs = useGuideClock();
  const runtime = useTonightRuntime();
  const [personalState, setPersonalState] = useState<ProgrammePersonalState>(
    () => readProgrammePersonalState(),
  );
  const [developmentScenario, setDevelopmentScenario] =
    useState<TonightDevelopmentScenario>('live');
  const [developmentMenuVisible, setDevelopmentMenuVisible] = useState(false);
  const [detail, dispatchDetail] = useReducer(detailReducer, initialDetailState);
  const televisionDayStartMs = guideTelevisionDayStart(liveNowMs);
  const previousTelevisionDayRef = useRef(televisionDayStartMs);
  const previousDevelopmentScenarioRef =
    useRef<TonightDevelopmentScenario>(developmentScenario);
  const contentWidth = Math.max(0, windowWidth - PAGE_INSET * 2);

  const refreshForMode = useCallback(
    (anchorMs: number) => {
      if (
        DEVELOPMENT_CONTROLS_ENABLED &&
        developmentScenario === 'offline'
      ) {
        return;
      }
      const developmentAnchor = DEVELOPMENT_CONTROLS_ENABLED
        ? tonightDevelopmentRefreshAnchor(developmentScenario, anchorMs)
        : null;
      void tonightRuntime.refresh(developmentAnchor ?? anchorMs);
    },
    [developmentScenario],
  );

  useFocusEffect(
    useCallback(() => {
      setPersonalState(readProgrammePersonalState());
      refreshForMode(Date.now());
      return undefined;
    }, [refreshForMode]),
  );

  useEffect(() => {
    const televisionDayChanged =
      previousTelevisionDayRef.current !== televisionDayStartMs;
    const developmentScenarioChanged =
      previousDevelopmentScenarioRef.current !== developmentScenario;

    previousTelevisionDayRef.current = televisionDayStartMs;
    previousDevelopmentScenarioRef.current = developmentScenario;

    if (!televisionDayChanged && !developmentScenarioChanged) return;

    if (
      DEVELOPMENT_CONTROLS_ENABLED &&
      developmentScenario !== 'live'
    ) {
      const developmentAnchor = tonightDevelopmentRefreshAnchor(
        developmentScenario,
        televisionDayStartMs,
      );
      if (developmentAnchor !== null) {
        void tonightRuntime.refresh(developmentAnchor);
      }
      return;
    }

    if (developmentScenarioChanged) {
      void tonightRuntime.refresh(Date.now());
      return;
    }
    tonightRuntime.ensureTelevisionDay(televisionDayStartMs);
  }, [developmentScenario, televisionDayStartMs]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setPersonalState(readProgrammePersonalState());
      refreshForMode(Date.now());
    });
    return () => subscription.remove();
  }, [refreshForMode]);

  const developmentState = useMemo(
    () =>
      DEVELOPMENT_CONTROLS_ENABLED
        ? resolveTonightDevelopmentState({
            scenario: developmentScenario,
            liveNowMs,
            runtime,
            personalState,
          })
        : {
            nowMs: liveNowMs,
            runtime,
            personalState,
          },
    [developmentScenario, liveNowMs, runtime, personalState],
  );

  const baseModel = useMemo(
    () =>
      buildTonightViewModel({
        schedule: developmentState.runtime.data?.schedule ?? null,
        editorialSignals:
          developmentState.runtime.data?.editorialSignals ?? [],
        classifications:
          developmentState.runtime.data?.classifications ?? [],
        personalState: developmentState.personalState,
        nowMs: developmentState.nowMs,
      }),
    [developmentState],
  );
  const model = useMemo(
    () =>
      DEVELOPMENT_CONTROLS_ENABLED
        ? applyTonightDevelopmentModuleState(
            developmentScenario,
            baseModel,
          )
        : baseModel,
    [baseModel, developmentScenario],
  );

  const retryTonight = useCallback(() => {
    refreshForMode(Date.now());
  }, [refreshForMode]);

  const openProgramme = useCallback((selection: ProgrammeSelection) => {
    dispatchDetail({ type: 'open', selection });
  }, []);

  const closeDetail = useCallback(() => {
    dispatchDetail({ type: 'close' });
    setPersonalState(readProgrammePersonalState());
  }, []);

  const goToGuide = useCallback(() => {
    router.push('/');
  }, [router]);

  const largeSavedRows = fontScale > 1.35;
  const savedCount = model.saved.length;
  const savedSupport =
    savedCount === 1
      ? '1 bewaarde uitzending'
      : `${savedCount} bewaarde uitzendingen`;

  return (
    <>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.headerWrap}>
          <AppScreenHeader title="Vanavond" action={<SettingsButton />} />
        </View>

        <ScrollView
          testID="tonight-page"
          style={styles.page}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <Text
            testID="tonight-evening-date"
            accessibilityLabel={`Televisieavond ${model.eveningDateLabel}`}
            onLongPress={
              DEVELOPMENT_CONTROLS_ENABLED
                ? () => setDevelopmentMenuVisible((visible) => !visible)
                : undefined
            }
            style={[
              styles.eveningDate,
              {
                color: theme.colors.textSecondary,
                fontFamily: TEEVEE_FONT_FAMILIES.regular,
              },
            ]}
          >
            {model.eveningDateLabel}
          </Text>

          {DEVELOPMENT_CONTROLS_ENABLED && developmentMenuVisible ? (
            <View
              testID="tonight-development-controls"
              style={[
                styles.developmentControls,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.developmentTitle,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
                  },
                ]}
              >
                Development state · geen productiecontent
              </Text>
              <View style={styles.developmentButtons}>
                {TONIGHT_DEVELOPMENT_SCENARIOS.map((scenario) => (
                  <Pressable
                    key={scenario.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setDevelopmentScenario(scenario.id);
                      setDevelopmentMenuVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.developmentButton,
                      {
                        borderColor:
                          developmentScenario === scenario.id
                            ? theme.colors.currentTime
                            : theme.colors.border,
                        opacity: pressed ? 0.62 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.developmentButtonText,
                        {
                          color: theme.colors.text,
                          fontFamily: TEEVEE_FONT_FAMILIES.medium,
                        },
                      ]}
                    >
                      {scenario.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.firstModule}>
            <SectionHeading
              title="Jouw gids"
              {...(savedCount > 0 ? { support: savedSupport } : {})}
            />
            <View style={styles.savedContent}>
              {savedCount > 0 ? (
                model.saved.map((item) => (
                  <SavedRow
                    key={item.snapshot.programmeId}
                    item={item}
                    largeText={largeSavedRows}
                    onSelect={openProgramme}
                  />
                ))
              ) : (
                <View style={styles.savedEmpty}>
                  <Text
                    style={[
                      styles.emptyText,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: TEEVEE_FONT_FAMILIES.regular,
                      },
                    ]}
                  >
                    {developmentState.personalState.hasUsedSave
                      ? 'Je hebt voor vanavond nog niets bewaard.'
                      : "Bewaar programma's die je vanavond wilt zien. Dan staat je tv-avond hier overzichtelijk bij elkaar."}
                  </Text>
                  <Pressable
                    testID="tonight-open-guide"
                    accessibilityRole="button"
                    onPress={goToGuide}
                    style={({ pressed }) => [
                      styles.guideButton,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: pressed
                          ? theme.colors.surface
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.guideButtonText,
                        {
                          color: theme.colors.text,
                          fontFamily: TEEVEE_FONT_FAMILIES.semibold,
                        },
                      ]}
                    >
                      Bekijk de gids
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {developmentState.runtime.phase === 'loading' ? (
            <AvailabilityNotice kind="loading" onRetry={retryTonight} />
          ) : developmentState.runtime.phase === 'partial' ? (
            <AvailabilityNotice kind="partial" onRetry={retryTonight} />
          ) : developmentState.runtime.phase === 'unavailable' ? (
            <AvailabilityNotice
              kind="unavailable"
              onRetry={retryTonight}
            />
          ) : null}

          <DiscoveryModule
            kind="kijktip"
            title="Onze Kijktips"
            support={
              model.kijktips.length === 1
                ? '1 tip voor vanavond'
                : `${model.kijktips.length} tips voor vanavond`
            }
            items={model.kijktips}
            contentWidth={contentWidth}
            fontScale={fontScale}
            onSelect={openProgramme}
          />
          <DiscoveryModule
            kind="film"
            title="Films vanavond"
            items={model.films}
            contentWidth={contentWidth}
            fontScale={fontScale}
            onSelect={openProgramme}
          />
          <DiscoveryModule
            kind="series"
            title="Series vanavond"
            items={model.series}
            contentWidth={contentWidth}
            fontScale={fontScale}
            onSelect={openProgramme}
          />
          <DiscoveryModule
            kind="sport"
            title="Sport vanavond"
            items={model.sport}
            contentWidth={contentWidth}
            fontScale={fontScale}
            onSelect={openProgramme}
          />
        </ScrollView>
      </SafeAreaView>

      <ProgrammeDetail state={detail} onClose={closeDetail} />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerWrap: {
    paddingHorizontal: PAGE_INSET,
    paddingTop: 18,
  },
  page: {
    flex: 1,
  },
  pageContent: {
    paddingBottom: 40,
  },
  eveningDate: {
    paddingHorizontal: PAGE_INSET,
    fontSize: 14,
    lineHeight: 20,
  },
  developmentControls: {
    marginHorizontal: PAGE_INSET,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  developmentTitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  developmentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  developmentButton: {
    minHeight: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  developmentButtonText: {
    fontSize: 12,
    lineHeight: 16,
  },
  firstModule: {
    marginTop: 24,
    paddingHorizontal: PAGE_INSET,
  },
  module: {
    marginTop: MODULE_GAP,
  },
  moduleHeadingInset: {
    paddingHorizontal: PAGE_INSET,
  },
  sectionHeading: {
    fontSize: 22,
    lineHeight: 28,
  },
  sectionSupport: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 19,
  },
  savedContent: {
    marginTop: HEADING_CONTENT_GAP,
  },
  savedRow: {
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  savedRowColumns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedRowStacked: {
    alignItems: 'stretch',
  },
  savedStackedTopLine: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  savedTimeColumn: {
    width: 64,
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
  },
  savedTime: {
    fontSize: 16,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  savedProgrammeContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
  },
  savedProgrammeContentStacked: {
    marginLeft: 0,
  },
  savedTitleLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  savedTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 21,
  },
  savedChannel: {
    marginTop: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  nowCapsule: {
    minHeight: 24,
    flexShrink: 0,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowCapsuleText: {
    fontSize: 13,
    lineHeight: 16,
  },
  savedEmpty: {
    alignItems: 'flex-start',
    gap: 12,
  },
  emptyText: {
    maxWidth: 480,
    fontSize: 15,
    lineHeight: 21,
  },
  guideButton: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideButtonText: {
    fontSize: 14,
    lineHeight: 19,
  },
  availabilityNotice: {
    marginTop: MODULE_GAP,
    paddingHorizontal: PAGE_INSET,
    alignItems: 'flex-start',
    gap: 8,
  },
  availabilityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    minHeight: 48,
    minWidth: 80,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 14,
    lineHeight: 19,
  },
  carousel: {
    marginTop: HEADING_CONTENT_GAP,
  },
  carouselContent: {
    paddingHorizontal: PAGE_INSET,
    gap: CAROUSEL_GAP,
  },
  discoveryCard: {
    flexShrink: 0,
  },
  mediaFallback: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  mediaChannelIdentity: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  kijktipTextPanel: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  discoveryCardTitle: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 19,
  },
  seriesCardTitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 18,
  },
  discoveryCardMetadata: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
  },
  seriesCardMetadata: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 17,
  },
  kijktipMetadata: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 18,
  },
  sportTextBlock: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  sportFallbackTitle: {
    fontSize: 15,
    lineHeight: 19,
  },
  sportFallbackMetadata: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
});
