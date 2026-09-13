import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

type AppScreenHeaderProps = {
  title: string;
  action?: ReactNode;
};

export function AppScreenHeader({ title, action }: AppScreenHeaderProps) {
  const theme = useTeeveeTheme();

  return (
    <View style={styles.header}>
      <View style={styles.titleGroup}>
        <Text accessible={false} style={[styles.eyebrow, { color: theme.colors.textMuted }]}>TEEVEE</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    columnGap: 16,
    rowGap: 12,
  },
  titleGroup: {
    flexShrink: 1,
  },
  action: {
    flexShrink: 0,
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
});
