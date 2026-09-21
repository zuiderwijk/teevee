import { useRouter } from 'expo-router';
import { type ReactNode, memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_TYPOGRAPHY,
  GUIDE_VISUAL_METRICS,
  guideChromeExpandedHeight,
  guidePresentationNavigationMetrics,
} from './guideVisualMetrics';

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
  const { fontScale = 1 } = useWindowDimensions();
  const expandedChromeHeight = guideChromeExpandedHeight(fontScale);
  const presentationNavigationMetrics = guidePresentationNavigationMetrics(fontScale);

  const expandedStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, collapseProgress.value));
    return {
      height: expandedChromeHeight * (1 - progress),
      opacity: 1 - progress,
      transform: [
        { translateY: -GUIDE_VISUAL_METRICS.chromeCollapseTranslateY * progress },
      ],
    };
  });

  return (
    <View
      testID={condensed ? 'guide-chrome-condensed' : 'guide-chrome-expanded'}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <Animated.View
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
              <Text accessible={false} maxFontSizeMultiplier={1} style={[styles.moreGlyph, { color: theme.colors.textSecondary }]}>…</Text>
            </Pressable>
          </View>
        </View>
        <View
          style={[
            styles.presentationNavigation,
            { height: presentationNavigationMetrics.height },
          ]}
        >
          {presentationNavigation}
        </View>
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
    alignItems: 'center',
  },
  brandText: {
    ...GUIDE_TYPOGRAPHY.brandMark,
    letterSpacing: -1.6,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 2,
    marginTop: 15,
  },
  actions: {
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
    marginTop: -5,
  },
  presentationNavigation: {
    width: '100%',
    height: GUIDE_VISUAL_METRICS.presentationNavHeight,
  },
});
