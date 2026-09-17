import { memo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { Channel } from '@/data/domain/epg';

import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_TYPOGRAPHY,
  PER_CHANNEL_VISUAL_METRICS,
} from './guideVisualMetrics';

type ChannelIdentityProps = {
  channel: Channel;
  textColor: string;
  mutedTextColor: string;
  variant?: 'default' | 'per-channel-strip';
};

export const ChannelIdentity = memo(function ChannelIdentity({
  channel,
  textColor,
  mutedTextColor,
  variant = 'default',
}: ChannelIdentityProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const showLogo = Boolean(channel.logoUrl) && failedLogoUrl !== channel.logoUrl;
  const perChannelStrip = variant === 'per-channel-strip';
  const showVisibleName = perChannelStrip ? !showLogo : true;
  const visibleName = perChannelStrip ? channel.shortName ?? channel.displayName : channel.displayName;

  return (
    <View
      accessible
      accessibilityLabel={channel.displayName}
      style={[styles.container, perChannelStrip ? styles.perChannelContainer : null]}
    >
      {showLogo ? (
        <Image
          accessible={false}
          source={{ uri: channel.logoUrl }}
          resizeMode="contain"
          onError={() => setFailedLogoUrl(channel.logoUrl ?? null)}
          style={[styles.logo, perChannelStrip ? styles.perChannelLogo : null]}
        />
      ) : null}
      {showVisibleName ? (
        <Text
          numberOfLines={1}
          ellipsizeMode={perChannelStrip || showLogo ? 'tail' : 'middle'}
          maxFontSizeMultiplier={
            perChannelStrip ? COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER : undefined
          }
          style={[
            styles.name,
            showLogo ? styles.nameWithLogo : null,
            perChannelStrip ? styles.perChannelFallback : null,
            { color: perChannelStrip ? textColor : showLogo ? mutedTextColor : textColor },
          ]}
        >
          {visibleName}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  perChannelContainer: {
    width: PER_CHANNEL_VISUAL_METRICS.logoMaxWidth,
    height: PER_CHANNEL_VISUAL_METRICS.logoMaxHeight,
    flex: 0,
    paddingHorizontal: 0,
  },
  logo: {
    width: '78%',
    height: 24,
    marginBottom: 4,
  },
  perChannelLogo: {
    width: PER_CHANNEL_VISUAL_METRICS.logoMaxWidth,
    height: PER_CHANNEL_VISUAL_METRICS.logoMaxHeight,
    marginBottom: 0,
  },
  name: {
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  nameWithLogo: {
    fontSize: 10,
    fontWeight: '600',
  },
  perChannelFallback: {
    ...GUIDE_TYPOGRAPHY.channelFallback,
    width: PER_CHANNEL_VISUAL_METRICS.logoMaxWidth,
    textAlign: 'center',
    letterSpacing: 0,
  },
});
