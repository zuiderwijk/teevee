import { useCallback, useEffect, useLayoutEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import type { DetailState } from './detailState';
import { detailDragOffset, shouldDismissDetail } from './detailSwipe';

export const MISSING_DESCRIPTION = 'Voor dit programma is in de huidige testdata nog geen beschrijving beschikbaar.';

type ProgrammeDetailProps = {
  state: DetailState;
  onClose: () => void;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('nl-NL', {
    hour: '2-digit', minute: '2-digit', timeZone: GUIDE_TIME_ZONE,
  });
}

export function ProgrammeDetail({ state, onClose }: ProgrammeDetailProps) {
  const theme = useTeeveeTheme();
  const selection = state.selection;
  const offsetY = useSharedValue(0);
  const originY = useSharedValue(0);
  const sheetHeight = useSharedValue(0);
  const dragging = useSharedValue(false);
  const cancelled = useSharedValue(false);
  const closing = useSharedValue(false);
  const ready = useSharedValue(false);

  useLayoutEffect(() => {
    if (!state.visible) return;
    // Reset before a new presentation, NOT while the old panel slides away.
    cancelAnimation(offsetY);
    offsetY.value = 0;
    originY.value = 0;
    dragging.value = false;
    cancelled.value = false;
    closing.value = false;
    ready.value = false;
  }, [state.visible, offsetY, originY, dragging, cancelled, closing, ready]);

  useEffect(() => () => cancelAnimation(offsetY), [offsetY]);

  const requestClose = useCallback(() => {
    if (closing.value) return;
    closing.value = true;
    cancelAnimation(offsetY);
    onClose();
  }, [closing, offsetY, onClose]);

  const handleShow = useCallback(() => { ready.value = true; }, [ready]);

  const pan = Gesture.Pan()
    .enabled(state.visible)
    .maxPointers(1)
    .activeOffsetY(10)
    .failOffsetX([-18, 18])
    .failOffsetY([-10, 100000])
    .shouldCancelWhenOutside(false)
    .onBegin(() => {
      dragging.value = false;
      cancelled.value = false;
    })
    .onTouchesDown((event) => {
      if (event.numberOfTouches > 1) cancelled.value = true;
    })
    .onStart(() => {
      if (!ready.value || closing.value || cancelled.value) return;
      cancelAnimation(offsetY);
      originY.value = offsetY.value;
      dragging.value = true;
    })
    .onUpdate((event) => {
      if (!dragging.value || closing.value) return;
      if (event.numberOfPointers > 1) cancelled.value = true;
      if (!cancelled.value) {
        offsetY.value = detailDragOffset(originY.value + event.translationY, sheetHeight.value);
      }
    })
    .onEnd((event, success) => {
      if (!success || !dragging.value || closing.value || cancelled.value || event.numberOfPointers > 1) return;
      const distance = detailDragOffset(originY.value + event.translationY, sheetHeight.value);
      offsetY.value = distance;
      if (shouldDismissDetail(distance, event.velocityY, sheetHeight.value)) {
        closing.value = true;
        // Retain the dragged position. The existing native slide does the exit;
        // do not spring to zero first or play a second custom exit animation.
        scheduleOnRN(onClose);
      }
    })
    .onFinalize(() => {
      if (dragging.value && !closing.value) {
        offsetY.value = withSpring(0, { overshootClamping: true, reduceMotion: ReduceMotion.System });
      }
      dragging.value = false;
    });

  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offsetY.value }] }));

  return (
    <Modal
      transparent
      visible={state.visible}
      animationType="slide"
      onShow={handleShow}
      onRequestClose={requestClose}
      testID="programme-detail-modal"
    >
      {/* Android Modal has its own native root. Keep gestures inside this root. */}
      <GestureHandlerRootView style={styles.modalContainer}>
        <Pressable
          testID="programme-detail-backdrop"
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
        />
        {/* The current content is not scrollable. If a description ScrollView
            is introduced, restrict the pan to the header or coordinate at top. */}
        <GestureDetector gesture={pan}>
          <Animated.View
            testID="programme-detail-sheet"
            collapsable={false}
            accessibilityViewIsModal
            onAccessibilityEscape={requestClose}
            onLayout={(event) => { sheetHeight.value = event.nativeEvent.layout.height; }}
            style={[styles.detailSheet, { backgroundColor: theme.colors.surfaceElevated }, dragStyle]}
          >
            {selection ? (
              <>
                <View accessible={false} style={styles.detailHandleRow}>
                  <View style={[styles.detailHandle, { backgroundColor: theme.colors.border }]} />
                </View>
                <Text style={[styles.detailMeta, { color: theme.colors.textMuted }]}>
                  {selection.channelName} · {formatTime(selection.programme.startAt)}–{formatTime(selection.programme.endAt)}
                </Text>
                <Text accessibilityRole="header" style={[styles.detailTitle, { color: theme.colors.text }]}>
                  {selection.programme.title}
                </Text>
                <Text style={[styles.detailDescription, { color: theme.colors.textSecondary }]}>
                  {selection.programme.description?.trim() || MISSING_DESCRIPTION}
                </Text>
                <Pressable
                  testID="programme-detail-close"
                  accessibilityRole="button"
                  accessibilityLabel="Programmadetails sluiten"
                  onPress={requestClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { backgroundColor: theme.colors.accent, opacity: pressed ? 0.65 : 1 },
                  ]}
                >
                  <Text style={[styles.closeButtonText, { color: theme.colors.background }]}>Sluiten</Text>
                </Pressable>
              </>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  detailSheet: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailHandleRow: { alignItems: 'center', marginBottom: 16 },
  detailHandle: { width: 38, height: 4, borderRadius: 2 },
  detailMeta: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  detailTitle: { fontSize: 26, lineHeight: 31, fontWeight: '700', letterSpacing: -0.7, marginBottom: 12 },
  detailDescription: { fontSize: 15, lineHeight: 22, marginBottom: 22 },
  closeButton: { alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 18, borderRadius: 22, justifyContent: 'center' },
  closeButtonText: { fontSize: 14, fontWeight: '700' },
});
