import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import Field from '../components/Field';
import Pill from '../components/Pill';
import SectionHeader from '../components/SectionHeader';
import { Goal, GoalType } from '../types';
import { defaultGoals } from '../utils/defaultData';
import { money } from '../utils/calculations';
import { loadGoals, saveGoals } from '../utils/storage';
import { theme } from '../utils/theme';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [draft, setDraft] = useState<Goal>({ id: Date.now().toString(), name: '', type: 'savings', targetAmount: 0, currentAmount: 0, years: 1, targetDate: dateFromMonths(12), priority: 'medium' });
  const [dateOpen, setDateOpen] = useState(false);
  useEffect(() => { loadGoals().then(setGoals); }, []);

  async function persist(next: Goal[]) { setGoals(next); await saveGoals(next); }
  function addGoal() {
    if (!draft.name || draft.targetAmount <= 0) return Alert.alert('Missing info', 'Add a goal name and target amount.');
    if (!isValidDate(draft.targetDate)) return Alert.alert('Check the date', 'Use a target date like 2027-05-27.');
    persist([...goals, { ...draft, id: Date.now().toString() }]);
    setDraft({ id: Date.now().toString(), name: '', type: 'savings', targetAmount: 0, currentAmount: 0, years: 1, targetDate: dateFromMonths(12), priority: 'medium' });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Goals" subtitle="Create buckets for short-term needs, 1-year targets, multi-year purchases, and long-term wealth milestones." />
      <Card>
        <Text style={styles.cardTitle}>Add a goal</Text>
        <Field label="Goal name" value={draft.name} keyboardType="default" onChangeText={name => setDraft(d => ({ ...d, name }))} />
        <Text style={styles.label}>Goal type</Text>
        <View style={styles.wrap}>{(['savings', 'purchase', 'vacation'] as GoalType[]).map(type => <Pill key={type} label={type} active={draft.type === type} onPress={() => setDraft(d => ({ ...d, type }))} />)}</View>
        <Field label="Target amount" value={String(draft.targetAmount)} onChangeText={v => setDraft(d => ({ ...d, targetAmount: Number(v) || 0 }))} />
        <Field label="Current amount" value={String(draft.currentAmount)} onChangeText={v => setDraft(d => ({ ...d, currentAmount: Number(v) || 0 }))} />
        <Text style={styles.label}>Target date</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setDateOpen(true)}>
          <Text style={styles.dateText}>{formatDateLabel(draft.targetDate)}</Text>
          <Text style={styles.dateChevron}>Open date menu</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.wrap}>{(['low', 'medium', 'high'] as const).map(p => <Pill key={p} label={p} active={draft.priority === p} onPress={() => setDraft(d => ({ ...d, priority: p }))} />)}</View>
        <TouchableOpacity style={styles.button} onPress={addGoal}><Text style={styles.buttonText}>Add goal</Text></TouchableOpacity>
      </Card>
      {goals.map(goal => {
        const progress = Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100));
        const monthly = Math.max(0, (goal.targetAmount - goal.currentAmount) / Math.max(1, monthsUntil(goal.targetDate)));
        return (
          <Card key={goal.id}>
            <View style={styles.goalTop}>
              <Text style={styles.goalTitle}>{goal.name}</Text>
              <Text style={styles.badge}>{goal.priority}</Text>
            </View>
            <Text style={styles.type}>{goal.type} by {formatDateLabel(goal.targetDate)}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
            <Text style={styles.text}>{money(goal.currentAmount)} saved of {money(goal.targetAmount)} - {progress}%</Text>
            <Text style={styles.text}>Needed: {money(monthly)} per month through the target date</Text>
            <TouchableOpacity onPress={() => persist(goals.filter(g => g.id !== goal.id))}><Text style={styles.delete}>Delete</Text></TouchableOpacity>
          </Card>
        );
      })}
      <Modal visible={dateOpen} animationType="fade" transparent onRequestClose={() => setDateOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Choose a target date</Text>
            <Field label="Date" value={draft.targetDate} keyboardType="default" onChangeText={targetDate => setDraft(d => ({ ...d, targetDate }))} />
            <View style={styles.quickGrid}>
              {[3, 6, 12, 24, 60, 120].map(months => (
                <TouchableOpacity key={months} style={styles.quickButton} onPress={() => setDraft(d => ({ ...d, targetDate: dateFromMonths(months) }))}>
                  <Text style={styles.quickText}>{months < 12 ? `${months} mo` : `${months / 12} yr`}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDateOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.doneButton} onPress={() => setDateOpen(false)}><Text style={styles.doneText}>Done</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function dateFromMonths(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function monthsUntil(targetDate: string) {
  const target = new Date(`${targetDate}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(target.getTime())) return 12;
  return Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth());
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function formatDateLabel(value: string) {
  if (!isValidDate(value)) return value || 'Select date';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingTop: 34, paddingBottom: 104 },
  cardTitle: { fontSize: 18, color: theme.colors.secondary, fontWeight: '900', marginBottom: 12 },
  label: { color: theme.colors.secondary, fontWeight: '800', marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  dateButton: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: '#FFFFFF', padding: 14, marginBottom: 12 },
  dateText: { color: theme.colors.secondary, fontWeight: '900', fontSize: 16 },
  dateChevron: { color: theme.colors.primary, fontWeight: '800', marginTop: 4 },
  button: { backgroundColor: theme.colors.deepBlue, borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '900' },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  goalTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.secondary, flex: 1 },
  type: { color: theme.colors.primary, fontWeight: '800', marginTop: 5, textTransform: 'capitalize' },
  badge: { color: theme.colors.primary, backgroundColor: theme.colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, fontWeight: '900', alignSelf: 'flex-start' },
  track: { height: 8, borderRadius: 999, backgroundColor: theme.colors.panel, overflow: 'hidden', marginTop: 16 },
  fill: { height: '100%', backgroundColor: theme.colors.primary },
  text: { color: theme.colors.muted, marginTop: 8 },
  delete: { color: theme.colors.danger, fontWeight: '900', marginTop: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 43, 79, 0.52)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 460, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 18 },
  modalTitle: { color: theme.colors.secondary, fontSize: 22, fontWeight: '900', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  quickButton: { backgroundColor: theme.colors.primaryLight, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11 },
  quickText: { color: theme.colors.primaryDark, fontWeight: '900' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { paddingHorizontal: 14, paddingVertical: 12 },
  cancelText: { color: theme.colors.muted, fontWeight: '900' },
  doneButton: { backgroundColor: theme.colors.deepBlue, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12 },
  doneText: { color: '#FFFFFF', fontWeight: '900' },
});
