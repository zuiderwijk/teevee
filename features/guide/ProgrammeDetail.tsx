import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import {
  EMPTY_PROGRAMME_PERSONAL_STATE,
  programmeSnapshot,
  withProgrammeReminder,
  withProgrammeSaved,
  type ProgrammePersonalState,
  type ProgrammeReminderRecord,
} from '@/features/guide/programmePersonalState';
import {
  cancelProgrammeReminder,
  reconcileProgrammeReminder,
  scheduleProgrammeReminder,
  type ProgrammeReminderScheduleResult,
} from '@/services/notifications/programmeReminder';
import { removeProgrammeReminderIfMatches } from '@/services/storage/programmePersonalStateMutation';
import {
  readProgrammePersonalState,
  writeProgrammePersonalState,
} from '@/services/storage/programmePersonalStateStorage';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import type { TeeveeTheme } from '@/theme/tokens';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { ChannelIdentity } from './ChannelIdentity';
import type { DetailState } from './detailState';
import {
  nextProgrammeDetailStickyVisible,
  programmeDetailBodyBottomPadding,
  programmeDetailStickyBottomPadding,
  shouldPreStackProgrammeDetailActions,
} from './programmeDetailLayout';
import { detailDragOffset, shouldDismissDetail } from './detailSwipe';
import {
  programmeDetailTemporalState,
  useProgrammeDetailNow,
} from './useProgrammeDetailClock';

type ProgrammeDetailProps = {
  state: DetailState;
  onClose: () => void;
};

type DetailActionButtonProps = {
  label: string;
  active: boolean;
  primary: boolean;
  busy?: boolean;
  stacked: boolean;
  colors: TeeveeTheme['colors'];
  testID: string;
  onPress: () => void;
  onLabelWrap?: () => void;
};

const broadcastDateFormatter = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: GUIDE_TIME_ZONE,
});

const broadcastTimeFormatter = new Intl.DateTimeFormat('nl-NL', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: GUIDE_TIME_ZONE,
});

function formatBroadcastContext(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return `${broadcastDateFormatter.format(start)} · ${broadcastTimeFormatter.format(start)}–${broadcastTimeFormatter.format(end)}`;
}

function reminderFailureCopy(result: ProgrammeReminderScheduleResult): string | null {
  if (result.ok || result.reason === 'started') return null;
  if (result.reason === 'permission') {
    return 'Sta meldingen toe om programmaherinneringen te gebruiken.';
  }
  if (result.reason === 'exact-alarm') {
    return 'Sta Alarmen en herinneringen toe in Android-instellingen om deze herinnering exact te plannen.';
  }
  if (result.reason === 'unsupported') {
    return 'Programmaherinneringen zijn op dit apparaat niet beschikbaar.';
  }
  return 'De herinnering kon niet worden ingesteld. Probeer het opnieuw.';
}

