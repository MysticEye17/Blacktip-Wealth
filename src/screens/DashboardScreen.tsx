import React, { useCallback, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { buildRecommendations, emergencyFundTarget, money, monthlySurplus, netWorth, projectNetWorth, recommendedMonthlyPlan } from '../utils/calculations';
import { loadGoals, loadProfile } from '../utils/storage';
import { ClientProfile, Goal } from '../types';
import { defaultGoals, defaultProfile } from '../utils/defaultData';
import { theme } from '../utils/theme';

export default function DashboardScreen() {
  const [profile, setProfile] = useState<ClientProfile>(defaultProfile);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);

  useFocusEffect(useCallback(() => { loadProfile().then(setProfile); loadGoals().then(setGoals); }, []));

  const plan = recommendedMonthlyPlan(profile);
  const projection = projectNetWorth(profile, 10);
  const recs = buildRecommendations(profile, goals).slice(0, 3);
  const labels = projection.filter((_, i) => i % 2 === 0).map(p => `${p.year}`);
  const data = projection.filter((_, i) => i % 2 === 0).map(p => Math.round(p.netWorth / 1000));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title={`Hi, ${profile.name || 'there'}`} subtitle="Your most important money numbers and next steps." />
      <View style={styles.grid}>
        <Card style={styles.tile}><Text style={styles.kicker}>Net worth</Text><Text style={styles.big}>{money(netWorth(profile))}</Text></Card>
        <Card style={styles.tile}><Text style={styles.kicker}>Monthly surplus</Text><Text style={styles.big}>{money(monthlySurplus(profile))}</Text></Card>
      </View>
      <Card>
        <Text style={styles.cardTitle}>10-year projected net worth</Text>
        <LineChart
          data={{ labels, datasets: [{ data }] }}
          width={Dimensions.get('window').width - 58}
          height={220}
          yAxisSuffix="k"
          chartConfig={{ backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff', decimalPlaces: 0, color: () => theme.colors.primary, labelColor: () => theme.colors.muted, propsForDots: { r: '4' } }}
          bezier
          style={{ borderRadius: 16 }}
        />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Suggested monthly allocation</Text>
        <Row label="Emergency fund" value={money(plan.emergency)} />
        <Row label="Debt payoff" value={money(plan.debt)} />
        <Row label="Retirement" value={money(plan.retirement)} />
        <Row label="Taxable investing / goals" value={money(plan.taxable)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Top moves</Text>
        {recs.map((r, idx) => <View key={idx} style={styles.rec}><Text style={styles.recTitle}>{r.priority}: {r.title}</Text><Text style={styles.recText}>{r.action}</Text></View>)}
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Emergency fund check</Text>
        <Text style={styles.paragraph}>Target: {money(emergencyFundTarget(profile))}. Current cash: {money(profile.cashSavings)}.</Text>
      </Card>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}/mo</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: 18, paddingTop: 56 },
  grid: { flexDirection: 'row', gap: 12 }, tile: { flex: 1 }, kicker: { color: theme.colors.muted, fontWeight: '800' }, big: { color: theme.colors.secondary, fontSize: 24, fontWeight: '900', marginTop: 8 },
  cardTitle: { fontSize: 18, color: theme.colors.secondary, fontWeight: '900', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, label: { color: theme.colors.text, fontWeight: '700' }, value: { color: theme.colors.primary, fontWeight: '900' },
  rec: { marginBottom: 12 }, recTitle: { fontWeight: '900', color: theme.colors.secondary }, recText: { color: theme.colors.muted, marginTop: 4, lineHeight: 20 }, paragraph: { color: theme.colors.text, lineHeight: 22 },
});
