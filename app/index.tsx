import { useMemo, useRef } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { guideFixture, programmesForChannel } from '@/data/fixtures/guideFixture';
import {
  buildTimeTicks,
  GUIDE_CHANNEL_WIDTH,
  GUIDE_ROW_HEIGHT,
  GUIDE_TIME_AXIS_HEIGHT,
  programmeFrame,
  timeToX,
  timelineWidth,
} from '@/features/guide/geometry';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

const WINDOW_START = Date.parse('2026-09-11T16:00:00.000Z');
const WINDOW_END = Date.parse('2026-09-12T04:00:00.000Z');
const DEMO_NOW = Date.parse('2026-09-11T18:30:00.000Z');

function formatTime(timeMs: number) {
  return new Date(timeMs).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

export default function GuideScreen() {
  const theme = useTeeveeTheme();
  const horizontalRef = useRef<ScrollView>(null);
  const channelRef = useRef<ScrollView>(null);
  const timelineRef = useRef<ScrollView>(null);
  const width = timelineWidth(WINDOW_START, WINDOW_END);
  const ticks = useMemo(() => buildTimeTicks(WINDOW_START, WINDOW_END), []);
  const nowX = timeToX(DEMO_NOW, WINDOW_START);

  const jumpToNow = () => {
    horizontalRef.current?.scrollTo({ x: Math.max(0, nowX - 120), animated: true });
  };

  const syncVerticalScroll = (y: number) => {
    channelRef.current?.scrollTo({ y, animated: false });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>VRIJDAG 11 SEPTEMBER</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Gids</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ga naar nu" onPress={jumpToNow} style={[styles.nowBadge, { backgroundColor: theme.colors.accent }]}>
          <Text style={[styles.nowText, { color: theme.colors.background }]}>Nu</Text>
        </Pressable>
      </View>

      <View style={[styles.guideFrame, { borderColor: theme.colors.border }]}>
        <View style={[styles.channelColumn, { width: GUIDE_CHANNEL_WIDTH, backgroundColor: theme.colors.surface, borderRightColor: theme.colors.border }]}>
          <View style={[styles.channelAxisCorner, { height: GUIDE_TIME_AXIS_HEIGHT, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.axisCornerText, { color: theme.colors.textMuted }]}>ZENDER</Text>
          </View>
          <ScrollView ref={channelRef} showsVerticalScrollIndicator={false} scrollEnabled={false}>
            {guideFixture.channels.map((channel) => (
              <View key={channel.id} style={[styles.channelCell, { height: GUIDE_ROW_HEIGHT, borderBottomColor: theme.colors.border }]}>
                <Text numberOfLines={2} style={[styles.channelName, { color: theme.colors.text }]}>{channel.displayName}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          ref={horizontalRef}
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: Math.max(0, nowX - 120), y: 0 }}
        >
          <View style={{ width }}>
            <View style={[styles.timeAxis, { height: GUIDE_TIME_AXIS_HEIGHT, backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
              {ticks.map((tick) => {
                const left = timeToX(tick, WINDOW_START);
                return (
                  <View key={tick} style={[styles.tick, { left, borderLeftColor: theme.colors.border }]}>
                    <Text style={[styles.tickLabel, { color: theme.colors.textMuted }]}>{formatTime(tick)}</Text>
                  </View>
                );
              })}
            </View>

            <ScrollView
              ref={timelineRef}
              bounces={false}
              showsVerticalScrollIndicator
              scrollEventThrottle={16}
              onScroll={(event) => syncVerticalScroll(event.nativeEvent.contentOffset.y)}
            >
              <View style={{ width, height: guideFixture.channels.length * GUIDE_ROW_HEIGHT }}>
                {guideFixture.channels.map((channel, rowIndex) => (
                  <View key={channel.id} style={[styles.programmeRow, { top: rowIndex * GUIDE_ROW_HEIGHT, height: GUIDE_ROW_HEIGHT, width, borderBottomColor: theme.colors.border }]}>
                    {programmesForChannel(channel.id).map((programme) => {
                      const frame = programmeFrame(programme, WINDOW_START);
                      const end = frame.left + frame.width;
                      if (end < 0 || frame.left > width) return null;
                      return (
                        <Pressable
                          key={programme.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${programme.title}, ${formatTime(Date.parse(programme.startAt))}`}
                          style={[styles.programme, { left: frame.left, width: frame.width, backgroundColor: theme.colors.programme }]}
                        >
                          <Text numberOfLines={2} style={[styles.programmeTitle, { color: theme.colors.text }]}>{programme.title}</Text>
                          <Text style={[styles.programmeTime, { color: theme.colors.textMuted }]}>{formatTime(Date.parse(programme.startAt))}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
                <View pointerEvents="none" style={[styles.currentTimeLine, { left: nowX, backgroundColor: theme.colors.currentTime, height: guideFixture.channels.length * GUIDE_ROW_HEIGHT }]} />
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1.2 },
  nowBadge: { minWidth: 52, height: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nowText: { fontSize: 14, fontWeight: '700' },
  guideFrame: { flex: 1, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  channelColumn: { zIndex: 2, borderRightWidth: StyleSheet.hairlineWidth },
  channelAxisCorner: { justifyContent: 'center', paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  axisCornerText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  channelCell: { justifyContent: 'center', paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  channelName: { fontSize: 12, fontWeight: '700' },
  timeAxis: { position: 'relative', borderBottomWidth: StyleSheet.hairlineWidth },
  tick: { position: 'absolute', top: 0, bottom: 0, width: 1, borderLeftWidth: StyleSheet.hairlineWidth, paddingLeft: 6, paddingTop: 11 },
  tickLabel: { fontSize: 10, fontWeight: '600', width: 42 },
  programmeRow: { position: 'absolute', left: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  programme: { position: 'absolute', top: 4, bottom: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, justifyContent: 'space-between', overflow: 'hidden' },
  programmeTitle: { fontSize: 12, lineHeight: 15, fontWeight: '600' },
  programmeTime: { fontSize: 10, marginTop: 4 },
  currentTimeLine: { position: 'absolute', top: 0, width: 2, zIndex: 4 },
});
