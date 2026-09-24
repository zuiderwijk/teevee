import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppScreenHeader } from '@/components/AppScreenHeader';
import { useChannelPersonalisationSettings } from '@/features/channels/ChannelPersonalisationProvider';
import { ChannelIdentity } from '@/features/guide/ChannelIdentity';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

export default function ChannelsScreen() {
  const router = useRouter();
  const theme = useTeeveeTheme();
  const {
    catalog,
    selectedChannelIds,
    isChannelVisible,
    canHideChannel,
    setChannelVisible,
    moveChannel,
  } = useChannelPersonalisationSettings();

  const byId = useMemo(
    () => new Map(catalog.map((channel) => [channel.id, channel])),
    [catalog],
  );
  const selectedChannels = useMemo(
    () =>
      selectedChannelIds
        .map((id) => byId.get(id))
        .filter((channel): channel is NonNullable<typeof channel> => channel !== undefined),
    [byId, selectedChannelIds],
  );
  const hiddenChannels = useMemo(
    () => catalog.filter((channel) => !isChannelVisible(channel.id)),
    [catalog, isChannelVisible],
  );

  const done = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sluit Mijn zenders"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={({ pressed }) => [
        styles.doneButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.doneText,
          {
            color: theme.colors.textSecondary,
            fontFamily: TEEVEE_FONT_FAMILIES.semibold,
          },
        ]}
      >
        Gereed
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <AppScreenHeader title="Mijn zenders" action={done} />
        <Text style={[styles.intro, { color: theme.colors.textSecondary }]}>
          Kies welke zenders je in de gids ziet en bepaal de volgorde. Nieuwe ondersteunde zenders worden automatisch achteraan toegevoegd.
        </Text>

        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
          IN MIJN ZENDERS
        </Text>
        <View
          style={[
            styles.group,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {selectedChannels.map((channel, index) => (
            <View
              key={channel.id}
              testID={`channels-visible-${channel.id}`}
              style={[
                styles.row,
                index > 0 && {
                  borderTopColor: theme.colors.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={styles.identity}>
                <ChannelIdentity
                  channel={channel}
                  textColor={theme.colors.text}
                  mutedTextColor={theme.colors.textSecondary}
                  variant="detail"
                  accessible
                />
              </View>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${channel.displayName} omhoog`}
                  accessibilityState={{ disabled: index === 0 }}
                  disabled={index === 0}
                  onPress={() => moveChannel(channel.id, -1)}
                  style={({ pressed }) => [
                    styles.action,
                    {
                      borderColor: theme.colors.border,
                      opacity: index === 0 ? 0.35 : pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.actionText, { color: theme.colors.textSecondary }]}
                  >
                    Omhoog
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${channel.displayName} omlaag`}
                  accessibilityState={{
                    disabled: index === selectedChannels.length - 1,
                  }}
                  disabled={index === selectedChannels.length - 1}
                  onPress={() => moveChannel(channel.id, 1)}
                  style={({ pressed }) => [
                    styles.action,
                    {
                      borderColor: theme.colors.border,
                      opacity:
                        index === selectedChannels.length - 1
                          ? 0.35
                          : pressed
                            ? 0.6
                            : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.actionText, { color: theme.colors.textSecondary }]}
                  >
                    Omlaag
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${channel.displayName} verbergen`}
                  accessibilityState={{ disabled: !canHideChannel(channel.id) }}
                  disabled={!canHideChannel(channel.id)}
                  onPress={() => setChannelVisible(channel.id, false)}
                  style={({ pressed }) => [
                    styles.action,
                    {
                      borderColor: theme.colors.border,
                      opacity: !canHideChannel(channel.id)
                        ? 0.35
                        : pressed
                          ? 0.6
                          : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.actionText, { color: theme.colors.textSecondary }]}
                  >
                    Verberg
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {hiddenChannels.length > 0 ? (
          <>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
              VERBORGEN
            </Text>
            <View
              style={[
                styles.group,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              {hiddenChannels.map((channel, index) => (
                <View
                  key={channel.id}
                  testID={`channels-hidden-${channel.id}`}
                  style={[
                    styles.row,
                    index > 0 && {
                      borderTopColor: theme.colors.border,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View style={styles.identity}>
                    <ChannelIdentity
                      channel={channel}
                      textColor={theme.colors.text}
                      mutedTextColor={theme.colors.textSecondary}
                      variant="detail"
                      accessible
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${channel.displayName} toevoegen aan Mijn zenders`}
                    onPress={() => setChannelVisible(channel.id, true)}
                    style={({ pressed }) => [
                      styles.addButton,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceElevated,
                        opacity: pressed ? 0.68 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.addText, { color: theme.colors.text }]}>
                      Toevoegen
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  doneButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  doneText: { fontSize: 13, lineHeight: 18 },
  intro: { marginTop: 14, fontSize: 14, lineHeight: 20 },
  sectionLabel: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  group: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  identity: { flex: 1, minWidth: 0, minHeight: 44, justifyContent: 'center' },
  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    maxWidth: 190,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 9,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionText: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  addButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addText: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
});
