import { memo, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  COMPACT_CHROME_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_TYPOGRAPHY,
  GUIDE_VISUAL_METRICS,
  platformMinimumTouchTarget,
} from './guideVisualMetrics';
import { guideDayLabel, guideDayOptions } from './guideDaySelection';

type GuideDaySelectorProps = {
  selectedDayStartMs: number;
  nowMs: number;
  loading?: boolean;
  unavailable?: boolean;
  compactPrefix?: string | undefined;
  onSelectDay: (dayStartMs: number) => void;
};

function DisclosureChevron({ color }: { color: string }) {
  return (
    <View accessible={false} style={styles.disclosureBox}>
      <View style={[styles.disclosureChevron, { borderColor: color }]} />
    </View>
  );
}

export const GuideDaySelector = memo(function GuideDaySelector({
  selectedDayStartMs,
  nowMs,
  loading = false,
  unavailable = false,
  compactPrefix,
  onSelectDay,
}: GuideDaySelectorProps) {
  const theme = useTeeveeTheme();
  const [open, setOpen] = useState(false);
  const options = useMemo(() => guideDayOptions(nowMs), [nowMs]);
  const selectedLabel = guideDayLabel(selectedDayStartMs, nowMs);
  const visibleLabel = compactPrefix ? `${compactPrefix} · ${selectedLabel}` : selectedLabel;
  const minimumTouchTarget = platformMinimumTouchTarget();

  const selectDay = (dayStartMs: number) => {
    setOpen(false);
    onSelectDay(dayStartMs);
  };

  return (
    <>
      <Pressable
        testID="guide-day-selector"
        accessibilityRole="button"
        accessibilityLabel={`${visibleLabel}. Kies een dag`}
        accessibilityHint={
          unavailable
            ? 'Actuele gidsdata voor deze dag is niet beschikbaar; de lokale gids blijft bruikbaar.'
            : 'Opent de beschikbare gidsdagen.'
        }
        accessibilityState={{ busy: loading }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.inlineControl,
          { minHeight: minimumTouchTarget, opacity: pressed ? GUIDE_VISUAL_METRICS.controlPressOpacity : 1 },
        ]}
      >
        <View style={styles.inlineLabelGroup}>
          {compactPrefix ? (
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={COMPACT_CHROME_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.compactPrefix, { color: theme.colors.text }]}
            >
              {compactPrefix}
            </Text>
          ) : null}
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={COMPACT_CHROME_MAX_FONT_SIZE_MULTIPLIER}
            style={[
              compactPrefix ? styles.compactDate : styles.inlineLabel,
              { color: theme.colors.text },
            ]}
          >
            {compactPrefix ? ` · ${selectedLabel}` : selectedLabel}
          </Text>
        </View>
        <DisclosureChevron color={theme.colors.textSecondary} />
      </Pressable>

      <Modal
        animationType="slide"
        transparent
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessible={false}
            testID="guide-day-selector-backdrop"
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />
          <SafeAreaView
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text accessibilityRole="header" style={[styles.sheetTitle, { color: theme.colors.text }]}>Kies een dag</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sluit dagkiezer"
                hitSlop={8}
                onPress={() => setOpen(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  { opacity: pressed ? GUIDE_VISUAL_METRICS.controlPressOpacity : 1 },
                ]}
              >
                <Text accessible={false} style={[styles.closeText, { color: theme.colors.text }]}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.optionList}
            >
              {options.map((window) => {
                const selected = window.fromMs === selectedDayStartMs;
                const label = guideDayLabel(window.fromMs, nowMs);
                return (
                  <Pressable
                    key={window.fromMs}
                    testID={`guide-day-option-${window.offset}`}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    onPress={() => selectDay(window.fromMs)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        borderBottomColor: theme.colors.border,
                        backgroundColor: selected ? theme.colors.surfaceElevated : theme.colors.surface,
                        opacity: pressed ? GUIDE_VISUAL_METRICS.controlPressOpacity : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{label}</Text>
                    {selected ? (
                      <Text
                        accessible={false}
                        testID="guide-day-option-selected-mark"
                        style={[styles.selectedMark, { color: theme.colors.currentTime }]}
                      >
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  inlineControl: {
    minWidth: GUIDE_VISUAL_METRICS.touchTargetIos,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineLabelGroup: {
    minWidth: 0,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineLabel: {
    ...GUIDE_TYPOGRAPHY.selectedDate,
    flexShrink: 1,
    letterSpacing: 0,
  },
  compactPrefix: {
    ...GUIDE_TYPOGRAPHY.condensedChannelPrefix,
    flexShrink: 1,
    letterSpacing: 0,
  },
  compactDate: {
    ...GUIDE_TYPOGRAPHY.condensedDate,
    flexShrink: 1,
    letterSpacing: 0,
  },
  disclosureBox: {
    width: 14,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclosureChevron: {
    width: 7,
    height: 7,
    marginTop: -3,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  sheetHeader: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
  },
  sheetTitle: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '400',
  },
  optionList: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  selectedMark: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
});
