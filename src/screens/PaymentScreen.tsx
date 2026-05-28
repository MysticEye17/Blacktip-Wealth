import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import appConfig from '../../app.json';
import { RootStackParamList } from '../../App';
import PaywallCard from '../components/PaywallCard';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const paymentFeatures = [
  { title: 'Full advisor-style analysis', detail: 'A plain-English memo explaining what the plan is saying and which area needs attention first.' },
  { title: 'Every planning module', detail: 'Taxes, Roth vs Traditional, mortgage readiness, car cost, insurance gaps, investing mix, and goal funding.' },
  { title: 'Weekly money moves', detail: 'A short checklist that turns the plan into practical actions for the next seven days.' },
  { title: 'Shareable plan snapshot', detail: 'A clean summary users can send to a partner, parent, accountant, or advisor.' },
];

export default function PaymentScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);
  const email = route.params?.email || '';
  const paymentApiUrl = appConfig.expo?.extra?.paymentApiUrl || '';

  async function startStripeCheckout() {
    if (!paymentApiUrl) {
      Alert.alert('Stripe not configured', 'Add expo.extra.paymentApiUrl and configure the backend Stripe Checkout endpoint.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(paymentApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout failed');
      await Linking.openURL(data.url);
    } catch {
      Alert.alert('Checkout unavailable', 'Stripe Checkout could not be started. Check the payment server configuration.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('Main')}>
          <Text style={styles.backText}>Back to dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stage}>
        <Text style={styles.kicker}>One-time unlock</Text>
        <Text style={styles.title}>Get the full Blacktip Wealth action plan.</Text>
        <Text style={styles.subtitle}>Pay once, unlock the parts that tell users exactly what to do next.</Text>

        <View style={styles.paywallWrap}>
          <PaywallCard
            title="Unlock full access"
            subtitle="For 99 cents, users get the full analysis layer, every planning module, weekly actions, and a shareable snapshot."
            features={paymentFeatures}
            buttonLabel="Unlock for $0.99"
            loading={loading}
            onUnlock={startStripeCheckout}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { minHeight: '100%', padding: 24, paddingTop: 28, paddingBottom: 90 },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  backButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: theme.colors.deepBlue, fontWeight: '900' },
  stage: { width: '100%', maxWidth: 760, alignSelf: 'center', marginTop: 22 },
  kicker: { color: theme.colors.primary, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 },
  title: { color: theme.colors.secondary, fontSize: 42, lineHeight: 48, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: theme.colors.text, fontSize: 18, lineHeight: 27, textAlign: 'center', marginTop: 12, marginBottom: 22 },
  paywallWrap: { width: '100%' },
});
