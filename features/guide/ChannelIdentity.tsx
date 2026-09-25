import { memo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { Channel } from '@/data/domain/epg';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import {
  COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER,
  GUIDE_TYPOGRAPHY,
  PER_CHANNEL_VISUAL_METRICS,
} from './guideVisualMetrics';
import { resolveChannelLogo } from './channelLogoRegistry';
import { TOTAAL_VISUAL_METRICS } from './totaal';

type ChannelIdentityProps = {
  channel: Channel;
  textColor: string;
  mutedTextColor: string;
  variant?: 'default' | 'totaal' | 'per-channel-strip' | 'now-next' | 'detail';
  accessible?: boolean;
};

export const ChannelIdentity = memo(function ChannelIdentity({
  channel,
  textColor,
  mutedTextColor,
  variant = 'default',
  accessible = true,
}: ChannelIdentityProps) {
  const theme = useTeeveeTheme();
  const resolvedLogo = resolveChannelLogo(channel, theme.dark ? 'dark' : 'light');
  const [failedLogoKey, setFailedLogoKey] = useState<string | null>(null);
  const showLogo = Boolean(resolvedLogo) && failedLogoKey !== resolvedLogo?.key;
  const totaal = variant === 'totaal';
  const perChannelStrip = variant === 'per-channel-strip';
  const nowNext = variant === 'now-next';
  const detail = variant === 'detail';
  const compactLogoIdentity = totaal || perChannelStrip || nowNext;
  const showVisibleName = compactLogoIdentity ? !showLogo : true;
  const visibleName = compactLogoIdentity
    ? channel.shortName ?? channel.displayName
    : channel.displayName;

  return (
    <View
      accessible={accessible}
      accessibilityElementsHidden={!accessible}
      importantForAccessibility={accessible ? 'auto' : 'no-hide-descendants'}
      accessibilityLabel={accessible ? channel.displayName : undefined}
      style={[
        styles.container,
        totaal ? styles.totaalContainer : null,
        perChannelStrip ? styles.perChannelContainer : null,
        nowNext ? styles.nowNextContainer : null,
        detail ? styles.detailContainer : null,
      ]}
    >
      {showLogo ? (
        <Image
          accessible={false}
          source={resolvedLogo!.source}
          resizeMode="contain"
          onError={() => setFailedLogoKey(resolvedLogo?.key ?? null)}
          style={[
            styles.logo,
            totaal ? styles.totaalLogo : null,
            perChannelStrip ? styles.perChannelLogo : null,
            nowNext ? styles.nowNextLogo : null,
            detail ? styles.detailLogo : null,
          ]}
        />
      ) : null}
      {showVisibleName ? (
        <Text
          accessible={false}
          numberOfLines={totaal ? 2 : 1}
          ellipsizeMode={compactLogoIdentity || detail || showLogo ? 'tail' : 'middle'}
          maxFontSizeMultiplier={
            compactLogoIdentity ? COMPACT_GUIDE_MAX_FONT_SIZE_MULTIPLIER : undefined
          }
          style={[
            nowNext ? styles.nowNextName : totaal ? styles.totaalName : styles.name,
            showLogo ? styles.nameWithLogo : null,
            totaal ? styles.totaalFallback : null,
            perChannelStrip ? styles.perChannelFallback : null,
            nowNext ? styles.nowNextFallback : null,
            detail ? styles.detailName : null,
            {
              color: detail
                ? textColor
                : compactLogoIdentity
                  ? textColor
                  : showLogo
                    ? mutedTextColor
                    : textColor,
            },
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
  totaalContainer: {
    paddingHorizontal: 6,
  },
  detailContainer: {
    flex: 0,
    minWidth: 0,
    maxWidth: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  perChannelContainer: {
    width: PER_CHANNEL_VISUAL_METRICS.logoMaxWidth,
    height: PER_CHANNEL_VISUAL_METRICS.logoMaxHeight,
    flex: 0,
    paddingHorizontal: 0,
  },
  nowNextContainer: {
    width: 40,
    height: 32,
    flex: 0,
    paddingHorizontal: 0,
  },
  logo: {
    width: '78%',
    height: 24,
    marginBottom: 4,
  },
  totaalLogo: {
    width: TOTAAL_VISUAL_METRICS.channelLogoMaxWidth,
    height: TOTAAL_VISUAL_METRICS.channelLogoMaxHeight,
    marginBottom: 0,
  },
  detailLogo: {
    width: 36,
    height: 24,
    marginBottom: 0,
    marginRight: 8,
  },
  perChannelLogo: {
    width: PER_CHANNEL_VISUAL_METRICS.logoMaxWidth,
    height: PER_CHANNEL_VISUAL_METRICS.logoMaxHeight,
    marginBottom: 0,
  },
  nowNextLogo: {
    width: 40,
    height: 32,
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
  totaalName: {
    width: '100%',
    textAlign: 'center',
  },
  totaalFallback: {
    ...GUIDE_TYPOGRAPHY.channelFallback,
    letterSpacing: 0,
  },
  nowNextName: {
    width: '100%',
    textAlign: 'center',
  },
  detailName: {
    width: 'auto',
    flexShrink: 1,
    textAlign: 'left',
    fontFamily: TEEVEE_FONT_FAMILIES.medium,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  perChannelFallback: {
    ...GUIDE_TYPOGRAPHY.channelFallback,
    width: PER_CHANNEL_VISUAL_METRICS.logoMaxWidth,
    textAlign: 'center',
    letterSpacing: 0,
  },
  nowNextFallback: {
    ...GUIDE_TYPOGRAPHY.channelFallback,
    width: 40,
    textAlign: 'center',
    letterSpacing: 0,
  },
});
