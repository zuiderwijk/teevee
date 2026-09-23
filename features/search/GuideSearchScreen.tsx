import { useMemo, useReducer } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppScreenHeader } from '@/components/AppScreenHeader';
import { SettingsButton } from '@/components/SettingsButton';
import type { Channel } from '@/data/domain/epg';
import {
  guideSearchPerChannelIntent,
  guideSearchProgrammeDetailIntent,
  type GuideSearchProgrammeMatch,
} from '@/data/domain/search';
import { ChannelIdentity } from '@/features/guide/ChannelIdentity';
import {
  detailReducer,
  initialDetailState,
} from '@/features/guide/detailState';
import { publishGuideNavigationIntent } from '@/features/guide/guideNavigationIntent';
import { ProgrammeDetail } from '@/features/guide/ProgrammeDetail';
import { useGuideClock } from '@/features/guide/useGuideClock';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';
import { GUIDE_SEARCH_MAX_QUERY_LENGTH } from '@/services/api/guideSearchContract';

import {
  guideSearchBroadcastContext,
  guideSearchProgrammeAccessibilityLabel,
  guideSearchProgrammeIsCurrent,
} from './searchPresentation';
import {
  guideSearchSession,
  useGuideSearchSession,
} from './searchSession';

function SectionTitle({ children }: { children: string }) {
  const theme = useTeeveeTheme();

  return (
    <Text
      accessibilityRole="header"
      style={[
        styles.sectionTitle,
        {
          color: theme.colors.textSecondary,
          fontFamily: TEEVEE_FONT_FAMILIES.semibold,
        },
      ]}
    >
      {children}
    </Text>
  );
}

