import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { guideFixture, programmesForChannel } from '@/data/fixtures/guideFixture';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

export default function GuideScreen() {
  const theme = useTeeveeTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>VRIJDAG 11 SEPTEMBER</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Gids</Text>
        </View>
        <View style={[styles.nowBadge, { backgroundColor: theme.colors.accent }]}>
          <Text style={[styles.nowText, { color: theme.colors.background }]}>Nu</Text>
        </View>
      </View>

      <View style={[styles.prototypeNotice, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.noticeTitle, { color: theme.colors.text }]}>Guide foundation</Text>
        <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
          {guideFixture.channels.length} kanalen · {guideFixture.programmes.length} programma's · 49 uur deterministische data
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.channelList}>
        {guideFixture.channels.slice(0, 8).map((channel) => {
          const programmes = programmesForChannel(channel.id).slice(0, 3);
          return (
            <View key={channel.id} style={[styles.channelRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.channel, { color: theme.colors.text }]}>{channel.displayName}</Text>
              <View style={styles.programmes}>
                {programmes.map((programme) => (
                  <View key={programme.id} style={[styles.programme, { backgroundColor: theme.colors.programme }]}>
                    <Text numberOfLines={2} style={[styles.programmeTitle, { color: theme.colors.text }]}>{programme.title}</Text>
                    <Text style={[styles.programmeTime, { color: theme.colors.textMuted }]}>
                      {new Date(programme.startAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1.2 },
  nowBadge: { minWidth: 52, height: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nowText: { fontSize: 14, fontWeight: '700' },
  prototypeNotice: { marginHorizontal: 20, marginBottom: 8, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12 },
  noticeTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  noticeText: { fontSize: 13, lineHeight: 18 },
  channelList: { paddingHorizontal: 20, paddingBottom: 32 },
  channelRow: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  channel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  programmes: { flexDirection: 'row', gap: 8 },
  programme: { flex: 1, minHeight: 84, borderRadius: 10, padding: 10, justifyContent: 'space-between' },
  programmeTitle: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  programmeTime: { fontSize: 11, marginTop: 8 },
});
