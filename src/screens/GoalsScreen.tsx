import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import Field from '../components/Field';
import Pill from '../components/Pill';
import SectionHeader from '../components/SectionHeader';
import { Goal } from '../types';
import { defaultGoals } from '../utils/defaultData';
import { money } from '../utils/calculations';
import { loadGoals, saveGoals } from '../utils/storage';
import { theme } from '../utils/theme';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [draft, setDraft] = useState<Goal>({ id: Date.now().toString(), name: '', targetAmount: 0, currentAmount: 0, years: 1, priority: 'medium' });
  useEffect(() => { loadGoals().then(setGoals); }, []);

  async function persist(next: Goal[]) { setGoals(next); await saveGoals(next); }
  function addGoal() {
    if (!draft.name || draft.targetAmount <= 0) return Alert.alert('Missing info', 'Add a goal name and target amount.');
    persist([...goals, { ...draft, id: Date.now().toString() }]);
    setDraft({ id: Date.now().toString(), name: '', targetAmount: 0, currentAmount: 0, years: 1, priority: 'medium' });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Goals" subtitle="Create buckets for the short term, 1 year, 2 years, 3 years, 4 years, and long term." />
      <Card>
        <Text style={styles.cardTitle}>Add a goal</Text>
        <Field label="Goal name" value={draft.name} keyboardType="default" onChangeText={name => setDraft(d => ({...d, name}))} />
        <Field label="Target amount" value={String(draft.targetAmount)} onChangeText={v => setDraft(d => ({...d, targetAmount: Number(v) || 0}))} />
        <Field label="Current amount" value={String(draft.currentAmount)} onChangeText={v => setDraft(d => ({...d, currentAmount: Number(v) || 0}))} />
        <Field label="Years to goal" value={String(draft.years)} onChangeText={v => setDraft(d => ({...d, years: Number(v) || 1}))} />
        <Text style={styles.label}>Priority</Text><View style={styles.wrap}>{(['low','medium','high'] as const).map(p => <Pill key={p} label={p} active={draft.priority === p} onPress={() => setDraft(d => ({...d, priority: p}))} />)}</View>
        <TouchableOpacity style={styles.button} onPress={addGoal}><Text style={styles.buttonText}>Add goal</Text></TouchableOpacity>
      </Card>
      {goals.map(goal => {
        const progress = Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100));
        const monthly = Math.max(0, (goal.targetAmount - goal.currentAmount) / Math.max(1, goal.years * 12));
        return <Card key={goal.id}><View style={styles.goalTop}><Text style={styles.goalTitle}>{goal.name}</Text><Text style={styles.badge}>{goal.priority}</Text></View><Text style={styles.text}>{money(goal.currentAmount)} saved of {money(goal.targetAmount)} · {progress}%</Text><Text style={styles.text}>Needed: {money(monthly)} per month for {goal.years} year(s)</Text><TouchableOpacity onPress={() => persist(goals.filter(g => g.id !== goal.id))}><Text style={styles.delete}>Delete</Text></TouchableOpacity></Card>;
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: 18, paddingTop: 56, paddingBottom: 100 }, cardTitle: { fontSize: 18, color: theme.colors.secondary, fontWeight: '900', marginBottom: 12 }, label: { color: theme.colors.secondary, fontWeight: '800', marginBottom: 8 }, wrap: { flexDirection: 'row', flexWrap: 'wrap' }, button: { backgroundColor: theme.colors.primary, borderRadius: 16, padding: 15, alignItems: 'center', marginTop: 8 }, buttonText: { color: '#fff', fontWeight: '900' }, goalTop: { flexDirection: 'row', justifyContent: 'space-between' }, goalTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.secondary }, badge: { color: theme.colors.primary, fontWeight: '900' }, text: { color: theme.colors.muted, marginTop: 8 }, delete: { color: theme.colors.danger, fontWeight: '900', marginTop: 12 } });