function AvailabilityNotice({
  children,
  retry,
}: {
  children: string;
  retry?: () => void;
}) {
  const theme = useTeeveeTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.availabilityNotice,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
      ]}
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
        {children}
      </Text>
      {retry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoeken opnieuw proberen"
          onPress={retry}
          style={({ pressed }) => [
            styles.retryButton,
            {
              borderColor: theme.colors.border,
              opacity: pressed ? 0.68 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.retryLabel,
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

function ChannelResult({
  channel,
  onPress,
}: {
  channel: Channel;
  onPress: () => void;
}) {
  const theme = useTeeveeTheme();

  return (
    <Pressable
      testID={`search-channel-${channel.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${channel.displayName}, open Per zender`}
      accessibilityHint="Opent de gids voor deze zender rond het huidige tijdstip"
      onPress={onPress}
      style={({ pressed }) => [
        styles.resultRow,
        {
          borderBottomColor: theme.colors.border,
          backgroundColor: pressed ? theme.colors.surface : 'transparent',
        },
      ]}
    >
      <View style={styles.channelIdentity}>
        <ChannelIdentity
          channel={channel}
          textColor={theme.colors.text}
          mutedTextColor={theme.colors.textSecondary}
          variant="detail"
          accessible={false}
        />
      </View>
      <Text
        accessible={false}
        style={[
          styles.channelAction,
          {
            color: theme.colors.textMuted,
            fontFamily: TEEVEE_FONT_FAMILIES.medium,
          },
        ]}
      >
        Per zender
      </Text>
    </Pressable>
  );
}

function ProgrammeResult({
  match,
  nowMs,
  isKijktip,
  onPress,
}: {
  match: GuideSearchProgrammeMatch;
  nowMs: number;
  isKijktip: boolean;
  onPress: () => void;
}) {
  const theme = useTeeveeTheme();
  const { programme, channel } = match;
  const current = guideSearchProgrammeIsCurrent(programme, nowMs);
  const context = guideSearchBroadcastContext(programme, nowMs);
  const subtitle = programme.subtitle?.trim();

  return (
    <Pressable
      testID={`search-programme-${programme.id}`}
      accessibilityRole="button"
      accessibilityLabel={guideSearchProgrammeAccessibilityLabel({
        match,
        nowMs,
        isKijktip,
      })}
      accessibilityHint="Opent programmadetails"
      onPress={onPress}
      style={({ pressed }) => [
        styles.programmeResult,
        {
          borderBottomColor: theme.colors.border,
          backgroundColor: pressed ? theme.colors.surface : 'transparent',
        },
      ]}
    >
      <View style={styles.programmeText}>
        <Text
          style={[
            styles.programmeTitle,
            {
              color: theme.colors.text,
              fontFamily: TEEVEE_FONT_FAMILIES.semibold,
            },
          ]}
        >
          {programme.title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={[
              styles.programmeSubtitle,
              {
                color: theme.colors.textSecondary,
                fontFamily: TEEVEE_FONT_FAMILIES.regular,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
        <Text
          style={[
            styles.programmeContext,
            {
              color: current ? theme.colors.currentTime : theme.colors.textSecondary,
              fontFamily:
                current
                  ? TEEVEE_FONT_FAMILIES.semibold
                  : TEEVEE_FONT_FAMILIES.regular,
            },
          ]}
        >
          {context} · {channel.displayName}
        </Text>
        {isKijktip ? (
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.kijktipLabel,
              { backgroundColor: theme.colors.editorialAccentSurface },
            ]}
          >
            <Text
              style={[
                styles.kijktipText,
                {
                  color: theme.colors.editorialAccent,
                  fontFamily: TEEVEE_FONT_FAMILIES.medium,
                },
              ]}
            >
              Kijktip
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function GuideSearchScreen() {
  const theme = useTeeveeTheme();
  const router = useRouter();
  const nowMs = useGuideClock();
  const session = useGuideSearchSession();
  const [detail, dispatchDetail] = useReducer(detailReducer, initialDetailState);
  const response = session.response;

  const kijktipIds = useMemo(
    () =>
      new Set(
        response?.editorialSignals
          .filter((signal) => signal.type === 'kijktip')
          .map((signal) => signal.programmeId) ?? [],
      ),
    [response?.editorialSignals],
  );

  const openProgramme = (match: GuideSearchProgrammeMatch) => {
    Keyboard.dismiss();
    const intent = guideSearchProgrammeDetailIntent(match);
    dispatchDetail({ type: 'open', selection: intent.match });
  };

  const openChannel = (channel: Channel) => {
    Keyboard.dismiss();
    publishGuideNavigationIntent(guideSearchPerChannelIntent(channel, Date.now()));
    router.push('/');
  };

  const channelMatches = response?.channelMatches ?? [];
  const programmeMatches = response?.programmeMatches ?? [];
  const hasResults = channelMatches.length > 0 || programmeMatches.length > 0;
  const searching = session.phase === 'loading';
  const meaningfulQuery = session.phase !== 'idle';

  return (
    <>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.headerWrap}>
          <AppScreenHeader title="Zoeken" action={<SettingsButton />} />
        </View>

        <View
          style={[
            styles.searchField,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            testID="guide-search-input"
            accessibilityLabel="Zoek programma of zender"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            clearButtonMode="never"
            maxLength={GUIDE_SEARCH_MAX_QUERY_LENGTH}
            placeholder="Programma of zender"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="search"
            value={session.query}
            onChangeText={guideSearchSession.setQuery}
            onSubmitEditing={() => Keyboard.dismiss()}
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
                fontFamily: TEEVEE_FONT_FAMILIES.regular,
              },
            ]}
          />
          {session.query.length > 0 ? (
            <Pressable
              testID="guide-search-clear"
              accessibilityRole="button"
              accessibilityLabel="Wis zoekopdracht"
              onPress={() => guideSearchSession.clear()}
              style={({ pressed }) => [
                styles.clearButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.clearLabel,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
                  },
                ]}
              >
                Wis
              </Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          testID="guide-search-results"
          style={styles.resultsScroll}
          contentContainerStyle={styles.resultsContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {searching ? (
            <View
              accessibilityLiveRegion="polite"
              style={styles.loadingState}
            >
              <ActivityIndicator color={theme.colors.textSecondary} />
              <Text
                style={[
                  styles.stateText,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: TEEVEE_FONT_FAMILIES.regular,
                  },
                ]}
              >
                Zoeken…
              </Text>
            </View>
          ) : null}

          {session.phase === 'unavailable' ? (
            <AvailabilityNotice retry={guideSearchSession.retry}>
              Zoeken is tijdelijk niet beschikbaar.
            </AvailabilityNotice>
          ) : null}

          {response?.programmeCoverage === 'partial' ? (
            <AvailabilityNotice retry={guideSearchSession.retry}>
              Niet alle gidsdagen zijn beschikbaar. De resultaten hieronder komen
              uit het deel van de gids dat wel compleet is.
            </AvailabilityNotice>
          ) : null}

          {response?.programmeCoverage === 'unavailable' ? (
            <AvailabilityNotice retry={guideSearchSession.retry}>
              Programma’s zijn tijdelijk niet beschikbaar. Zenders zoeken werkt
              wel.
            </AvailabilityNotice>
          ) : null}

          {channelMatches.length > 0 ? (
            <View style={styles.section}>
              <SectionTitle>Zenders</SectionTitle>
              <View>
                {channelMatches.map((channel) => (
                  <ChannelResult
                    key={channel.id}
                    channel={channel}
                    onPress={() => openChannel(channel)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {programmeMatches.length > 0 ? (
            <View style={styles.section}>
              <SectionTitle>Programma’s</SectionTitle>
              <View>
                {programmeMatches.map((match) => (
                  <ProgrammeResult
                    key={match.programme.id}
                    match={match}
                    nowMs={nowMs}
                    isKijktip={kijktipIds.has(match.programme.id)}
                    onPress={() => openProgramme(match)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {session.phase === 'ready' &&
          response?.programmeCoverage === 'complete' &&
          !hasResults ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.noResults,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: TEEVEE_FONT_FAMILIES.regular,
                },
              ]}
            >
              Geen resultaten gevonden.
            </Text>
          ) : null}

          {!meaningfulQuery && session.query.length === 0 ? (
            <Text
              style={[
                styles.emptyHint,
                {
                  color: theme.colors.textMuted,
                  fontFamily: TEEVEE_FONT_FAMILIES.regular,
                },
              ]}
            >
              Zoek naar een programma of zender.
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <ProgrammeDetail
        state={detail}
        onClose={() => dispatchDetail({ type: 'close' })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  searchField: {
    minHeight: 52,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    lineHeight: 22,
  },
  clearButton: {
    minWidth: 52,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  clearLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultsScroll: {
    flex: 1,
    marginTop: 8,
  },
  resultsContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingState: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 15,
    lineHeight: 21,
  },
  availabilityNotice: {
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    alignItems: 'flex-start',
  },
  availabilityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    minHeight: 44,
    minWidth: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    marginBottom: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  resultRow: {
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  channelIdentity: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    justifyContent: 'center',
  },
  channelAction: {
    flexShrink: 0,
    fontSize: 13,
    lineHeight: 18,
  },
  programmeResult: {
    minHeight: 68,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 11,
    flexDirection: 'row',
  },
  programmeText: {
    flex: 1,
    minWidth: 0,
  },
  programmeTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  programmeSubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 19,
  },
  programmeContext: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  kijktipLabel: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  kijktipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  noResults: {
    marginTop: 22,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyHint: {
    marginTop: 18,
    fontSize: 15,
    lineHeight: 22,
  },
});
