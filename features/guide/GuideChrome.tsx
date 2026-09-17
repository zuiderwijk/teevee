import { useRouter } from 'expo-router';
import { type ReactNode, memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { TEEVEE_FONT_WEIGHTS } from '@/theme/typography';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_VISUAL_METRICS,
  minimumTouchTargetForPlatform,
  PER_CHANNEL_VISUAL_METRICS,
} from './guideVisualMetrics';

const EXPANDED_CHROME_HEIGHT =
  GUIDE_VISUAL_METRICS.brandTopInset +
  GUIDE_VISUAL_METRICS.brandMarkBoxHeight +
  GUIDE_VISUAL_METRICS.presentationNavHeight;
const CHROME_TOUCH_TARGET = minimumTouchTargetForPlatform();

type GuideChromeProps = {
  condensed: boolean;
  presentationNavigation: ReactNode;
  collapseProgress: SharedValue<number>;
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
  collapseProgress,
}: GuideChromeProps) {
  const router = useRouter();
  const theme = useTeeveeTheme();

  const expandedStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, collapseProgress.value));
    const expansion = 1 - progress;

    return {
      height: EXPANDED_CHROME_HEIGHT * expansion,
      opacity: expansion,
      transform: [
        { translateY: -PER_CHANNEL_VISUAL_METRICS.collapseTranslateY * progress },
      ],
    };
  });

  return (
    <View
      testID={condensed ? 'guide-chrome-condensed' : 'guide-chrome-expanded'}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <Animated.View
        testID="guide-chrome-expanded-content"
        pointerEvents={condensed ? 'none' : 'auto'}
        accessibilityElementsHidden={condensed}
        importantForAccessibility={condensed ? 'no-hide-descendants' : 'auto'}
        style={[styles.expanded, expandedStyle]}
      >
        <View style={styles.brandRow}>
          <View accessible accessibilityRole="text" accessibilityLabel="Teevee" style={styles.brandMark}>
            <Text
              accessible={false}
              maxFontSizeMultiplier={COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.brandText, { color: theme.colors.text }]}
            >
              tv
            </Text>
            <View style={[styles.brandDot, { backgroundColor: theme.colors.currentTime }]} />
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoeken"
              hitSlop={4}
              onPress={() => router.push('/search')}
              style={({ pressed }) => [
                styles.iconButton,
                { opacity: pressed ? GUIDE_VISUAL_METRICS.controlPressOpacity : 1 },
              ]}
            >
              <SearchGlyph color={theme.colors.textSecondary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open instellingen"
              hitSlop={4}
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [
                styles.iconButton,
                { opacity: pressed ? GUIDE_VISUAL_METRICS.controlPressOpacity : 1 },
              ]}
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
  root: {
    flexGrow: 0,
    overflow: 'hidden',
  },
  expanded: {
    width: '100%',
    overflow: 'hidden',
  },
  brandRow: {
    height: GUIDE_VISUAL_METRICS.brandTopInset + GUIDE_VISUAL_METRICS.brandMarkBoxHeight,
    paddingHorizontal: GUIDE_VISUAL_METRICS.screenInsetX,
    paddingTop: GUIDE_VISUAL_METRICS.brandTopInset,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandMark: {
    width: GUIDE_VISUAL_METRICS.brandMarkBoxWidth,
    height: GUIDE_VISUAL_METRICS.brandMarkBoxHeight,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  brandText: {
    fontSize: 31,
    lineHeight: 34,
    fontWeight: TEEVEE_FONT_WEIGHTS.bold,
    letterSpacing: -1.8,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 2,
    marginBottom: 5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: CHROME_TOUCH_TARGET,
    height: CHROME_TOUCH_TARGET,
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
    fontWeight: TEEVEE_FONT_WEIGHTS.bold,
    marginTop: -5,
  },
  presentationNavigation: {
    width: '100%',
    height: GUIDE_VISUAL_METRICS.presentationNavHeight,
  },
});
