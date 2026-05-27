import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import Field from '../components/Field';
import Pill from '../components/Pill';
import SectionHeader from '../components/SectionHeader';
import { ClientProfile, RelationshipStatus, RiskTolerance } from '../types';
import { defaultProfile } from '../utils/defaultData';
import { loadProfile, saveProfile } from '../utils/storage';
import { theme } from '../utils/theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ClientProfile>(defaultProfile);
  useEffect(() => { loadProfile().then(setProfile); }, []);

  const setNum = (key: keyof ClientProfile, value: string) => setProfile(p => ({ ...p, [key]: Number(value.replace(/[^0-9.]/g, '')) || 0 }));
  const setText = (key: keyof ClientProfile, value: string) => setProfile(p => ({ ...p, [key]: value as never }));

  async function onSave() {
    await saveProfile(profile);
    Alert.alert('Saved', 'Your profile was saved on this device.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Profile" subtitle="This is the personal data the decision engine uses. More detail creates more specific suggestions." />
      <Card>
        <Text style={styles.cardTitle}>Basics</Text>
        <Field label="Name" value={profile.name} keyboardType="default" onChangeText={v => setText('name', v)} />
        <Field label="Age" value={String(profile.age)} onChangeText={v => setNum('age', v)} />
        <Field label="State" value={profile.state} keyboardType="default" onChangeText={v => setText('state', v)} />
        <Field label="Height in inches" value={String(profile.heightInches)} onChangeText={v => setNum('heightInches', v)} />
        <Field label="Weight in pounds" value={String(profile.weightLbs)} onChangeText={v => setNum('weightLbs', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Money</Text>
        <Field label="Annual income" value={String(profile.income)} onChangeText={v => setNum('income', v)} />
        <Field label="Monthly expenses" value={String(profile.monthlyExpenses)} onChangeText={v => setNum('monthlyExpenses', v)} />
        <Field label="Cash savings" value={String(profile.cashSavings)} onChangeText={v => setNum('cashSavings', v)} />
        <Field label="Taxable investments" value={String(profile.investments)} onChangeText={v => setNum('investments', v)} />
        <Field label="Retirement accounts" value={String(profile.retirement)} onChangeText={v => setNum('retirement', v)} />
        <Field label="Debt balance" value={String(profile.debt)} onChangeText={v => setNum('debt', v)} />
        <Field label="Debt interest rate %" value={String(profile.debtRate)} onChangeText={v => setNum('debtRate', v)} />
        <Field label="Student loans" value={String(profile.studentLoans)} onChangeText={v => setNum('studentLoans', v)} />
        <Field label="Credit score" value={String(profile.creditScore)} onChangeText={v => setNum('creditScore', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Life situation</Text>
        <Text style={styles.label}>Relationship status</Text>
        <View style={styles.wrap}>{(['single','dating','engaged','married','divorced'] as RelationshipStatus[]).map(x => <Pill key={x} label={x} active={profile.relationshipStatus === x} onPress={() => setText('relationshipStatus', x)} />)}</View>
        <Field label="Dependents" value={String(profile.dependents)} onChangeText={v => setNum('dependents', v)} />
        <Text style={styles.label}>Housing</Text>
        <View style={styles.wrap}>{(['rent','own','family','other'] as const).map(x => <Pill key={x} label={x} active={profile.rentOrOwn === x} onPress={() => setText('rentOrOwn', x)} />)}</View>
        <Field label="Rent / mortgage per month" value={String(profile.rentMortgage)} onChangeText={v => setNum('rentMortgage', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Insurance + risk</Text>
        <Toggle label="Health insurance" value={profile.hasHealthInsurance} onPress={() => setProfile(p => ({...p, hasHealthInsurance: !p.hasHealthInsurance}))} />
        <Toggle label="Life insurance" value={profile.hasLifeInsurance} onPress={() => setProfile(p => ({...p, hasLifeInsurance: !p.hasLifeInsurance}))} />
        <Toggle label="Disability insurance" value={profile.hasDisabilityInsurance} onPress={() => setProfile(p => ({...p, hasDisabilityInsurance: !p.hasDisabilityInsurance}))} />
        <Toggle label="Auto insurance" value={profile.hasAutoInsurance} onPress={() => setProfile(p => ({...p, hasAutoInsurance: !p.hasAutoInsurance}))} />
        <Text style={styles.label}>Risk tolerance</Text>
        <View style={styles.wrap}>{(['low','medium','high'] as RiskTolerance[]).map(x => <Pill key={x} label={x} active={profile.riskTolerance === x} onPress={() => setText('riskTolerance', x)} />)}</View>
        <Field label="Target retirement age" value={String(profile.targetRetirementAge)} onChangeText={v => setNum('targetRetirementAge', v)} />
      </Card>
      <TouchableOpacity style={styles.button} onPress={onSave}><Text style={styles.buttonText}>Save profile</Text></TouchableOpacity>
    </ScrollView>
  );
}

function Toggle({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={styles.toggle}><Text style={styles.toggleLabel}>{label}</Text><Text style={[styles.toggleValue, value ? styles.yes : styles.no]}>{value ? 'Yes' : 'No'}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: 18, paddingTop: 56, paddingBottom: 100 }, cardTitle: { fontSize: 18, color: theme.colors.secondary, fontWeight: '900', marginBottom: 12 }, label: { color: theme.colors.secondary, fontWeight: '800', marginBottom: 8 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }, button: { backgroundColor: theme.colors.primary, padding: 17, borderRadius: 18, alignItems: 'center', marginBottom: 30 }, buttonText: { color: '#fff', fontWeight: '900', fontSize: 16 }, toggle: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, toggleLabel: { fontWeight: '800', color: theme.colors.text }, toggleValue: { fontWeight: '900' }, yes: { color: theme.colors.success }, no: { color: theme.colors.danger },
});
