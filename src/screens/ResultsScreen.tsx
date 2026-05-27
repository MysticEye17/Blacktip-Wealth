import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { ClientProfile, Goal } from '../types';
import { defaultGoals, defaultProfile } from '../utils/defaultData';
import { buildRecommendations, money, recommendedMonthlyPlan, riskAllocation } from '../utils/calculations';
import { loadGoals, loadProfile } from '../utils/storage';
import { explainWithAI } from '../utils/ai';
import { theme } from '../utils/theme';

export default function ResultsScreen() {
  const [profile, setProfile] = useState<ClientProfile>(defaultProfile);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => { loadProfile().then(setProfile); loadGoals().then(setGoals); }, []));
  const recs = buildRecommendations(profile, goals);
  const plan = recommendedMonthlyPlan(profile);
  const allocation = riskAllocation(profile);

  async function getAiExplanation() {
    setLoading(true);
    try { setAiText(await explainWithAI(profile, goals, recs)); }
    catch { setAiText('AI explanation failed. Check your backend proxy URL and server logs.'); }
    finally { setLoading(false); }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Results" subtitle="Specific actions based on your profile. This is the screen users will come back to after changing inputs." />
      <Card>
        <Text style={styles.cardTitle}>Plan summary</Text>
        <Text style={styles.text}>Monthly surplus available: {money(plan.surplus)}</Text>
        <Text style={styles.text}>Target allocation: {allocation.stock}% stocks · {allocation.bonds}% bonds · {allocation.cash}% cash</Text>
        <Text style={styles.disclaimer}>Educational only. Confirm tax, legal, investment, and insurance decisions with licensed professionals.</Text>
      </Card>
      {recs.map((rec, idx) => (
        <Card key={`${rec.title}-${idx}`}>
          <Text style={styles.meta}>{rec.category} · {rec.priority} priority</Text>
          <Text style={styles.recTitle}>{rec.title}</Text>
          <Text style={styles.text}>{rec.explanation}</Text>
          <Text style={styles.action}>Action: {rec.action}</Text>
        </Card>
      ))}
      <TouchableOpacity style={styles.button} onPress={getAiExplanation} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate plain-English AI explanation</Text>}
      </TouchableOpacity>
      {aiText ? <Card><Text style={styles.cardTitle}>AI explanation</Text><Text style={styles.text}>{aiText}</Text></Card> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: 18, paddingTop: 56, paddingBottom: 100 }, cardTitle: { fontSize: 18, color: theme.colors.secondary, fontWeight: '900', marginBottom: 12 }, text: { color: theme.colors.text, lineHeight: 22, marginBottom: 8 }, disclaimer: { color: theme.colors.muted, lineHeight: 20, marginTop: 8 }, meta: { color: theme.colors.primary, fontWeight: '900', marginBottom: 8 }, recTitle: { color: theme.colors.secondary, fontSize: 20, fontWeight: '900', marginBottom: 8 }, action: { color: theme.colors.success, fontWeight: '800', lineHeight: 22, marginTop: 6 }, button: { backgroundColor: theme.colors.primary, borderRadius: 18, padding: 16, alignItems: 'center', marginBottom: 16 }, buttonText: { color: '#fff', fontWeight: '900' } });
