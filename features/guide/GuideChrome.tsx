import { useRouter } from 'expo-router';
import { type ReactNode, memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

const CHROME_MAX_FONT_SIZE_MULTIPLIER = 1.15;
const EXPANDED_CHROME_HEIGHT = 98;

type GuideChromeProps = {
  condensed: boolean;
  presentationNavigation: ReactNode;
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
}: GuideChromeProps) {
  const router = useRouter();
  const theme = useTeeveeTheme();
  const expansion = useSharedValue(condensed ? 0 : 1);

  useEffect(() => {
    expansion.value = withSpring(condensed ? 0 : 1, {
      damping: 24,
      stiffness: 260,
      mass: 0.7,
      overshootClamping: true,
      reduceMotion: ReduceMotion.System,
    });
  }, [condensed, expansion]);

  const expandedChromeStyle = useAnimatedStyle(() => ({
    height: EXPANDED_CHROME_HEIGHT * expansion.value,
    opacity: expansion.value,
    transform: [{ translateY: -8 * (1 - expansion.value) }],
  }));

  return (
    <View
      testID={condensed ? 'guide-chrome-condensed' : 'guide-chrome-expanded'}
      style={[styles.chrome, { backgroundColor: theme.colors.background }]}
    >
      <Animated.View
        testID="guide-chrome-expanded-content"
        pointerEvents={condensed ? 'none' : 'auto'}
        accessibilityElementsHidden={condensed}
        importantForAccessibility={condensed ? 'no-hide-descendants' : 'auto'}
        style={[styles.expandedChrome, expandedChromeStyle]}
      >
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

        <View style={styles.presentationNavigation}>{presentationNavigation}</View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  chrome: {
    flexGrow: 0,
    overflow: 'hidden',
  },
  expandedChrome: {
    width: '100%',
    overflow: 'hidden',
  },
  brandRow: {
    height: 54,
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
  presentationNavigation: {
    width: '100%',
    height: 44,
  },
});
