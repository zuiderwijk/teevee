import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  AccessibilityInfo,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { ChannelManagementRow } from '@/features/channels/ChannelManagementRow';
import { useChannelPersonalisationSettings } from '@/features/channels/ChannelPersonalisationProvider';
import {
  CHANNEL_MANAGEMENT_METRICS,
  channelManagementAutoScrollVelocity,
  channelManagementFocusAfterHide,
  channelManagementFocusAfterShow,
  channelManagementInsertionIndex,
  channelManagementInsertionLineOffset,
  channelManagementMotionProfile,
  channelManagementProvisionalRowOffset,
  channelManagementQueryActive,
  channelManagementRowMetrics,
  channelManagementSectionCount,
  channelManagementSlotTop,
  channelManagementZones,
  clampChannelManagementScrollOffset,
  type ChannelManagementFocusOutcome,
} from '@/features/channels/channelManagement';
import {
  channelManagementDropHaptic,
  channelManagementPickHaptic,
} from '@/features/channels/channelManagementHaptics';
import {
  clearChannelDragSessionIfCurrent,
  createChannelDragSession,
  planChannelDragTermination,
  updateChannelDragSessionTarget,
  type ChannelDragSession,
  type ChannelDragTerminationKind,
} from '@/features/channels/channelDragLifecycle';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

