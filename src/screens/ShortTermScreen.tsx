import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { ClientProfile, Goal, Recommendation } from '../types';
import { defaultGoals, defaultProfile } from '../utils/defaultData';
import { buildPlanningModules, buildRecommendations, emergencyFundTarget, money, monthlySurplus, recommendedMonthlyPlan } from '../utils/calculations';
import { weeklySuggestionsWithAI } from '../utils/ai';
import { loadGoals, loadProfile } from '../utils/storage';
import { theme } from '../utils/theme';

export default function ShortTermScreen() {
  const [profile, setProfile] = useState<ClientProfile>(defaultProfile);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    loadProfile().then(setProfile);
    loadGoals().then(setGoals);
  }, []));

  const plan = recommendedMonthlyPlan(profile);
  const recs = useMemo(() => buildRecommendations(profile, goals), [profile, goals]);
  const modules = useMemo(() => buildPlanningModules(profile, goals), [profile, goals]);
  const weekly = buildWeeklyActions(profile, goals, recs);

  async function generateWeeklyPlan() {
    setLoading(true);
    try {
      setAiText(await weeklySuggestionsWithAI(profile, goals, recs, modules));
    } catch {
      setAiText('The AI suggestion layer did not respond. The weekly checklist below is still available; check the backend proxy URL, API key, and server logs.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Short-Term Suggestions" subtitle="Weekly actions focused on the next small decisions: cash flow, goals, debt, insurance, and lifestyle spending." />

      <Card style={styles.hero}>
        <Text style={styles.overline}>This week</Text>
        <Text style={styles.heroTitle}>{money(Math.max(0, plan.surplus))} available monthly surplus</Text>
        <Text style={styles.heroText}>Use the checklist below to turn the broader plan into a few concrete moves for the next seven days.</Text>
      </Card>

      <View style={styles.grid}>
        {weekly.map((item, index) => (
          <Card key={item.title} style={styles.actionCard}>
            <Text style={styles.step}>Step {index + 1}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.text}>{item.detail}</Text>
          </Card>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={generateWeeklyPlan} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Generate AI weekly suggestions</Text>}
      </TouchableOpacity>

      {aiText ? (
        <Card>
          <Text style={styles.cardTitle}>AI weekly advisor note</Text>
          <Text style={styles.aiText}>{aiText}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function buildWeeklyActions(profile: ClientProfile, goals: Goal[], recs: Recommendation[]) {
  const cashGap = Math.max(0, emergencyFundTarget(profile) - profile.cashSavings);
  const topGoal = goals.find(goal => goal.priority === 'high') || goals[0];
  return [
    {
      title: cashGap > 0 ? 'Move money into emergency cash' : 'Keep emergency cash separate',
      detail: cashGap > 0 ? `You are ${money(cashGap)} short of the current cash target. Schedule a transfer before adding new lifestyle spending.` : 'Your emergency reserve looks funded. Keep it separate from travel, car, and purchase goals.',
    },
    {
      title: recs[0]?.title || 'Review the highest-value move',
      detail: recs[0]?.action || 'Spend 15 minutes checking the current top recommendation and deciding the next action.',
    },
    {
      title: topGoal ? `Check ${topGoal.name}` : 'Add one dated goal',
      detail: topGoal ? `Confirm the target date, current balance, and monthly transfer for this goal.` : 'Create one goal with a target date so the plan can price the monthly savings need.',
    },
    {
      title: monthlySurplus(profile) < 0 ? 'Repair negative cash flow' : 'Review one recurring bill',
      detail: monthlySurplus(profile) < 0 ? `Cash flow is negative by about ${money(Math.abs(monthlySurplus(profile)))} per month. Pick one expense to pause or reduce this week.` : 'Choose one subscription, insurance policy, or loan payment to review for savings.',
    },
  ];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingTop: 34, paddingBottom: 104 },
  hero: { backgroundColor: theme.colors.deepBlue },
  overline: { color: theme.colors.seafoam, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  heroTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', lineHeight: 34, marginTop: 8 },
  heroText: { color: '#D6E7F0', lineHeight: 22, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { width: '100%' },
  step: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: theme.colors.secondary, fontSize: 19, fontWeight: '900', marginTop: 8, marginBottom: 8 },
  text: { color: theme.colors.text, lineHeight: 22 },
  button: { backgroundColor: theme.colors.deepBlue, borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#FFFFFF', fontWeight: '900' },
  aiText: { color: theme.colors.text, lineHeight: 23 },
});
