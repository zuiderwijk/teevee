import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { GUIDE_TIME_ZONE } from '@/data/domain/guideTime';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import type { DetailState } from './detailState';

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

  return (
    <Modal
      transparent
      visible={state.visible}
      animationType="slide"
      onRequestClose={onClose}
      testID="programme-detail-modal"
    >
      <View style={styles.modalContainer}>
        {/* Siblings prevent taps on the sheet text from dismissing the backdrop. */}
        <Pressable
          testID="programme-detail-backdrop"
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          testID="programme-detail-sheet"
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[styles.detailSheet, { backgroundColor: theme.colors.surfaceElevated }]}
        >
          {selection ? (
            <>
              <View style={styles.detailHandleRow}>
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
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: theme.colors.accent, opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.background }]}>Sluiten</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
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
