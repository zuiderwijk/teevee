import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  type AppearancePreference,
} from '@/features/settings/appPreferences';
import { useAppearancePreferenceSettings } from '@/features/settings/AppearancePreferenceProvider';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

const APPEARANCE_OPTIONS: ReadonlyArray<{
  id: AppearancePreference;
  label: string;
  description: string;
}> = [
  { id: 'system', label: 'Systeem', description: 'Volgt automatisch de weergave van je toestel.' },
  { id: 'light', label: 'Licht', description: 'Gebruik altijd de lichte weergave.' },
  { id: 'dark', label: 'Donker', description: 'Gebruik altijd de donkere weergave.' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTeeveeTheme();
  const { appearance, setAppearance } = useAppearancePreferenceSettings();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text accessible={false} style={[styles.eyebrow, { color: theme.colors.textMuted }]}>TEEVEE</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Instellingen</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sluit instellingen"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.doneButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text style={[styles.doneButtonText, { color: theme.colors.textSecondary }]}>Gereed</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>WEERGAVE</Text>
        <View
          style={[
            styles.optionGroup,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          {APPEARANCE_OPTIONS.map((option, index) => {
            const selected = appearance === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${option.label}. ${option.description}`}
                onPress={() => setAppearance(option.id)}
                style={({ pressed }) => [
                  styles.option,
                  index > 0 && { borderTopColor: theme.colors.border, borderTopWidth: StyleSheet.hairlineWidth },
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{option.label}</Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
                <View
                  accessible={false}
                  style={[
                    styles.radio,
                    {
                      borderColor: selected ? theme.colors.accent : theme.colors.textMuted,
                    },
                  ]}
                >
                  {selected ? <View style={[styles.radioDot, { backgroundColor: theme.colors.accent }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.footer, { color: theme.colors.textMuted }]}>De gekozen weergave wordt lokaal op dit toestel onthouden.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  topRow: {
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 2,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  doneButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  doneButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  sectionLabel: {
    marginTop: 28,
    marginBottom: 8,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  optionGroup: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  option: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  optionDescription: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 2,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
});
