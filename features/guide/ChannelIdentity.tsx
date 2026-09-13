import { memo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { Channel } from '@/data/domain/epg';

type ChannelIdentityProps = {
  channel: Channel;
  textColor: string;
  mutedTextColor: string;
};

export const ChannelIdentity = memo(function ChannelIdentity({
  channel,
  textColor,
  mutedTextColor,
}: ChannelIdentityProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const showLogo = Boolean(channel.logoUrl) && failedLogoUrl !== channel.logoUrl;

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
          style={styles.logo}
        />
      ) : null}
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
