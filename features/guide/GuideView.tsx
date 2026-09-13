import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { programmeProgress } from '@/data/domain/epg';
import { guideDayStart, GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import { buildRuntimeGuideFixture, programmesForRuntimeChannel } from '@/data/fixtures/runtimeGuideFixture';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import type { ProgrammeSelection } from './detailState';
import {
  buildTimeTicks,
  GUIDE_CHANNEL_WIDTH,
  GUIDE_MINUTE_WIDTH,
  GUIDE_ROW_HEIGHT,
  GUIDE_TIME_AXIS_HEIGHT,
  programmeContentMode,
  programmeFrame,
  timeToX,
  timelineWidth,
} from './geometry';
import { useGuideClock } from './useGuideClock';

type GuideViewProps = {
  onSelectProgramme: (selection: ProgrammeSelection) => void;
};

function formatTime(timeMs: number) {
  return new Date(timeMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: GUIDE_TIME_ZONE });
}

function formatDay(timeMs: number) {
  return new Date(timeMs).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: GUIDE_TIME_ZONE });
}

// Modal visibility lives outside this memo boundary. Keep the same mounted
// ScrollViews and stable selection callback when opening or closing a detail.
export const GuideView = memo(function GuideView({ onSelectProgramme }: GuideViewProps) {
  const theme = useTeeveeTheme();
  const horizontalRef = useRef<ScrollView>(null);
  const channelRef = useRef<ScrollView>(null);
  const [initialNow] = useState(() => Date.now());
  const runtimeFixture = useMemo(() => buildRuntimeGuideFixture(initialNow), [initialNow]);
  const [dayOffset, setDayOffset] = useState(0);
  const nowMs = useGuideClock();

  const windowStart = useMemo(() => Math.min(...runtimeFixture.programmes.map((programme) => Date.parse(programme.startAt))), [runtimeFixture]);
  const windowEnd = useMemo(() => Math.max(...runtimeFixture.programmes.map((programme) => Date.parse(programme.endAt))), [runtimeFixture]);
  const width = timelineWidth(windowStart, windowEnd);
  const ticks = useMemo(() => buildTimeTicks(windowStart, windowEnd), [windowStart, windowEnd]);
  const nowX = timeToX(nowMs, windowStart);
  const nowInWindow = nowMs >= windowStart && nowMs < windowEnd;
  const tomorrowStart = useMemo(() => guideDayStart(initialNow, 1), [initialNow]);

  useEffect(() => {
    const initialX = Math.max(0, timeToX(initialNow, windowStart) - 120);
    const frame = requestAnimationFrame(() => horizontalRef.current?.scrollTo({ x: initialX, animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [initialNow, windowStart]);

  const jumpToNow = () => {
    const x = Math.max(0, timeToX(Date.now(), windowStart) - 120);
    horizontalRef.current?.scrollTo({ x, animated: true });
  };

  const syncVerticalScroll = (y: number) => channelRef.current?.scrollTo({ y, animated: false });

  const changeDay = (nextOffset: number) => {
    const targetTime = nextOffset === 0 ? windowStart : tomorrowStart;
    horizontalRef.current?.scrollTo({ x: Math.max(0, timeToX(targetTime, windowStart)), animated: true });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>TEEVEE</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Gids</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ga naar nu" onPress={jumpToNow} style={[styles.nowBadge, { backgroundColor: theme.colors.accent }]}>
          <Text style={[styles.nowText, { color: theme.colors.background }]}>Nu</Text>
        </Pressable>
      </View>

      <View style={styles.daySwitcher}>
        {[0, 1].map((offset) => {
          const active = dayOffset === offset;
          return (
            <Pressable key={offset} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => changeDay(offset)} style={[styles.dayButton, { backgroundColor: active ? theme.colors.accent : theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.dayButtonText, { color: active ? theme.colors.background : theme.colors.textSecondary }]}>
                {offset === 0 ? 'Vandaag' : formatDay(tomorrowStart)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.guideFrame, { borderColor: theme.colors.border }]}>
        <View style={[styles.channelColumn, { width: GUIDE_CHANNEL_WIDTH, backgroundColor: theme.colors.surface, borderRightColor: theme.colors.border }]}>
          <View style={[styles.channelAxisCorner, { height: GUIDE_TIME_AXIS_HEIGHT, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.axisCornerText, { color: theme.colors.textMuted }]}>ZENDER</Text>
          </View>
          <ScrollView ref={channelRef} showsVerticalScrollIndicator={false} scrollEnabled={false}>
            {runtimeFixture.channels.map((channel) => (
              <View key={channel.id} style={[styles.channelCell, { height: GUIDE_ROW_HEIGHT, borderBottomColor: theme.colors.border }]}>
                <Text numberOfLines={2} style={[styles.channelName, { color: theme.colors.text }]}>{channel.displayName}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <ScrollView testID="guide-time-scroll" ref={horizontalRef} horizontal bounces directionalLockEnabled decelerationRate="normal" showsHorizontalScrollIndicator={false} scrollEventThrottle={16} onScroll={(event) => {
          const visibleTime = windowStart + (event.nativeEvent.contentOffset.x / GUIDE_MINUTE_WIDTH) * 60_000;
          const visibleDay = visibleTime >= tomorrowStart ? 1 : 0;
          if (visibleDay !== dayOffset) setDayOffset(visibleDay);
        }}>
          <View style={{ width }}>
            <View style={[styles.timeAxis, { height: GUIDE_TIME_AXIS_HEIGHT, backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
              {ticks.map((tick) => {
                const left = timeToX(tick, windowStart);
                return (
                  <View key={tick} style={[styles.tick, { left, borderLeftColor: theme.colors.border }]}>
                    <Text style={[styles.tickLabel, { color: theme.colors.textMuted }]}>{formatTime(tick)}</Text>
                  </View>
                );
              })}
            </View>

            <ScrollView testID="guide-channel-scroll" bounces alwaysBounceVertical directionalLockEnabled decelerationRate="normal" showsVerticalScrollIndicator scrollEventThrottle={16} onScroll={(event) => syncVerticalScroll(event.nativeEvent.contentOffset.y)}>
              <View style={{ width, height: runtimeFixture.channels.length * GUIDE_ROW_HEIGHT }}>
                {runtimeFixture.channels.map((channel, rowIndex) => (
                  <View key={channel.id} style={[styles.programmeRow, { top: rowIndex * GUIDE_ROW_HEIGHT, height: GUIDE_ROW_HEIGHT, width, borderBottomColor: theme.colors.border }]}>
                    {programmesForRuntimeChannel(runtimeFixture, channel.id).map((programme) => {
                      const frame = programmeFrame(programme, windowStart);
                      const end = frame.left + frame.width;
                      if (end < 0 || frame.left > width) return null;
                      const startMs = Date.parse(programme.startAt);
                      const endMs = Date.parse(programme.endAt);
                      const isCurrent = nowMs >= startMs && nowMs < endMs;
                      const progress = isCurrent ? programmeProgress(programme, new Date(nowMs)) : 0;
                      const contentMode = programmeContentMode(frame.width);
                      return (
                        <Pressable
                          key={programme.id}
                          testID={`programme-${programme.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={`${programme.title}, ${formatTime(startMs)} tot ${formatTime(endMs)}`}
                          onPress={() => onSelectProgramme({ programme, channelName: channel.displayName })}
                          style={({ pressed }) => [styles.programme, contentMode === 'compact' ? styles.programmeCompact : null, { left: frame.left, width: frame.width, backgroundColor: isCurrent ? theme.colors.programmeCurrent : theme.colors.programme, opacity: pressed ? 0.65 : 1 }]}
                        >
                          {isCurrent && contentMode !== 'compact' ? <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}><View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.colors.currentTime }]} /></View> : null}
                          <Text numberOfLines={contentMode === 'comfortable' ? 2 : 1} style={[styles.programmeTitle, contentMode === 'compact' ? styles.programmeTitleCompact : null, { color: theme.colors.text }]}>{programme.title}</Text>
                          {contentMode !== 'compact' ? <Text numberOfLines={1} style={[styles.programmeTime, { color: theme.colors.textMuted }]}>{formatTime(startMs)}</Text> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
                {nowInWindow ? <View pointerEvents="none" style={[styles.currentTimeLine, { left: nowX, backgroundColor: theme.colors.currentTime, height: runtimeFixture.channels.length * GUIDE_ROW_HEIGHT }]} /> : null}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1.2 },
  nowBadge: { minWidth: 52, height: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nowText: { fontSize: 14, fontWeight: '700' },
  daySwitcher: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 12 },
  dayButton: { height: 32, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  dayButtonText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
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
  programmeCompact: { paddingHorizontal: 5, paddingVertical: 6, justifyContent: 'center' },
  programmeTitle: { fontSize: 12, lineHeight: 15, fontWeight: '600' },
  programmeTitleCompact: { fontSize: 10, lineHeight: 12 },
  programmeTime: { fontSize: 10, marginTop: 4 },
  progressTrack: { height: 2, borderRadius: 1, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%' },
  currentTimeLine: { position: 'absolute', top: 0, width: 2, zIndex: 4 },
});