function ZoneHeader({
  title,
  count,
  rowRef,
}: {
  title: string;
  count: string;
  rowRef?: (node: View | null) => void;
}) {
  const theme = useTeeveeTheme();
  return (
    <View
      ref={rowRef}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${title}, ${count}`}
      style={styles.zoneHeader}
    >
      <Text
        accessible={false}
        style={[
          styles.zoneTitle,
          {
            color: theme.colors.text,
            fontFamily: TEEVEE_FONT_FAMILIES.semibold,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        accessible={false}
        style={[
          styles.zoneCount,
          {
            color: theme.colors.textMuted,
            fontFamily: TEEVEE_FONT_FAMILIES.regular,
          },
        ]}
      >
        {count}
      </Text>
    </View>
  );
}

export default function ChannelsScreen() {
  const router = useRouter();
  const theme = useTeeveeTheme();
  const reduceMotion = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const rowMetrics = useMemo(
    () => channelManagementRowMetrics(fontScale),
    [fontScale],
  );
  const motion = channelManagementMotionProfile(reduceMotion);
  const {
    catalog,
    selectedChannelIds,
    canHideChannel,
    setChannelVisible,
    moveChannel,
    moveChannelToIndex,
  } = useChannelPersonalisationSettings();

  const [query, setQuery] = useState('');
  const [dragState, setDragState] = useState<ChannelDragSession | null>(null);
  const queryActive = channelManagementQueryActive(query);

  const selectedIdsRef = useRef<readonly string[]>(selectedChannelIds);
  const queryActiveRef = useRef(queryActive);
  const dragStateRef = useRef<ChannelDragSession | null>(null);
  const dragSessionTokenRef = useRef(0);

  useEffect(() => {
    selectedIdsRef.current = selectedChannelIds;
  }, [selectedChannelIds]);

  useEffect(() => {
    queryActiveRef.current = queryActive;
  }, [queryActive]);

  const rowHeightsRef = useRef<Record<string, number>>({});
  const rowRefs = useRef(new Map<string, View>());
  const visibleHeadingRef = useRef<View | null>(null);
  const hiddenHeadingRef = useRef<View | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const scrollViewportRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const contentHeightRef = useRef(0);
  const viewportWindowYRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const visibleZoneContentYRef = useRef(0);
  const visibleListContentYRef = useRef(0);
  const dragPointerAbsoluteYRef = useRef(0);
  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollLastTimestampRef = useRef(0);

  const overlayTop = useSharedValue(0);
  const overlayStyle = useAnimatedStyle(() => ({
    top: overlayTop.get(),
    transform: [{ scale: motion.pickedScale }],
  }));

  const byId = useMemo(
    () => new Map(catalog.map((channel) => [channel.id, channel])),
    [catalog],
  );

  const baseZones = useMemo(
    () => channelManagementZones(catalog, selectedChannelIds, query),
    [catalog, query, selectedChannelIds],
  );
  const allZones = useMemo(
    () => channelManagementZones(catalog, selectedChannelIds),
    [catalog, selectedChannelIds],
  );

  // Keep the native gesture-owner row in canonical render order for the
  // entire active drag. Neighbours move visually via translateY instead.
  const visibleRows = queryActive ? baseZones.visible : allZones.visible;
  const hiddenRows = baseZones.hidden;

  const visibleCount = channelManagementSectionCount(
    baseZones.visible.length,
    allZones.visible.length,
    queryActive,
  );
  const hiddenCount = channelManagementSectionCount(
    baseZones.hidden.length,
    allZones.hidden.length,
    queryActive,
  );
  const noSearchResults =
    queryActive && baseZones.visible.length === 0 && baseZones.hidden.length === 0;

  const registerRowRef = useCallback((channelId: string, node: View | null) => {
    if (node) rowRefs.current.set(channelId, node);
    else rowRefs.current.delete(channelId);
  }, []);

  const focusOutcome = useCallback((outcome: ChannelManagementFocusOutcome) => {
    requestAnimationFrame(() => {
      let target: View | null | undefined;
      if (outcome.type === 'channel') {
        target = rowRefs.current.get(outcome.channelId);
      } else if (outcome.type === 'hidden-heading') {
        target = hiddenHeadingRef.current ?? visibleHeadingRef.current;
      } else {
        target = visibleHeadingRef.current;
      }
      if (!target) return;
      const handle = findNodeHandle(target);
      if (handle != null) AccessibilityInfo.setAccessibilityFocus(handle);
    });
  }, []);

  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const toggleVisibility = useCallback(
    (channelId: string, makeVisible: boolean) => {
      const channel = byId.get(channelId);
      if (!channel) return;

      if (makeVisible) {
        const workflowHiddenIds = hiddenRows.map(({ id }) => id);
        const outcome = channelManagementFocusAfterShow(
          workflowHiddenIds,
          channelId,
        );
        setChannelVisible(channelId, true);
        announce(`${channel.displayName} toegevoegd aan Mijn zenders, achteraan`);
        focusOutcome(outcome);
        return;
      }

      if (!canHideChannel(channelId)) {
        announce('Minimaal één zender moet zichtbaar blijven');
        return;
      }

      const workflowVisibleIds = visibleRows.map(({ id }) => id);
      const outcome = channelManagementFocusAfterHide(
        workflowVisibleIds,
        channelId,
      );
      setChannelVisible(channelId, false);
      announce(`${channel.displayName} verborgen`);
      focusOutcome(outcome);
    },
    [
      announce,
      byId,
      canHideChannel,
      focusOutcome,
      hiddenRows,
      setChannelVisible,
      visibleRows,
    ],
  );

  const moveOneStep = useCallback(
    (channelId: string, delta: -1 | 1) => {
      if (queryActiveRef.current) return;
      const current = selectedIdsRef.current;
      const from = current.indexOf(channelId);
      if (from < 0) return;
      const to = Math.max(0, Math.min(current.length - 1, from + delta));
      if (to === from) return;

      moveChannel(channelId, delta);
      const channel = byId.get(channelId);
      if (channel) {
        announce(
          `${channel.displayName}, positie ${to + 1} van ${current.length}`,
        );
      }
      focusOutcome({ type: 'channel', channelId });
    },
    [announce, byId, focusOutcome, moveChannel],
  );

  const measureScrollViewport = useCallback(() => {
    scrollViewportRef.current?.measureInWindow(
      (_x: number, y: number, _width: number, height: number) => {
        viewportWindowYRef.current = y;
        viewportHeightRef.current = height;
      },
    );
  }, []);

  const contentYForAbsoluteY = useCallback((absoluteY: number) => {
    return (
      scrollOffsetRef.current +
      (absoluteY - viewportWindowYRef.current)
    );
  }, []);

  const updateDragPointer = useCallback(
    (channelId: string, absoluteY: number) => {
      const current = dragStateRef.current;
      if (!current || current.channelId !== channelId) return;

      dragPointerAbsoluteYRef.current = absoluteY;
      const contentY = contentYForAbsoluteY(absoluteY);
      const height =
        rowHeightsRef.current[channelId] ?? rowMetrics.minHeight;
      overlayTop.set(contentY - height / 2);

      const targetIndex = channelManagementInsertionIndex(
        selectedIdsRef.current,
        channelId,
        contentY - visibleListContentYRef.current,
        rowHeightsRef.current,
        rowMetrics.minHeight,
      );
      if (targetIndex === current.targetIndex) return;

      const next = updateChannelDragSessionTarget(current, targetIndex);
      dragStateRef.current = next;
      setDragState(next);
    },
    [contentYForAbsoluteY, overlayTop, rowMetrics.minHeight],
  );

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current != null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    autoScrollLastTimestampRef.current = 0;
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();

    const tick = (timestamp: number) => {
      const current = dragStateRef.current;
      if (!current) {
        autoScrollFrameRef.current = null;
        return;
      }

      const last = autoScrollLastTimestampRef.current || timestamp;
      autoScrollLastTimestampRef.current = timestamp;
      const deltaSeconds = Math.min(0.05, Math.max(0, timestamp - last) / 1000);
      const pointerYWithinViewport =
        dragPointerAbsoluteYRef.current - viewportWindowYRef.current;
      const velocity = channelManagementAutoScrollVelocity(
        pointerYWithinViewport,
        viewportHeightRef.current,
      );
      const maxOffset = Math.max(
        0,
        contentHeightRef.current - viewportHeightRef.current,
      );

      if (velocity !== 0 && deltaSeconds > 0) {
        const nextOffset = clampChannelManagementScrollOffset(
          scrollOffsetRef.current + velocity * deltaSeconds,
          maxOffset,
        );
        if (Math.abs(nextOffset - scrollOffsetRef.current) > 0.1) {
          scrollOffsetRef.current = nextOffset;
          scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
          updateDragPointer(
            current.channelId,
            dragPointerAbsoluteYRef.current,
          );
        }
      }

      autoScrollFrameRef.current = requestAnimationFrame(tick);
    };

    autoScrollFrameRef.current = requestAnimationFrame(tick);
  }, [stopAutoScroll, updateDragPointer]);

  const clearDragSession = useCallback(
    (sessionToken: number) => {
      stopAutoScroll();
      const current = dragStateRef.current;
      const next = clearChannelDragSessionIfCurrent(current, sessionToken);
      if (next === current) return false;
      dragStateRef.current = next;
      setDragState(next);
      return true;
    },
    [stopAutoScroll],
  );

  const settleOverlay = useCallback(
    (
      sessionToken: number,
      channelId: string,
      targetIndex: number,
      order: readonly string[],
    ) => {
      const targetTop =
        visibleListContentYRef.current +
        channelManagementSlotTop(
          order,
          channelId,
          targetIndex,
          rowHeightsRef.current,
          rowMetrics.minHeight,
        );

      if (motion.settleImmediately) {
        overlayTop.set(targetTop);
        return;
      }

      // Best-effort visual spring only. Gesture/session teardown is owned
      // synchronously by terminateDragSession below and never waits on this.
      overlayTop.set(
        withSpring(
          targetTop,
          CHANNEL_MANAGEMENT_METRICS.dropSpring,
          () => {
            scheduleOnRN(clearDragSession, sessionToken);
          },
        ),
      );
    },
    [
      clearDragSession,
      motion.settleImmediately,
      overlayTop,
      rowMetrics.minHeight,
    ],
  );

  const beginDrag = useCallback(
    (channelId: string, absoluteY: number) => {
      if (queryActiveRef.current || dragStateRef.current) return;
      const from = selectedIdsRef.current.indexOf(channelId);
      if (from < 0) return;

      const height =
        rowHeightsRef.current[channelId] ?? rowMetrics.minHeight;
      const next = createChannelDragSession({
        token: (dragSessionTokenRef.current += 1),
        channelId,
        originalIndex: from,
        height,
      });
      dragStateRef.current = next;
      setDragState(next);
      dragPointerAbsoluteYRef.current = absoluteY;

      const contentY = contentYForAbsoluteY(absoluteY);
      overlayTop.set(contentY - height / 2);

      void channelManagementPickHaptic();
      startAutoScroll();
    },
    [
      contentYForAbsoluteY,
      overlayTop,
      rowMetrics.minHeight,
      startAutoScroll,
    ],
  );

  const terminateDragSession = useCallback(
    (channelId: string, kind: ChannelDragTerminationKind) => {
      const current = dragStateRef.current;
      if (!current || current.channelId !== channelId) return false;

      const order = [...selectedIdsRef.current];
      const plan = planChannelDragTermination(current, order, kind);

      // Terminal ownership is synchronous and independent of Reanimated.
      // This immediately stops edge auto-scroll, removes provisional state and
      // re-enables the parent ScrollView on the next React commit.
      stopAutoScroll();

      if (plan.persistToIndex !== null) {
        moveChannelToIndex(plan.channelId, plan.persistToIndex);
      }
      if (plan.emitDropHaptic) {
        void channelManagementDropHaptic();
      }

      settleOverlay(
        plan.sessionToken,
        plan.channelId,
        plan.settleIndex,
        order,
      );
      clearDragSession(plan.sessionToken);
      return true;
    },
    [
      clearDragSession,
      moveChannelToIndex,
      settleOverlay,
      stopAutoScroll,
    ],
  );

  const finalizeDrag = useCallback(
    (channelId: string, absoluteY: number, success: boolean) => {
      if (success) {
        updateDragPointer(channelId, absoluteY);
        terminateDragSession(channelId, 'drop');
        return;
      }
      terminateDragSession(channelId, 'cancel');
    },
    [terminateDragSession, updateDragPointer],
  );

  const handleVisibleZoneLayout = useCallback(
    (event: { nativeEvent: { layout: { y: number } } }) => {
      visibleZoneContentYRef.current = event.nativeEvent.layout.y;
    },
    [],
  );

  const handleVisibleListLayout = useCallback(
    (event: { nativeEvent: { layout: { y: number } } }) => {
      visibleListContentYRef.current =
        visibleZoneContentYRef.current + event.nativeEvent.layout.y;
    },
    [],
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const draggedChannel = dragState
    ? byId.get(dragState.channelId) ?? null
    : null;
  const draggedHeight = dragState?.height ?? rowMetrics.minHeight;
  const zoneLayoutTransition = reduceMotion
    ? undefined
    : LinearTransition.duration(
        CHANNEL_MANAGEMENT_METRICS.zoneTransitionMs,
      ).easing(Easing.out(Easing.cubic));

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View
        ref={scrollViewportRef}
        collapsable={false}
        onLayout={measureScrollViewport}
        style={styles.scrollViewport}
      >
      <ScrollView
        ref={scrollRef}
        testID="channels-scroll"
        scrollEnabled={dragState === null}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={(_width, height) => {
          contentHeightRef.current = height;
          measureScrollViewport();
        }}
        onScroll={(event) => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.screenInset}>
          <View style={styles.navigationRow}>
            <Pressable
              testID="channels-back"
              accessibilityRole="button"
              accessibilityLabel="Terug"
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                { opacity: pressed ? 0.55 : 1 },
              ]}
            >
              <Text
                accessible={false}
                allowFontScaling={false}
                style={[styles.backGlyph, { color: theme.colors.text }]}
              >
                ‹
              </Text>
            </Pressable>
            <View pointerEvents="none" style={styles.navigationTitleLane}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.navigationTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: TEEVEE_FONT_FAMILIES.semibold,
                  },
                ]}
              >
                Mijn zenders
              </Text>
            </View>
            <View style={styles.navigationSpacer} />
          </View>

          <View
            style={[
              styles.searchField,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <TextInput
              testID="channels-local-search"
              accessibilityLabel="Zoek een zender"
              value={query}
              onChangeText={setQuery}
              placeholder="Zoek een zender"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              style={[
                styles.searchInput,
                {
                  color: theme.colors.text,
                  fontFamily: TEEVEE_FONT_FAMILIES.regular,
                },
              ]}
            />
            {queryActive ? (
              <Pressable
                testID="channels-clear-search"
                accessibilityRole="button"
                accessibilityLabel="Wis zoeken"
                onPress={() => setQuery('')}
                style={styles.searchClear}
              >
                <Text
                  accessible={false}
                  allowFontScaling={false}
                  style={[styles.searchClearGlyph, { color: theme.colors.textMuted }]}
                >
                  ×
                </Text>
              </Pressable>
            ) : null}
          </View>

          {noSearchResults ? (
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
              Geen zenders gevonden
            </Text>
          ) : (
            <>
              <Animated.View
                {...(zoneLayoutTransition ? { layout: zoneLayoutTransition } : {})}
                onLayout={handleVisibleZoneLayout}
                style={styles.visibleZone}
              >
                <ZoneHeader
                  title="Mijn zenders"
                  count={visibleCount}
                  rowRef={(node) => {
                    visibleHeadingRef.current = node;
                  }}
                />
                <View
                  testID="channels-visible-zone"
                  onLayout={handleVisibleListLayout}
                >
                  {visibleRows.map((channel, displayIndex) => {
                    const actualIndex = selectedChannelIds.indexOf(channel.id);
                    const isDragged = dragState?.channelId === channel.id;
                    const provisionalOffsetY = dragState
                      ? channelManagementProvisionalRowOffset(
                          selectedChannelIds,
                          dragState.channelId,
                          dragState.targetIndex,
                          channel.id,
                          dragState.height,
                        )
                      : 0;
                    const insertionLineOffsetY =
                      isDragged && dragState
                        ? channelManagementInsertionLineOffset(
                            selectedChannelIds,
                            dragState.channelId,
                            dragState.targetIndex,
                            rowHeightsRef.current,
                            rowMetrics.minHeight,
                          )
                        : 0;

                    return (
                      <ChannelManagementRow
                        key={channel.id}
                        channel={channel}
                        visible
                        index={actualIndex >= 0 ? actualIndex : displayIndex}
                        total={selectedChannelIds.length}
                        minHeight={rowMetrics.minHeight}
                        nameLines={rowMetrics.nameLines}
                        canHide={canHideChannel(channel.id)}
                        reorderEnabled={!queryActive}
                        reduceMotion={reduceMotion}
                        draggingPlaceholder={isDragged}
                        provisionalOffsetY={provisionalOffsetY}
                        insertionLineOffsetY={insertionLineOffsetY}
                        showSeparator={displayIndex < visibleRows.length - 1}
                        rowRef={(node) => registerRowRef(channel.id, node)}
                        onMeasure={(id, height) => {
                          rowHeightsRef.current[id] = height;
                        }}
                        onToggleVisibility={toggleVisibility}
                        onMoveOneStep={moveOneStep}
                        onDragStart={beginDrag}
                        onDragMove={updateDragPointer}
                        onDragFinalize={finalizeDrag}
                      />
                    );
                  })}
                </View>

                {selectedChannelIds.length === 1 ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.minimumHelper,
                      {
                        color: theme.colors.textMuted,
                        fontFamily: TEEVEE_FONT_FAMILIES.regular,
                      },
                    ]}
                  >
                    Minimaal één zender blijft zichtbaar.
                  </Text>
                ) : null}
              </Animated.View>

              {allZones.hidden.length > 0 ? (
                <Animated.View
                  testID="channels-hidden-zone"
                  {...(!reduceMotion
                    ? {
                        entering: FadeIn.duration(
                          CHANNEL_MANAGEMENT_METRICS.zoneTransitionMs,
                        ),
                        exiting: FadeOut.duration(
                          CHANNEL_MANAGEMENT_METRICS.zoneTransitionMs,
                        ),
                      }
                    : {})}
                  {...(zoneLayoutTransition ? { layout: zoneLayoutTransition } : {})}
                  style={styles.hiddenZone}
                >
                  <ZoneHeader
                    title="Verborgen zenders"
                    count={hiddenCount}
                    rowRef={(node) => {
                      hiddenHeadingRef.current = node;
                    }}
                  />
                  {hiddenRows.map((channel, index) => (
                    <ChannelManagementRow
                      key={channel.id}
                      channel={channel}
                      visible={false}
                      index={index}
                      total={hiddenRows.length}
                      minHeight={rowMetrics.minHeight}
                      nameLines={rowMetrics.nameLines}
                      canHide={false}
                      reorderEnabled={false}
                      reduceMotion={reduceMotion}
                      showSeparator={index < hiddenRows.length - 1}
                      rowRef={(node) => registerRowRef(channel.id, node)}
                      onMeasure={(id, height) => {
                        rowHeightsRef.current[id] = height;
                      }}
                      onToggleVisibility={toggleVisibility}
                      onMoveOneStep={moveOneStep}
                    />
                  ))}
                </Animated.View>
              ) : null}
            </>
          )}
        </View>

        {draggedChannel ? (
          <Animated.View
            testID="channels-drag-overlay"
            pointerEvents="none"
            style={[
              styles.dragOverlay,
              {
                height: draggedHeight,
              },
              overlayStyle,
            ]}
          >
            <ChannelManagementRow
              channel={draggedChannel}
              visible
              index={dragState?.targetIndex ?? 0}
              total={selectedChannelIds.length}
              minHeight={draggedHeight}
              nameLines={rowMetrics.nameLines}
              canHide
              reorderEnabled
              reduceMotion={reduceMotion}
              showSeparator={false}
              overlay
              onToggleVisibility={() => undefined}
              onMoveOneStep={() => undefined}
            />
          </Animated.View>
        ) : null}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewport: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    position: 'relative',
  },
  screenInset: {
    marginHorizontal: CHANNEL_MANAGEMENT_METRICS.screenInsetX,
  },
  navigationRow: {
    height: CHANNEL_MANAGEMENT_METRICS.navigationHeight,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    width: CHANNEL_MANAGEMENT_METRICS.navigationHeight,
    height: CHANNEL_MANAGEMENT_METRICS.navigationHeight,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backGlyph: {
    fontSize: 34,
    lineHeight: 38,
  },
  navigationTitleLane: {
    position: 'absolute',
    left: CHANNEL_MANAGEMENT_METRICS.navigationHeight,
    right: CHANNEL_MANAGEMENT_METRICS.navigationHeight,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationTitle: {
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
  },
  navigationSpacer: {
    marginLeft: 'auto',
    width: CHANNEL_MANAGEMENT_METRICS.navigationHeight,
    height: CHANNEL_MANAGEMENT_METRICS.navigationHeight,
  },
  searchField: {
    minHeight: CHANNEL_MANAGEMENT_METRICS.searchMinHeight,
    borderRadius: CHANNEL_MANAGEMENT_METRICS.searchRadius,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: CHANNEL_MANAGEMENT_METRICS.searchMinHeight,
    paddingHorizontal: CHANNEL_MANAGEMENT_METRICS.searchPaddingX,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 20,
  },
  searchClear: {
    width: CHANNEL_MANAGEMENT_METRICS.searchMinHeight,
    minHeight: CHANNEL_MANAGEMENT_METRICS.searchMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearGlyph: {
    fontSize: 24,
    lineHeight: 28,
  },
  visibleZone: {
    marginTop: 20,
  },
  hiddenZone: {
    marginTop: CHANNEL_MANAGEMENT_METRICS.sectionGap,
  },
  zoneHeader: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: CHANNEL_MANAGEMENT_METRICS.sectionHeaderGap,
  },
  zoneTitle: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  zoneCount: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
  minimumHelper: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  noResults: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  dragOverlay: {
    position: 'absolute',
    left: CHANNEL_MANAGEMENT_METRICS.screenInsetX,
    right: CHANNEL_MANAGEMENT_METRICS.screenInsetX,
    zIndex: 100,
  },
});
