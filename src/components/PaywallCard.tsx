import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from './Card';
import { theme } from '../utils/theme';

export const PREMIUM_PRICE = '$0.99';

type Feature = string | { title: string; detail: string };

type PaywallCardProps = {
  title?: string;
  subtitle?: string;
  features?: Feature[];
  buttonLabel?: string;
  compact?: boolean;
  loading?: boolean;
  onUnlock: () => void;
  onRestore?: () => void;
};

const defaultFeatures: Feature[] = [
  'Full advisor-style analysis',
  'All planning modules',
  'Weekly money moves',
  'Shareable plan snapshot',
];

export default function PaywallCard({
  title = 'Unlock your full Blacktip Wealth action plan',
  subtitle = 'One tiny purchase opens the personalized next-step layer.',
  features = defaultFeatures,
  buttonLabel = `Unlock for ${PREMIUM_PRICE}`,
  compact = false,
  loading = false,
  onUnlock,
  onRestore,
}: PaywallCardProps) {
  return (
    <Card style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.priceRow}>
        <View style={styles.priceBadge}>
          <Text style={styles.price}>{PREMIUM_PRICE}</Text>
        </View>
        <Text style={styles.overline}>Full access</Text>
      </View>
      <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.featureGrid}>
        {features.map(feature => (
          <View key={typeof feature === 'string' ? feature : feature.title} style={styles.feature}>
            <View style={styles.checkDot} />
            <View style={styles.featureCopy}>
              <Text style={styles.featureText}>{typeof feature === 'string' ? feature : feature.title}</Text>
              {typeof feature === 'string' ? null : <Text style={styles.featureDetail}>{feature.detail}</Text>}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onUnlock} disabled={loading}>
        {loading ? <ActivityIndicator color={theme.colors.deepBlue} /> : <Text style={styles.primaryButtonText}>{buttonLabel}</Text>}
      </TouchableOpacity>
      {onRestore ? (
        <TouchableOpacity style={styles.secondaryButton} onPress={onRestore}>
          <Text style={styles.secondaryButtonText}>Restore access</Text>
        </TouchableOpacity>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.deepBlue, borderColor: theme.colors.deepBlue },
  compactCard: { marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  priceBadge: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  price: { color: theme.colors.deepBlue, fontSize: 22, fontWeight: '900' },
  overline: { color: theme.colors.seafoam, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', lineHeight: 34, marginBottom: 8 },
  compactTitle: { fontSize: 23, lineHeight: 29 },
  subtitle: { color: '#D6E7F0', lineHeight: 22, marginBottom: 16 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  feature: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 10,
  },
  checkDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: theme.colors.seafoam, marginRight: 9 },
  featureCopy: { flex: 1 },
  featureText: { color: '#FFFFFF', fontWeight: '900' },
  featureDetail: { color: '#C9DDEA', lineHeight: 19, marginTop: 4 },
  primaryButton: { backgroundColor: '#FFFFFF', borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 18, minHeight: 58 },
  primaryButtonText: { color: theme.colors.deepBlue, fontWeight: '900', fontSize: 17 },
  secondaryButton: { alignItems: 'center', padding: 14, marginTop: 4 },
  secondaryButtonText: { color: theme.colors.seafoam, fontWeight: '900' },
});
