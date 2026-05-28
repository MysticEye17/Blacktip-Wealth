import React, { useCallback, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import Card from '../components/Card';
import PaywallCard from '../components/PaywallCard';
import SectionHeader from '../components/SectionHeader';
import { buildPlanningModules, buildRecommendations, emergencyFundTarget, grossHouseholdIncome, money, monthlySurplus, netWorth, planScores, projectNetWorth, recommendedMonthlyPlan, retirementRate } from '../utils/calculations';
import { loadGoals, loadPremiumAccess, loadProfile, savePremiumAccess } from '../utils/storage';
import { ClientProfile, Goal } from '../types';
import { defaultGoals, defaultProfile } from '../utils/defaultData';
import { theme } from '../utils/theme';

const priorityColor = { High: theme.colors.danger, Medium: theme.colors.warning, Low: theme.colors.success };
const num = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : 0;

export default function DashboardScreen() {
  const [profile, setProfile] = useState<ClientProfile>(defaultProfile);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [hasPremium, setHasPremium] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const chartWidth = Math.min(width - 72, 900);

  useFocusEffect(useCallback(() => {
    loadProfile().then(setProfile);
    loadGoals().then(setGoals);
    loadPremiumAccess().then(setHasPremium);
  }, []));

  const plan = recommendedMonthlyPlan(profile);
  const projection = projectNetWorth(profile, 10);
  const recs = buildRecommendations(profile, goals);
  const visibleRecs = hasPremium ? recs.slice(0, 4) : recs.slice(0, 2);
  const scores = planScores(profile);
  const modules = hasPremium ? buildPlanningModules(profile, goals).slice(0, 4) : [];
  const sampledProjection = projection.filter((_, i) => i % 2 === 0);
  const labels = sampledProjection.map(p => `${p.year}`);
  const data = sampledProjection.map(p => Math.round(p.netWorth / 1000));
  const starting = projection[0];
  const ending = projection[projection.length - 1];
  const projectedGain = ending.netWorth - starting.netWorth;
  const cashGap = Math.max(0, emergencyFundTarget(profile) - num(profile.cashSavings));

  async function unlockPremium() {
    await savePremiumAccess(true);
    setHasPremium(true);
  }

  async function restorePremium() {
    setHasPremium(await loadPremiumAccess());
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title={`Hi, ${profile.name || 'there'}`} subtitle="A professional view of cash flow, debt pressure, tax exposure, goals, and long-term wealth trajectory." />

      <View style={[styles.heroPanel, !isWide && styles.heroPanelCompact]}>
        <View style={styles.heroCopy}>
          <Text style={styles.overline}>Plan strength</Text>
          <Text style={styles.heroNumber}>{scores.overall}</Text>
          <Text style={styles.heroText}>Overall score out of 100, based on liquidity, debt, retirement progress, housing readiness, and tax withholding.</Text>
        </View>
        <View style={[styles.heroDivider, !isWide && styles.heroDividerCompact]} />
        <View style={styles.heroCopy}>
          <Text style={styles.overline}>Highest priority</Text>
          <Text style={styles.heroTitle}>{visibleRecs[0]?.title || 'Keep the plan funded'}</Text>
          <Text style={styles.heroText}>{visibleRecs[0]?.action || 'Maintain savings automation and review the plan after income or goal changes.'}</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <Metric label="Monthly surplus" value={money(monthlySurplus(profile))} note="After estimated federal and payroll taxes, retirement, car payment, expenses, and family support" tone="primary" isWide={isWide} />
        <Metric label="Net worth" value={money(netWorth(profile))} note="Assets minus listed debt" tone="blue" isWide={isWide} />
        <Metric label="Cash runway" value={`${(num(profile.cashSavings) / Math.max(1, num(profile.monthlyExpenses))).toFixed(1)} mo.`} note={cashGap ? `${money(cashGap)} left to target` : 'Emergency reserve funded'} tone="gold" isWide={isWide} />
        <Metric label="Retirement rate" value={`${Math.round(retirementRate(profile) * 100)}%`} note={`Of ${money(grossHouseholdIncome(profile))} household income`} tone="green" isWide={isWide} />
      </View>

      <Card>
        <View style={styles.commandTop}>
          <View>
            <Text style={styles.overline}>Decision dashboard</Text>
            <Text style={styles.cardTitle}>Financial readiness by category</Text>
          </View>
          <Text style={styles.overall}>Overall {scores.overall}/100</Text>
        </View>
        <View style={styles.scoreGrid}>
          <ScoreCard label="Cash health" value={scores.cash} insight={num(profile.cashSavings) < emergencyFundTarget(profile) ? 'Build liquidity first' : 'Reserve looks stable'} />
          <ScoreCard label="Debt risk" value={scores.debt} insight={num(profile.debtRate) >= 7 ? 'APR drag is material' : 'Debt pressure manageable'} />
          <ScoreCard label="Future wealth" value={scores.future} insight={retirementRate(profile) < 0.15 ? 'Savings rate needs lift' : 'Good retirement pace'} />
          <ScoreCard label="Housing readiness" value={scores.housing} insight="Stress tested against income" />
        </View>
      </Card>

      <Card>
        <View style={styles.commandTop}>
          <View>
            <Text style={styles.overline}>10-year projection</Text>
            <Text style={styles.cardTitle}>Projected net worth path</Text>
          </View>
          <Text style={styles.gain}>{money(projectedGain)} gain</Text>
        </View>
        <LineChart
          data={{ labels, datasets: [{ data }] }}
          width={chartWidth}
          height={238}
          yAxisSuffix="k"
          chartConfig={{
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 0,
            color: () => theme.colors.primary,
            labelColor: () => theme.colors.muted,
            propsForBackgroundLines: { stroke: theme.colors.hairline },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#FFFFFF' },
          }}
          bezier
          style={styles.lineChart}
        />
        <View style={styles.insightGrid}>
          <Insight label="Starting point" value={money(starting.netWorth)} />
          <Insight label="Year 10 estimate" value={money(ending.netWorth)} />
          <Insight label="Primary driver" value={plan.retirement > plan.taxable ? 'Retirement contributions' : 'Taxable investing'} />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Suggested monthly allocation</Text>
        <ContributionBars values={[
          { label: 'Emergency', value: plan.emergency, color: theme.colors.primary },
          { label: 'Debt', value: plan.debt, color: theme.colors.danger },
          { label: 'Retirement', value: plan.retirement, color: theme.colors.success },
          { label: 'Goals', value: plan.taxable, color: theme.colors.accent },
        ]} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Top moves</Text>
        {visibleRecs.map((r, idx) => (
          <View key={`${r.title}-${idx}`} style={styles.rec}>
            <View style={styles.recTop}>
              <Text style={[styles.priority, { color: priorityColor[r.priority] }]}>{r.priority}</Text>
              <Text style={styles.recCategory}>{r.category}</Text>
            </View>
            <Text style={styles.recTitle}>{r.title}</Text>
            <Text style={styles.recText}>{r.action}</Text>
          </View>
        ))}
      </Card>

      {!hasPremium ? (
        <PaywallCard
          compact
          title="Unlock the full action plan"
          subtitle="Open every recommendation, detailed module, weekly move, and shareable snapshot."
          onUnlock={unlockPremium}
          onRestore={restorePremium}
        />
      ) : (
        <View style={styles.modulePreview}>
          {modules.map(module => (
            <Card key={module.id} style={[styles.moduleTile, !isWide && styles.moduleTileCompact]}>
              <Text style={styles.moduleCategory}>{module.category}</Text>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleMetric}>{module.metric}</Text>
              <Text style={styles.moduleText}>{module.nextMove}</Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Metric({ label, value, note, tone, isWide }: { label: string; value: string; note: string; tone: 'primary' | 'blue' | 'gold' | 'green'; isWide: boolean }) {
  const color = tone === 'primary' ? theme.colors.primary : tone === 'blue' ? theme.colors.deepBlue : tone === 'gold' ? theme.colors.accent : theme.colors.success;
  return (
    <Card style={[styles.metricTile, !isWide && styles.metricTileCompact]}>
      <View style={[styles.metricRule, { backgroundColor: color }]} />
      <Text style={styles.kicker}>{label}</Text>
      <Text style={[styles.big, { color }]}>{value}</Text>
      <Text style={styles.note}>{note}</Text>
    </Card>
  );
}

function ScoreCard({ label, value, insight }: { label: string; value: number; insight: string }) {
  const rounded = Math.round(value);
  const color = rounded < 50 ? theme.colors.danger : rounded < 75 ? theme.colors.warning : theme.colors.success;
  return (
    <View style={styles.scoreCard}>
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={[styles.scoreNumber, { color }]}>{rounded}</Text>
      </View>
      <View style={styles.scoreTrack}><View style={[styles.scoreFill, { width: `${rounded}%`, backgroundColor: color }]} /></View>
      <Text style={styles.scoreInsight}>{insight}</Text>
    </View>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.insight}>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.insightValue}>{value}</Text>
    </View>
  );
}

function ContributionBars({ values }: { values: { label: string; value: number; color: string }[] }) {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  return (
    <View>
      <View style={styles.allocationTrack}>
        {values.map(item => (
          <View key={item.label} style={{ width: `${total ? item.value / total * 100 : 0}%`, backgroundColor: item.color }} />
        ))}
      </View>
      {values.map(item => (
        <View key={item.label} style={styles.allocationRow}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{money(item.value)}/mo</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingTop: 34, paddingBottom: 104 },
  heroPanel: { backgroundColor: theme.colors.deepBlue, borderRadius: 8, padding: 20, marginBottom: 16, flexDirection: 'row', gap: 18 },
  heroPanelCompact: { flexDirection: 'column' },
  heroCopy: { flex: 1 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
  heroDividerCompact: { width: '100%', height: 1 },
  overline: { color: theme.colors.primary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0, fontSize: 12 },
  heroNumber: { color: '#FFFFFF', fontSize: 58, fontWeight: '900', lineHeight: 64, marginTop: 4 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', lineHeight: 29, marginTop: 8 },
  heroText: { color: '#C9D5E2', lineHeight: 21, marginTop: 8 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricTile: { width: '48%', minHeight: 150, position: 'relative' },
  metricTileCompact: { width: '100%' },
  metricRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  kicker: { color: theme.colors.muted, fontWeight: '900' },
  big: { fontSize: 25, fontWeight: '900', marginTop: 10 },
  note: { color: theme.colors.muted, lineHeight: 19, marginTop: 8 },
  commandTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  overall: { color: theme.colors.deepBlue, backgroundColor: theme.colors.panel, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', fontWeight: '900' },
  gain: { color: theme.colors.success, backgroundColor: '#E9F5EF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', fontWeight: '900' },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scoreCard: { flexGrow: 1, flexBasis: '47%', backgroundColor: theme.colors.panel, borderRadius: 8, padding: 14 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  scoreLabel: { color: theme.colors.secondary, fontWeight: '900' },
  scoreNumber: { fontWeight: '900' },
  scoreTrack: { height: 8, backgroundColor: '#DFE7EC', borderRadius: 999, marginTop: 10, overflow: 'hidden' },
  scoreFill: { height: '100%' },
  scoreInsight: { color: theme.colors.muted, marginTop: 10, lineHeight: 19 },
  cardTitle: { fontSize: 19, color: theme.colors.secondary, fontWeight: '900', marginBottom: 12 },
  lineChart: { borderRadius: 8, alignSelf: 'center' },
  insightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  insight: { flexGrow: 1, flexBasis: '30%', minWidth: 130, backgroundColor: theme.colors.panel, borderRadius: 8, padding: 12 },
  insightLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '800' },
  insightValue: { color: theme.colors.secondary, fontWeight: '900', marginTop: 5 },
  allocationTrack: { height: 14, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', backgroundColor: theme.colors.panel, marginBottom: 14 },
  allocationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline },
  dot: { width: 10, height: 10, borderRadius: 999, marginRight: 10 },
  label: { color: theme.colors.text, fontWeight: '800', flex: 1 },
  value: { color: theme.colors.secondary, fontWeight: '900' },
  rec: { borderTopWidth: 1, borderTopColor: theme.colors.hairline, paddingTop: 14, marginTop: 2, marginBottom: 12 },
  recTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priority: { fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  recCategory: { color: theme.colors.muted, fontWeight: '800' },
  recTitle: { fontWeight: '900', color: theme.colors.secondary, fontSize: 17 },
  recText: { color: theme.colors.muted, marginTop: 5, lineHeight: 21 },
  modulePreview: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleTile: { width: '48%' },
  moduleTileCompact: { width: '100%' },
  moduleCategory: { color: theme.colors.primary, fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  moduleTitle: { color: theme.colors.secondary, fontWeight: '900', fontSize: 17, marginTop: 8 },
  moduleMetric: { color: theme.colors.accent, fontWeight: '900', fontSize: 20, marginTop: 8 },
  moduleText: { color: theme.colors.muted, lineHeight: 21, marginTop: 8 },
});
