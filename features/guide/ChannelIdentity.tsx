import { memo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { Channel } from '@/data/domain/epg';

type ChannelIdentityVariant = 'default' | 'logo-first';

type ChannelIdentityProps = {
  channel: Channel;
  textColor: string;
  mutedTextColor: string;
  variant?: ChannelIdentityVariant;
};

export const ChannelIdentity = memo(function ChannelIdentity({
  channel,
  textColor,
  mutedTextColor,
  variant = 'default',
}: ChannelIdentityProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const showLogo = Boolean(channel.logoUrl) && failedLogoUrl !== channel.logoUrl;
  const logoFirst = variant === 'logo-first';
  const showVisibleName = !showLogo || !logoFirst;

  return (
    <View
      accessible
      accessibilityLabel={channel.displayName}
      style={styles.container}
    >
      {showLogo ? (
        <Image
          accessible={false}
          source={{ uri: channel.logoUrl }}
          resizeMode="contain"
          onError={() => setFailedLogoUrl(channel.logoUrl ?? null)}
          style={[styles.logo, logoFirst ? styles.logoFirst : null]}
        />
      ) : null}
      {showVisibleName ? (
        <Text
          numberOfLines={1}
          ellipsizeMode={showLogo ? 'tail' : 'middle'}
          style={[
            styles.name,
            showLogo ? styles.nameWithLogo : null,
            { color: showLogo ? mutedTextColor : textColor },
          ]}
        >
          {channel.displayName}
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
  logo: {
    width: '78%',
    height: 24,
    marginBottom: 4,
  },
  logoFirst: {
    width: '82%',
    height: 30,
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
});
