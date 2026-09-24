import { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { Channel } from '@/data/domain/epg';
import { resolveChannelLogo } from '@/features/guide/channelLogoRegistry';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  CHANNEL_MANAGEMENT_METRICS,
  channelManagementAccessibilityActions,
  hiddenChannelAccessibilityLabel,
  visibleChannelAccessibilityLabel,
} from './channelManagement';

function alpha(hex: string, opacity: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const value = match[1]!;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function VisibilityGlyph({
  visible,
  color,
}: {
  visible: boolean;
  color: string;
}) {
  return (
    <View style={styles.visibilityIconBox}>
      <View
        style={[
          styles.eyeShape,
          {
            borderColor: color,
          },
        ]}
      >
        <View style={[styles.pupil, { backgroundColor: color }]} />
      </View>
      {!visible ? <View style={[styles.eyeSlash, { backgroundColor: color }]} /> : null}
    </View>
  );
}

function DragGlyph({ color }: { color: string }) {
  return (
    <View style={styles.dragGlyph}>
      {[0, 1, 2].map((line) => (
        <View
          key={line}
          style={[
            styles.dragLine,
            {
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

function ChannelLogo({
  channel,
  hidden,
}: {
  channel: Channel;
  hidden: boolean;
}) {
  const theme = useTeeveeTheme();
  const resolved = resolveChannelLogo(channel);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const showLogo = Boolean(resolved) && failedKey !== resolved?.key;

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.logoBox, hidden ? styles.hiddenLogo : null]}
    >
      {showLogo ? (
        <Image
          accessible={false}
          source={resolved!.source}
          resizeMode="contain"
          onError={() => setFailedKey(resolved?.key ?? null)}
          style={styles.logo}
        />
      ) : (
        <Text
          accessible={false}
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.logoFallback,
            {
              color: hidden ? theme.colors.textMuted : theme.colors.textSecondary,
              fontFamily: TEEVEE_FONT_FAMILIES.semibold,
            },
          ]}
        >
          {channel.shortName ?? channel.displayName}
        </Text>
      )}
    </View>
  );
}

export type ChannelManagementRowProps = {
  channel: Channel;
  visible: boolean;
  index: number;
  total: number;
  minHeight: number;
  nameLines: 1 | 2;
  canHide: boolean;
  reorderEnabled: boolean;
  reduceMotion: boolean;
  showSeparator: boolean;
  overlay?: boolean;
  rowRef?: (node: View | null) => void;
  onMeasure?: (channelId: string, height: number) => void;
  onToggleVisibility: (channelId: string, visible: boolean) => void;
  onMoveOneStep: (channelId: string, delta: -1 | 1) => void;
  onDragStart?: (channelId: string, absoluteY: number) => void;
  onDragMove?: (channelId: string, absoluteY: number) => void;
  onDragEnd?: (channelId: string, absoluteY: number) => void;
  onDragCancel?: (channelId: string) => void;
};

export function ChannelManagementRow({
  channel,
  visible,
  index,
  total,
  minHeight,
  nameLines,
  canHide,
  reorderEnabled,
  reduceMotion,
  showSeparator,
  overlay = false,
  rowRef,
  onMeasure,
  onToggleVisibility,
  onMoveOneStep,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: ChannelManagementRowProps) {
  const theme = useTeeveeTheme();
  const hidden = !visible;
  const visibilityColor = visible
    ? theme.colors.channelVisibilityActive
    : theme.colors.textMuted;
  const actions = channelManagementAccessibilityActions({
    visible,
    index,
    total,
    reorderEnabled,
    canHide,
  });
  const layoutTransition = reduceMotion
    ? undefined
    : LinearTransition.duration(
        CHANNEL_MANAGEMENT_METRICS.neighbourAnimationMs,
      ).easing(Easing.out(Easing.cubic));
  const entering = reduceMotion
    ? undefined
    : FadeIn.duration(CHANNEL_MANAGEMENT_METRICS.zoneTransitionMs);
  const exiting = reduceMotion
    ? undefined
    : FadeOut.duration(CHANNEL_MANAGEMENT_METRICS.zoneTransitionMs);

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(Boolean(visible && reorderEnabled && !overlay))
        .activateAfterLongPress(CHANNEL_MANAGEMENT_METRICS.dragLongPressMs)
        .failOffsetY([
          -CHANNEL_MANAGEMENT_METRICS.dragPreactivationTolerance,
          CHANNEL_MANAGEMENT_METRICS.dragPreactivationTolerance,
        ])
        .onStart((event) => {
          if (onDragStart) {
            scheduleOnRN(onDragStart, channel.id, event.absoluteY);
          }
        })
        .onUpdate((event) => {
          if (onDragMove) {
            scheduleOnRN(onDragMove, channel.id, event.absoluteY);
          }
        })
        .onEnd((event) => {
          if (onDragEnd) {
            scheduleOnRN(onDragEnd, channel.id, event.absoluteY);
          }
        })
        .onFinalize((_event, success) => {
          if (!success && onDragCancel) {
            scheduleOnRN(onDragCancel, channel.id);
          }
        }),
    [
      channel.id,
      onDragCancel,
      onDragEnd,
      onDragMove,
      onDragStart,
      overlay,
      reorderEnabled,
      visible,
    ],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    onMeasure?.(channel.id, event.nativeEvent.layout.height);
  };

  const toggle = () => {
    if (visible && !canHide) return;
    onToggleVisibility(channel.id, !visible);
  };

  const content = (
    <>
      {overlay ? (
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.visibilityZone}
        >
          <VisibilityGlyph visible={visible} color={visibilityColor} />
        </View>
      ) : (
        <Pressable
          testID={`channels-visibility-${channel.id}`}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          disabled={visible && !canHide}
          onPress={toggle}
          style={styles.visibilityZone}
        >
          {({ pressed }) => (
            <View
              style={[
                styles.visibilityPressedCircle,
                {
                  backgroundColor: pressed
                    ? alpha(
                        visibilityColor,
                        visible ? (theme.dark ? 0.14 : 0.1) : 0.1,
                      )
                    : 'transparent',
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <VisibilityGlyph visible={visible} color={visibilityColor} />
            </View>
          )}
        </Pressable>
      )}

      <ChannelLogo channel={channel} hidden={hidden} />

      <Text
        accessible={false}
        numberOfLines={nameLines}
        ellipsizeMode="tail"
        style={[
          styles.name,
          {
            color: hidden ? theme.colors.textSecondary : theme.colors.text,
            fontFamily: visible
              ? TEEVEE_FONT_FAMILIES.medium
              : TEEVEE_FONT_FAMILIES.regular,
          },
        ]}
      >
        {channel.displayName}
      </Text>

      {visible && reorderEnabled ? (
        overlay ? (
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.dragZone}
          >
            <DragGlyph color={theme.colors.textMuted} />
          </View>
        ) : (
          <GestureDetector gesture={dragGesture}>
            <View
              testID={`channels-drag-${channel.id}`}
              collapsable={false}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.dragZone}
            >
              <DragGlyph color={theme.colors.textMuted} />
            </View>
          </GestureDetector>
        )
      ) : null}

      {showSeparator && !overlay ? (
        <View
          pointerEvents="none"
          style={[
            styles.separator,
            {
              backgroundColor: theme.colors.border,
            },
          ]}
        />
      ) : null}
    </>
  );

  return (
    <Animated.View
      ref={rowRef}
      testID={`channels-${visible ? 'visible' : 'hidden'}-${channel.id}`}
      accessible={!overlay}
      accessibilityRole={overlay ? undefined : 'button'}
      accessibilityLabel={
        overlay
          ? undefined
          : visible
            ? visibleChannelAccessibilityLabel(channel.displayName, index, total)
            : hiddenChannelAccessibilityLabel(channel.displayName)
      }
      accessibilityHint={
        visible && !canHide
          ? 'Minimaal één zender moet zichtbaar blijven'
          : undefined
      }
      accessibilityActions={overlay ? undefined : actions}
      onAccessibilityTap={overlay ? undefined : toggle}
      onAccessibilityAction={
        overlay
          ? undefined
          : (event) => {
              switch (event.nativeEvent.actionName) {
                case 'hide':
                  if (canHide) onToggleVisibility(channel.id, false);
                  break;
                case 'show':
                  onToggleVisibility(channel.id, true);
                  break;
                case 'moveUp':
                  onMoveOneStep(channel.id, -1);
                  break;
                case 'moveDown':
                  onMoveOneStep(channel.id, 1);
                  break;
              }
            }
      }
      onLayout={overlay ? undefined : handleLayout}
      entering={overlay ? undefined : entering}
      exiting={overlay ? undefined : exiting}
      layout={overlay ? undefined : layoutTransition}
      pointerEvents={overlay ? 'none' : 'auto'}
      style={[
        styles.row,
        {
          minHeight,
          backgroundColor: overlay ? theme.colors.surfaceElevated : 'transparent',
        },
        overlay
          ? [
              styles.overlayRow,
              {
                opacity: CHANNEL_MANAGEMENT_METRICS.pickedOpacity,
                shadowOpacity: reduceMotion
                  ? 0
                  : theme.dark
                    ? 0.28
                    : 0.14,
                elevation:
                  reduceMotion || Platform.OS !== 'android'
                    ? 0
                    : CHANNEL_MANAGEMENT_METRICS.androidPickedElevation,
              },
            ]
          : null,
      ]}
    >
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: CHANNEL_MANAGEMENT_METRICS.rowVerticalPadding,
    position: 'relative',
  },
  overlayRow: {
    borderRadius: CHANNEL_MANAGEMENT_METRICS.pickedRadius,
    shadowColor: '#000000',
    shadowRadius: CHANNEL_MANAGEMENT_METRICS.pickedShadowRadius,
    shadowOffset: {
      width: 0,
      height: CHANNEL_MANAGEMENT_METRICS.pickedShadowOffsetY,
    },
  },
  visibilityZone: {
    width: CHANNEL_MANAGEMENT_METRICS.visibilityZoneWidth,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityPressedCircle: {
    width: CHANNEL_MANAGEMENT_METRICS.visibilityPressedDiameter,
    height: CHANNEL_MANAGEMENT_METRICS.visibilityPressedDiameter,
    borderRadius: CHANNEL_MANAGEMENT_METRICS.visibilityPressedRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityIconBox: {
    width: CHANNEL_MANAGEMENT_METRICS.visibilityIconBox,
    height: CHANNEL_MANAGEMENT_METRICS.visibilityIconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeShape: {
    width: CHANNEL_MANAGEMENT_METRICS.visibilityEyeWidth,
    height: CHANNEL_MANAGEMENT_METRICS.visibilityEyeHeight,
    borderWidth: CHANNEL_MANAGEMENT_METRICS.visibilityStrokeWidth,
    borderRadius: CHANNEL_MANAGEMENT_METRICS.visibilityEyeWidth / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: CHANNEL_MANAGEMENT_METRICS.visibilityPupilSize,
    height: CHANNEL_MANAGEMENT_METRICS.visibilityPupilSize,
    borderRadius: CHANNEL_MANAGEMENT_METRICS.visibilityPupilSize / 2,
  },
  eyeSlash: {
    position: 'absolute',
    width: 22,
    height: CHANNEL_MANAGEMENT_METRICS.visibilityStrokeWidth,
    borderRadius: CHANNEL_MANAGEMENT_METRICS.visibilityStrokeWidth / 2,
    transform: [{ rotate: '-45deg' }],
  },
  logoBox: {
    width: CHANNEL_MANAGEMENT_METRICS.logoWidth,
    height: CHANNEL_MANAGEMENT_METRICS.logoHeight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hiddenLogo: {
    opacity: 0.72,
  },
  logo: {
    width: CHANNEL_MANAGEMENT_METRICS.logoWidth,
    height: CHANNEL_MANAGEMENT_METRICS.logoHeight,
  },
  logoFallback: {
    maxWidth: CHANNEL_MANAGEMENT_METRICS.logoWidth,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  name: {
    flex: 1,
    minWidth: 0,
    marginLeft: CHANNEL_MANAGEMENT_METRICS.logoNameGap,
    fontSize: 15,
    lineHeight: 20,
  },
  dragZone: {
    width: CHANNEL_MANAGEMENT_METRICS.dragZoneWidth,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragGlyph: {
    width: CHANNEL_MANAGEMENT_METRICS.dragGlyphWidth,
    height: CHANNEL_MANAGEMENT_METRICS.dragGlyphHeight,
    justifyContent: 'space-between',
  },
  dragLine: {
    width: CHANNEL_MANAGEMENT_METRICS.dragGlyphWidth,
    height: CHANNEL_MANAGEMENT_METRICS.dragStrokeWidth,
    borderRadius: CHANNEL_MANAGEMENT_METRICS.dragStrokeWidth / 2,
  },
  separator: {
    position: 'absolute',
    left: CHANNEL_MANAGEMENT_METRICS.visibilityZoneWidth,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
