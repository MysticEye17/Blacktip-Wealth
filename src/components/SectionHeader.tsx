import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { theme } from '../utils/theme';

export default function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '900', color: theme.colors.secondary },
  subtitle: { fontSize: 14, color: theme.colors.muted, marginTop: 4, lineHeight: 20 },
});
