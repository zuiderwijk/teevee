import { useRouter } from 'expo-router';
import { type ReactNode, memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

const CHROME_MAX_FONT_SIZE_MULTIPLIER = 1.15;

type GuideChromeProps = {
  condensed: boolean;
  presentationNavigation: ReactNode;
  heading?: string;
  supportingText?: string;
};

function SearchGlyph({ color }: { color: string }) {
  return (
    <View accessible={false} style={styles.searchGlyph}>
      <View style={[styles.searchCircle, { borderColor: color }]} />
      <View style={[styles.searchHandle, { backgroundColor: color }]} />
    </View>
  );
}

export const GuideChrome = memo(function GuideChrome({
  condensed,
  presentationNavigation,
  heading,
  supportingText,
}: GuideChromeProps) {
  const router = useRouter();
  const theme = useTeeveeTheme();

  return (
    <View
      testID={condensed ? 'guide-chrome-condensed' : 'guide-chrome-expanded'}
      style={[styles.chrome, { backgroundColor: theme.colors.background }]}
    >
      {!condensed ? (
        <>
          <View style={styles.brandRow}>
            <View accessible accessibilityRole="text" accessibilityLabel="Teevee" style={styles.brandMark}>
              <Text
                accessible={false}
                maxFontSizeMultiplier={CHROME_MAX_FONT_SIZE_MULTIPLIER}
                style={[styles.brandText, { color: theme.colors.text }]}
              >
                tv
              </Text>
              <View style={[styles.brandDot, { backgroundColor: theme.colors.currentTime }]} />
            </View>

            <View style={styles.headerActions}>
              <Pressable
                testID="guide-search-action"
                accessibilityRole="button"
                accessibilityLabel="Zoeken"
                hitSlop={4}
                onPress={() => router.push('/search')}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.55 : 1 }]}
              >
                <SearchGlyph color={theme.colors.textSecondary} />
              </Pressable>
              <Pressable
                testID="guide-settings-action"
                accessibilityRole="button"
                accessibilityLabel="Open instellingen"
                hitSlop={4}
                onPress={() => router.push('/settings')}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.55 : 1 }]}
              >
                <Text
                  accessible={false}
                  maxFontSizeMultiplier={1}
                  style={[styles.moreGlyph, { color: theme.colors.textSecondary }]}
                >
                  …
                </Text>
              </Pressable>
            </View>
          </View>

          {heading ? (
            <View style={styles.headingGroup}>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={CHROME_MAX_FONT_SIZE_MULTIPLIER}
                style={[styles.heading, { color: theme.colors.text }]}
              >
                {heading}
              </Text>
              {supportingText ? (
                <Text
                  maxFontSizeMultiplier={1.25}
                  style={[styles.supportingText, { color: theme.colors.textSecondary }]}
                >
                  {supportingText}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.presentationNavigation}>{presentationNavigation}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  chrome: {
    flexGrow: 0,
  },
  brandRow: {
    minHeight: 54,
    paddingHorizontal: 18,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandMark: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  brandText: {
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -1.8,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 2,
    marginBottom: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchGlyph: {
    width: 22,
    height: 22,
  },
  searchCircle: {
    position: 'absolute',
    left: 2,
    top: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.6,
  },
  searchHandle: {
    position: 'absolute',
    width: 8,
    height: 1.6,
    left: 13,
    top: 15,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  moreGlyph: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
    marginTop: -5,
  },
  headingGroup: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 29,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  supportingText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  presentationNavigation: {
    width: '100%',
  },
});