function DetailActionButton({
  label,
  active,
  primary,
  busy = false,
  stacked,
  colors,
  testID,
  onPress,
  onLabelWrap,
}: DetailActionButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: active, busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        stacked ? styles.actionButtonStacked : styles.actionButtonInline,
        primary
          ? { backgroundColor: colors.currentTime, borderColor: colors.currentTime }
          : {
              backgroundColor: active ? colors.programmeCurrent : colors.surface,
              borderColor: active ? colors.currentTime : colors.border,
            },
        { opacity: busy ? 0.55 : pressed ? 0.68 : 1 },
      ]}
    >
      <Text
        onTextLayout={(event) => {
          if (event.nativeEvent.lines.length > 1) onLabelWrap?.();
        }}
        style={[
          styles.actionLabel,
          {
            color: primary ? colors.background : colors.text,
            fontFamily: active ? TEEVEE_FONT_FAMILIES.semibold : TEEVEE_FONT_FAMILIES.medium,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ProgrammeDetail({ state, onClose }: ProgrammeDetailProps) {
  const theme = useTeeveeTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth, fontScale = 1 } = useWindowDimensions();
  const selection = state.selection;
  const programme = selection?.programme ?? null;
  const channel = selection?.channel ?? null;
  const programmeId = programme?.id ?? null;
  const availableContentWidth = Math.max(0, windowWidth - 40);

  const offsetY = useSharedValue(0);
  const originY = useSharedValue(0);
  const sheetHeight = useSharedValue(0);
  const dragging = useSharedValue(false);
  const cancelled = useSharedValue(false);
  const closing = useSharedValue(false);
  const ready = useSharedValue(false);

  const [personalState, setPersonalState] = useState<ProgrammePersonalState>(
    EMPTY_PROGRAMME_PERSONAL_STATE,
  );
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderResumeRevision, setReminderResumeRevision] = useState(0);
  const [reminderVerification, setReminderVerification] = useState<{
    notificationId: string;
    active: boolean;
    checking: boolean;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [stackedActions, setStackedActions] = useState(() =>
    shouldPreStackProgrammeDetailActions(availableContentWidth, fontScale),
  );
  const [stickyVisible, setStickyVisible] = useState(false);
  const [stickyEligible, setStickyEligible] = useState(false);
  const [stickyBarHeight, setStickyBarHeight] = useState(0);

  const actionLayoutRef = useRef<{ y: number; height: number } | null>(null);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const stickyVisibleRef = useRef(false);
  const activeProgrammeIdRef = useRef<string | null>(null);
  const reminderBusyRef = useRef(false);

  useLayoutEffect(() => {
    if (!state.visible) return;
    cancelAnimation(offsetY);
    offsetY.value = 0;
    originY.value = 0;
    dragging.value = false;
    cancelled.value = false;
    closing.value = false;
    ready.value = false;
  }, [state.visible, offsetY, originY, dragging, cancelled, closing, ready]);

  useEffect(() => () => cancelAnimation(offsetY), [offsetY]);

  useEffect(() => {
    activeProgrammeIdRef.current = state.visible ? programmeId : null;
    actionLayoutRef.current = null;
    viewportHeightRef.current = 0;
    contentHeightRef.current = 0;
    scrollYRef.current = 0;
    stickyVisibleRef.current = false;
    setStickyVisible(false);
    setStickyEligible(false);
    setStickyBarHeight(0);
    setActionMessage(null);
    setReminderVerification(null);
    reminderBusyRef.current = false;
    setReminderBusy(false);
    setStackedActions(
      shouldPreStackProgrammeDetailActions(availableContentWidth, fontScale),
    );

    if (!state.visible || !programme) return;
    setPersonalState(readProgrammePersonalState());
  }, [
    availableContentWidth,
    fontScale,
    programme,
    programmeId,
    state.visible,
  ]);

  useEffect(() => {
    if (!state.visible) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setReminderResumeRevision((current) => current + 1);
      }
    });
    return () => subscription.remove();
  }, [state.visible]);

  useEffect(() => {
    if (!state.visible || !programme) return;

    const loaded = readProgrammePersonalState();
    setPersonalState(loaded);
    const reminder = loaded.reminders[programme.id];
    if (!reminder) {
      setReminderVerification(null);
      return;
    }

    setReminderVerification({
      notificationId: reminder.notificationId,
      active: false,
      checking: true,
    });

    let cancelledEffect = false;
    void reconcileProgrammeReminder(reminder, programme).then((result) => {
      if (cancelledEffect) return;
      const current = readProgrammePersonalState();
      if (current.reminders[programme.id]?.notificationId !== reminder.notificationId) {
        if (activeProgrammeIdRef.current === programme.id) setPersonalState(current);
        return;
      }

      if (result.status === 'verified-invalid') {
        const removal = removeProgrammeReminderIfMatches(
          programme,
          reminder.notificationId,
        );
        if (activeProgrammeIdRef.current === programme.id) {
          setReminderVerification(null);
          setPersonalState(removal.state);
        }
        return;
      }

      if (activeProgrammeIdRef.current === programme.id) {
        setPersonalState(current);
        setReminderVerification({
          notificationId: reminder.notificationId,
          active:
            result.status === 'verified-valid' ||
            (result.status === 'indeterminate' && result.presentActive),
          checking: false,
        });
        if (result.status === 'indeterminate' && !result.presentActive) {
          setActionMessage(
            result.reason === 'exact-alarm-capability-unknown'
              ? 'De Android-toegang voor exacte herinneringen kon niet worden gecontroleerd. Probeer het opnieuw.'
              : 'De eerdere herinnering kon niet veilig worden gecontroleerd. Probeer het opnieuw.',
          );
        }
      }
    });

    return () => {
      cancelledEffect = true;
    };
  }, [programme, reminderResumeRevision, state.visible]);

  const requestClose = useCallback(() => {
    if (closing.value) return;
    closing.value = true;
    cancelAnimation(offsetY);
    onClose();
  }, [closing, offsetY, onClose]);

  const handleShow = useCallback(() => {
    ready.value = true;
  }, [ready]);

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
      if (
        !success ||
        !dragging.value ||
        closing.value ||
        cancelled.value ||
        event.numberOfPointers > 1
      ) {
        return;
      }
      const distance = detailDragOffset(
        originY.value + event.translationY,
        sheetHeight.value,
      );
      offsetY.value = distance;
      if (shouldDismissDetail(distance, event.velocityY, sheetHeight.value)) {
        closing.value = true;
        scheduleOnRN(onClose);
      }
    })
    .onFinalize(() => {
      if (dragging.value && !closing.value) {
        offsetY.value = withSpring(0, {
          overshootClamping: true,
          reduceMotion: ReduceMotion.System,
        });
      }
      dragging.value = false;
    });

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.value }],
  }));

  const recomputeSticky = useCallback((nextScrollY = scrollYRef.current) => {
    const viewportHeight = viewportHeightRef.current;
    const contentHeight = contentHeightRef.current;
    const scrollable = viewportHeight > 0 && contentHeight > viewportHeight + 1;
    setStickyEligible((current) => (current === scrollable ? current : scrollable));

    const actionLayout = actionLayoutRef.current;
    if (!actionLayout) {
      stickyVisibleRef.current = false;
      setStickyVisible(false);
      return;
    }

    const actionBottomViewportY =
      actionLayout.y + actionLayout.height - Math.max(0, nextScrollY);
    const nextVisible = nextProgrammeDetailStickyVisible({
      currentlyVisible: stickyVisibleRef.current,
      scrollable,
      actionBottomViewportY,
    });
    if (nextVisible !== stickyVisibleRef.current) {
      stickyVisibleRef.current = nextVisible;
      setStickyVisible(nextVisible);
    }
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextY = event.nativeEvent.contentOffset.y;
      scrollYRef.current = nextY;
      recomputeSticky(nextY);
    },
    [recomputeSticky],
  );

  const handleScrollLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeightRef.current = event.nativeEvent.layout.height;
      recomputeSticky();
    },
    [recomputeSticky],
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeightRef.current = height;
      recomputeSticky();
    },
    [recomputeSticky],
  );

  const handleActionLayout = useCallback(
    (event: LayoutChangeEvent) => {
      actionLayoutRef.current = {
        y: event.nativeEvent.layout.y,
        height: event.nativeEvent.layout.height,
      };
      recomputeSticky();
    },
    [recomputeSticky],
  );

  const promoteActionStack = useCallback(() => {
    setStackedActions(true);
  }, []);

  const toggleSaved = useCallback(() => {
    if (!programme) return;
    const current = readProgrammePersonalState();
    const next = withProgrammeSaved(current, programme, !Boolean(current.saved[programme.id]));
    if (!writeProgrammePersonalState(next)) {
      setActionMessage('Het programma kon niet worden bewaard. Probeer het opnieuw.');
      return;
    }
    setPersonalState(next);
    setActionMessage(null);
  }, [programme]);

  const toggleReminder = useCallback(async () => {
    if (!programme || !channel || reminderBusyRef.current) return;
    reminderBusyRef.current = true;
    setReminderBusy(true);
    setActionMessage(null);

    try {
      const current = readProgrammePersonalState();
      const existing = current.reminders[programme.id];

      if (existing) {
        const wasPresentedActive =
          reminderVerification?.notificationId === existing.notificationId &&
          reminderVerification.active;
        const cancelledReminder = await cancelProgrammeReminder(existing.notificationId);
        if (!cancelledReminder) {
          if (activeProgrammeIdRef.current === programme.id) {
            setActionMessage('De herinnering kon niet worden uitgezet. Probeer het opnieuw.');
          }
          return;
        }

        const removal = removeProgrammeReminderIfMatches(
          programme,
          existing.notificationId,
        );
        if (activeProgrammeIdRef.current === programme.id) {
          setPersonalState(removal.state);
          if (removal.status === 'removed') {
            setReminderVerification(null);
          } else if (removal.status === 'persist-failed') {
            setReminderVerification({
              notificationId: existing.notificationId,
              active: false,
              checking: false,
            });
            setActionMessage(
              'De herinnering is uitgezet, maar de lokale status kon niet worden opgeslagen.',
            );
          }
        }
        if (removal.status !== 'removed' || wasPresentedActive) return;
      }

      const result = await scheduleProgrammeReminder(programme, channel);
      if (!result.ok) {
        if (activeProgrammeIdRef.current === programme.id) {
          setActionMessage(reminderFailureCopy(result));
        }
        return;
      }

      const reminder: ProgrammeReminderRecord = {
        ...programmeSnapshot(programme),
        notificationId: result.notificationId,
        fireAtMs: result.fireAtMs,
        programmeStartAt: programme.startAt,
      };
      const fresh = readProgrammePersonalState();
      const next = withProgrammeReminder(fresh, programme, reminder);
      if (!writeProgrammePersonalState(next)) {
        await cancelProgrammeReminder(result.notificationId);
        if (activeProgrammeIdRef.current === programme.id) {
          setActionMessage('De herinnering kon niet worden opgeslagen. Probeer het opnieuw.');
        }
        return;
      }

      if (activeProgrammeIdRef.current === programme.id) {
        setPersonalState(next);
        setReminderVerification({
          notificationId: result.notificationId,
          active: true,
          checking: false,
        });
      }
    } finally {
      reminderBusyRef.current = false;
      if (activeProgrammeIdRef.current === programme.id) {
        setReminderBusy(false);
      }
    }
  }, [channel, programme, reminderVerification]);

  const nowMs = useProgrammeDetailNow(
    programme?.startAt ?? null,
    programme?.endAt ?? null,
    state.visible,
  );
  const temporalState = programme
    ? programmeDetailTemporalState(programme.startAt, programme.endAt, nowMs)
    : { reminderAvailable: false, current: false, nextBoundaryMs: null };
  const reminderAvailable = temporalState.reminderAvailable;
  const saved = Boolean(programmeId && personalState.saved[programmeId]);
  const persistedReminder = programmeId ? personalState.reminders[programmeId] : undefined;
  const reminderActive = Boolean(
    reminderAvailable &&
      persistedReminder &&
      reminderVerification?.notificationId === persistedReminder.notificationId &&
      reminderVerification.active,
  );
  const reminderChecking = Boolean(reminderVerification?.checking);
  const description = programme?.description?.trim() ?? '';
  const current = temporalState.current;
  const sheetMaxHeight = Math.max(240, windowHeight - safeAreaInsets.top - 12);
  const bodyBottomPadding = programmeDetailBodyBottomPadding(
    stickyEligible,
    stickyBarHeight,
    safeAreaInsets.bottom,
  );

  const renderActionGroup = (sticky: boolean) => {
    if (!programme) return null;
    const reminderLabel = reminderActive ? 'Herinnering aan' : 'Herinner mij';
    const saveLabel = saved ? 'Bewaard' : 'Bewaar';

    return (
      <View
        testID={sticky ? 'programme-detail-sticky-actions' : 'programme-detail-actions'}
        onLayout={sticky ? undefined : handleActionLayout}
        style={[
          styles.actionGroup,
          sticky ? styles.stickyActionGroup : null,
          stackedActions ? styles.actionGroupStacked : styles.actionGroupInline,
        ]}
      >
        {reminderAvailable ? (
          <DetailActionButton
            testID={sticky ? 'programme-detail-sticky-reminder' : 'programme-detail-reminder'}
            label={reminderLabel}
            active={reminderActive}
            primary
            busy={reminderBusy || reminderChecking}
            stacked={stackedActions}
            colors={theme.colors}
            onPress={() => void toggleReminder()}
            onLabelWrap={promoteActionStack}
          />
        ) : null}
        <DetailActionButton
          testID={sticky ? 'programme-detail-sticky-save' : 'programme-detail-save'}
          label={saveLabel}
          active={saved}
          primary={false}
          stacked={stackedActions}
          colors={theme.colors}
          onPress={toggleSaved}
          onLabelWrap={promoteActionStack}
        />
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={state.visible}
      animationType="slide"
      onShow={handleShow}
      onRequestClose={requestClose}
      testID="programme-detail-modal"
    >
      <GestureHandlerRootView style={styles.modalContainer}>
        <Pressable
          testID="programme-detail-backdrop"
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
        />
        <Animated.View
          testID="programme-detail-sheet"
          collapsable={false}
          accessibilityViewIsModal
          onAccessibilityEscape={requestClose}
          onLayout={(event) => {
            sheetHeight.value = event.nativeEvent.layout.height;
          }}
          style={[
            styles.detailSheet,
            {
              maxHeight: sheetMaxHeight,
              backgroundColor: theme.colors.surfaceElevated,
            },
            dragStyle,
          ]}
        >
          {selection && programme && channel ? (
            <>
              <GestureDetector gesture={pan}>
                <View
                  testID="programme-detail-drag-handle-zone"
                  accessible={false}
                  style={styles.detailHandleZone}
                >
                  <View
                    style={[styles.detailHandle, { backgroundColor: theme.colors.border }]}
                  />
                </View>
              </GestureDetector>

              <ScrollView
                testID="programme-detail-scroll"
                style={styles.bodyScroll}
                contentContainerStyle={[
                  styles.bodyContent,
                  { paddingBottom: bodyBottomPadding },
                ]}
                onScroll={handleScroll}
                onLayout={handleScrollLayout}
                onContentSizeChange={handleContentSizeChange}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.detailTitle,
                    {
                      color: theme.colors.text,
                      fontFamily: TEEVEE_FONT_FAMILIES.semibold,
                    },
                  ]}
                >
                  {programme.title}
                </Text>

                <View style={styles.identityBlock}>
                  <ChannelIdentity
                    channel={channel}
                    textColor={theme.colors.text}
                    mutedTextColor={theme.colors.textMuted}
                    variant="detail"
                  />
                  <Text
                    style={[
                      styles.broadcastContext,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: TEEVEE_FONT_FAMILIES.regular,
                      },
                    ]}
                  >
                    {formatBroadcastContext(programme.startAt, programme.endAt)}
                  </Text>
                </View>

                {current ? (
                  <Text
                    testID="programme-detail-current-status"
                    style={[
                      styles.currentStatus,
                      {
                        color: theme.colors.currentTime,
                        fontFamily: TEEVEE_FONT_FAMILIES.semibold,
                      },
                    ]}
                  >
                    Nu bezig
                  </Text>
                ) : null}

                {renderActionGroup(false)}

                {actionMessage && !stickyVisible ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.actionMessage,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: TEEVEE_FONT_FAMILIES.regular,
                      },
                    ]}
                  >
                    {actionMessage}
                  </Text>
                ) : null}

                {description ? (
                  <Text
                    testID="programme-detail-description"
                    style={[
                      styles.detailDescription,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: TEEVEE_FONT_FAMILIES.regular,
                      },
                    ]}
                  >
                    {description}
                  </Text>
                ) : null}
              </ScrollView>

              <View
                pointerEvents={stickyVisible ? 'auto' : 'none'}
                accessibilityElementsHidden={!stickyVisible}
                importantForAccessibility={stickyVisible ? 'yes' : 'no-hide-descendants'}
                onLayout={(event) => setStickyBarHeight(event.nativeEvent.layout.height)}
                style={[
                  styles.stickyBar,
                  {
                    opacity: stickyVisible ? 1 : 0,
                    paddingBottom: programmeDetailStickyBottomPadding(safeAreaInsets.bottom),
                    backgroundColor: theme.colors.surfaceElevated,
                    borderTopColor: theme.colors.border,
                  },
                ]}
              >
                {actionMessage && stickyVisible ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.stickyActionMessage,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: TEEVEE_FONT_FAMILIES.regular,
                      },
                    ]}
                  >
                    {actionMessage}
                  </Text>
                ) : null}
                {renderActionGroup(true)}
              </View>
            </>
          ) : null}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  detailHandleZone: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  bodyScroll: {
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
  },
  detailTitle: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 14,
  },
  identityBlock: {
    alignItems: 'flex-start',
    gap: 5,
    marginBottom: 12,
  },
  broadcastContext: {
    fontSize: 14,
    lineHeight: 20,
  },
  currentStatus: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionGroup: {
    width: '100%',
    gap: 12,
    marginBottom: 22,
  },
  stickyActionGroup: {
    marginBottom: 0,
  },
  actionGroupInline: {
    flexDirection: 'row',
  },
  actionGroupStacked: {
    flexDirection: 'column',
  },
  actionButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  actionButtonInline: {
    flex: 1,
  },
  actionButtonStacked: {
    width: '100%',
  },
  actionLabel: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  actionMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -10,
    marginBottom: 20,
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  stickyActionMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
});
