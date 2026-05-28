import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import PaywallCard from '../components/PaywallCard';
import SectionHeader from '../components/SectionHeader';
import { ClientProfile, Goal, PlanningModule, Recommendation } from '../types';
import { defaultGoals, defaultProfile } from '../utils/defaultData';
import { buildPlanningModules, buildRecommendations, money, projectNetWorth, recommendedMonthlyPlan, riskAllocation } from '../utils/calculations';
import { loadGoals, loadPremiumAccess, loadProfile, savePremiumAccess } from '../utils/storage';
import { explainWithAI } from '../utils/ai';
import { theme } from '../utils/theme';

export default function ResultsScreen() {
  const [profile, setProfile] = useState<ClientProfile>(defaultProfile);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);

  useFocusEffect(useCallback(() => {
    loadProfile().then(setProfile);
    loadGoals().then(setGoals);
    loadPremiumAccess().then(setHasPremium);
  }, []));

  const recs = buildRecommendations(profile, goals);
  const modules = buildPlanningModules(profile, goals);
  const projection = projectNetWorth(profile, 10);
  const plan = recommendedMonthlyPlan(profile);
  const allocation = riskAllocation(profile);
  const weakest = [...modules].sort((a, b) => a.score - b.score)[0];
  const strongest = [...modules].sort((a, b) => b.score - a.score)[0];
  const ending = projection[projection.length - 1];

  async function getAiExplanation() {
    setLoading(true);
    try { setAiText(await explainWithAI(profile, goals, recs, modules, projection)); }
    catch { setAiText('The OpenAI analysis layer did not respond. The built-in calculation summary above is still available; check the backend proxy URL, API key, and server logs.'); }
    finally { setLoading(false); }
  }

  async function unlockPremium() {
    await savePremiumAccess(true);
    setHasPremium(true);
  }

  async function restorePremium() {
    setHasPremium(await loadPremiumAccess());
  }

  async function sharePlanSnapshot() {
    const text = [
      'Blacktip Wealth Plan Snapshot',
      '',
      `Monthly surplus: ${money(plan.surplus)}`,
      `10-year projection: ${money(ending.netWorth)}`,
      `Strongest area: ${strongest?.title || 'N/A'}`,
      `Needs attention: ${weakest?.title || 'N/A'}`,
      `Top move: ${recs[0]?.action || 'Keep the plan current.'}`,
      '',
      'Educational only. Not tax, legal, investment, insurance, or financial advice.',
    ].join('\n');

    await Share.share({ title: 'Blacktip Wealth Plan Snapshot', message: text });
  }

  if (!hasPremium) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <SectionHeader title="Analysis" subtitle="A full action plan with advisor-style interpretation, planning modules, weekly moves, and a shareable snapshot." />

        <Card style={styles.previewCard}>
          <Text style={styles.overline}>Preview</Text>
          <Text style={styles.previewTitle}>Your top signal is ready</Text>
          <Text style={styles.previewText}>
            The plan currently prioritizes {recs[0]?.category.toLowerCase() || 'cash flow'} because that is where the next dollar can do the most work.
          </Text>
          <View style={styles.previewGrid}>
            <Snapshot label="Monthly surplus" value={money(plan.surplus)} />
            <Snapshot label="10-year estimate" value={money(ending.netWorth)} />
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Locked analysis</Text>
          {recs.slice(0, 2).map((rec, idx) => <RecommendationRow key={`${rec.title}-${idx}`} rec={rec} />)}
        </Card>

        <PaywallCard onUnlock={unlockPremium} onRestore={restorePremium} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Analysis" subtitle="A deeper interpretation of the calculations, chart movement, module scores, recommendations, and next steps." />

      <Card style={styles.memoCard}>
        <Text style={styles.overline}>Advisor memo</Text>
        <Text style={styles.memoTitle}>What the plan is saying</Text>
        <Text style={styles.memoText}>
          The current plan has a monthly surplus of {money(plan.surplus)}. The system is prioritizing {recs[0]?.category.toLowerCase() || 'cash flow'} because that is where the next dollar can do the most work right now.
        </Text>
        <Text style={styles.memoText}>
          The 10-year projection ends near {money(ending.netWorth)}, but that path depends on keeping emergency savings, high-interest debt, and retirement contributions in balance instead of chasing one metric alone.
        </Text>
        <View style={styles.memoGrid}>
          <MemoStat label="Strongest area" value={strongest?.title || 'N/A'} />
          <MemoStat label="Needs attention" value={weakest?.title || 'N/A'} />
          <MemoStat label="Allocation" value={`${allocation.stock}% stock / ${allocation.bonds}% bond / ${allocation.cash}% cash`} />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Calculation snapshot</Text>
        <View style={styles.snapshotGrid}>
          <Snapshot label="Monthly surplus" value={money(plan.surplus)} />
          <Snapshot label="Emergency cash" value={money(plan.emergency)} />
          <Snapshot label="Debt payoff" value={money(plan.debt)} />
          <Snapshot label="Retirement" value={money(plan.retirement)} />
        </View>
        <Text style={styles.disclaimer}>Educational only. Confirm tax, legal, investment, and insurance decisions with licensed professionals.</Text>
      </Card>

      <Card>
        <View style={styles.sectionTop}>
          <Text style={styles.cardTitle}>Module interpretation</Text>
          <Text style={styles.count}>{modules.length} modules</Text>
        </View>
        {modules.slice(0, 7).map(module => <ModuleRow key={module.id} module={module} />)}
      </Card>

      <Card>
        <View style={styles.sectionTop}>
          <Text style={styles.cardTitle}>Priority recommendations</Text>
          <Text style={styles.count}>{recs.length} moves</Text>
        </View>
        {recs.slice(0, 6).map((rec, idx) => <RecommendationRow key={`${rec.title}-${idx}`} rec={rec} />)}
      </Card>

      <TouchableOpacity style={styles.shareButton} onPress={sharePlanSnapshot}>
        <Text style={styles.shareButtonText}>Share plan snapshot</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={getAiExplanation} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate OpenAI-enhanced explanation</Text>}
      </TouchableOpacity>
      {aiText ? <Card><Text style={styles.cardTitle}>Enhanced explanation</Text><Text style={styles.textBlock}>{aiText}</Text></Card> : null}
    </ScrollView>
  );
}

function MemoStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.memoStat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.snapshot}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.snapshotValue}>{value}</Text>
    </View>
  );
}

function ModuleRow({ module }: { module: PlanningModule }) {
  const color = module.score < 50 ? theme.colors.danger : module.score < 75 ? theme.colors.warning : theme.colors.success;
  return (
    <View style={styles.moduleRow}>
      <View style={styles.rowTop}>
        <Text style={styles.meta}>{module.category}</Text>
        <Text style={[styles.score, { color }]}>{Math.round(module.score)}/100</Text>
      </View>
      <Text style={styles.recTitle}>{module.title}</Text>
      <Text style={styles.text}>{module.summary}</Text>
      <Text style={styles.action}>{module.nextMove}</Text>
    </View>
  );
}

function RecommendationRow({ rec }: { rec: Recommendation }) {
  const color = rec.priority === 'High' ? theme.colors.danger : rec.priority === 'Medium' ? theme.colors.warning : theme.colors.success;
  return (
    <View style={styles.moduleRow}>
      <View style={styles.rowTop}>
        <Text style={styles.meta}>{rec.category}</Text>
        <Text style={[styles.score, { color }]}>{rec.priority}</Text>
      </View>
      <Text style={styles.recTitle}>{rec.title}</Text>
      <Text style={styles.text}>{rec.explanation}</Text>
      <Text style={styles.action}>{rec.action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingTop: 34, paddingBottom: 104 },
  memoCard: { backgroundColor: theme.colors.deepBlue },
  overline: { color: '#94D2BD', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0, fontSize: 12 },
  memoTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', lineHeight: 31, marginTop: 8, marginBottom: 12 },
  memoText: { color: '#D3DEE9', lineHeight: 23, marginBottom: 10 },
  memoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  memoStat: { flexGrow: 1, flexBasis: '30%', minWidth: 150, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 },
  previewCard: { backgroundColor: theme.colors.deepBlue },
  previewTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', lineHeight: 34, marginTop: 8, marginBottom: 10 },
  previewText: { color: '#D3DEE9', lineHeight: 23, marginBottom: 14 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardTitle: { fontSize: 19, color: theme.colors.secondary, fontWeight: '900', marginBottom: 12 },
  snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  snapshot: { flexGrow: 1, flexBasis: '46%', backgroundColor: theme.colors.panel, borderRadius: 8, padding: 12 },
  statLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '800' },
  statValue: { color: '#FFFFFF', fontWeight: '900', marginTop: 6 },
  snapshotValue: { color: theme.colors.secondary, fontWeight: '900', fontSize: 18, marginTop: 6 },
  disclaimer: { color: theme.colors.muted, lineHeight: 20, marginTop: 14 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  count: { color: theme.colors.primary, backgroundColor: theme.colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontWeight: '900' },
  moduleRow: { borderTopWidth: 1, borderTopColor: theme.colors.hairline, paddingTop: 14, marginTop: 2, marginBottom: 14 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  meta: { color: theme.colors.primary, fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  score: { fontWeight: '900' },
  recTitle: { color: theme.colors.secondary, fontSize: 18, fontWeight: '900', marginBottom: 7 },
  text: { color: theme.colors.text, lineHeight: 22, marginBottom: 8 },
  action: { color: theme.colors.success, fontWeight: '800', lineHeight: 22 },
  textBlock: { color: theme.colors.text, lineHeight: 23 },
  button: { backgroundColor: theme.colors.deepBlue, borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '900' },
  shareButton: { backgroundColor: theme.colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 12 },
  shareButtonText: { color: '#FFFFFF', fontWeight: '900' },
});
