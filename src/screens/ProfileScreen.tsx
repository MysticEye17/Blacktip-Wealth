import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import Field from '../components/Field';
import Pill from '../components/Pill';
import SectionHeader from '../components/SectionHeader';
import { AutoInsuranceCoverage, AutoOwnership, ClientProfile, FilingStatus, InsuranceCoverage, LifeInsuranceCoverage, RelationshipStatus, RiskTolerance } from '../types';
import { defaultProfile } from '../utils/defaultData';
import { loadProfile, saveProfile } from '../utils/storage';
import { theme } from '../utils/theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ClientProfile>(defaultProfile);
  useEffect(() => { loadProfile().then(setProfile); }, []);

  const setNum = (key: keyof ClientProfile, value: string) => setProfile(p => ({ ...p, [key]: Number(value.replace(/[^0-9.]/g, '')) || 0 }));
  const setText = (key: keyof ClientProfile, value: string) => setProfile(p => ({ ...p, [key]: value as never }));

  async function onSave() {
    await saveProfile({
      ...profile,
      hasHealthInsurance: profile.healthInsurance !== 'none',
      hasLifeInsurance: profile.lifeInsurance !== 'none',
      hasDisabilityInsurance: profile.disabilityInsurance !== 'none',
      hasAutoInsurance: profile.autoInsurance !== 'none',
    });
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
        <Field label="Partner annual income" value={String(profile.partnerIncome)} onChangeText={v => setNum('partnerIncome', v)} />
        <Field label="Monthly expenses" value={String(profile.monthlyExpenses)} onChangeText={v => setNum('monthlyExpenses', v)} />
        <Field label="Cash savings" value={String(profile.cashSavings)} onChangeText={v => setNum('cashSavings', v)} />
        <Field label="Taxable investments" value={String(profile.investments)} onChangeText={v => setNum('investments', v)} />
        <Field label="Retirement accounts" value={String(profile.retirement)} onChangeText={v => setNum('retirement', v)} />
        <Field label="Annual retirement contributions" value={String(profile.currentRetirementContribution)} onChangeText={v => setNum('currentRetirementContribution', v)} />
        <Field label="Debt balance" value={String(profile.debt)} onChangeText={v => setNum('debt', v)} />
        <Field label="Debt interest rate %" value={String(profile.debtRate)} onChangeText={v => setNum('debtRate', v)} />
        <Field label="Student loans" value={String(profile.studentLoans)} onChangeText={v => setNum('studentLoans', v)} />
        <Field label="Credit score" value={String(profile.creditScore)} onChangeText={v => setNum('creditScore', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Life situation</Text>
        <Text style={styles.label}>Relationship status</Text>
        <View style={styles.wrap}>{(['single','dating','engaged','married','divorced'] as RelationshipStatus[]).map(x => <Pill key={x} label={x} active={profile.relationshipStatus === x} onPress={() => setText('relationshipStatus', x)} />)}</View>
        <Field label="Partner age" value={String(profile.partnerAge)} onChangeText={v => setNum('partnerAge', v)} />
        <Field label="Dependents" value={String(profile.dependents)} onChangeText={v => setNum('dependents', v)} />
        <Field label="Children planned" value={String(profile.childrenPlanned)} onChangeText={v => setNum('childrenPlanned', v)} />
        <Field label="Monthly parent / family support" value={String(profile.parentSupportMonthly)} onChangeText={v => setNum('parentSupportMonthly', v)} />
        <Field label="Parent 1 age" value={String(profile.parent1Age)} onChangeText={v => setNum('parent1Age', v)} />
        <Field label="Parent 2 age" value={String(profile.parent2Age)} onChangeText={v => setNum('parent2Age', v)} />
        <Field label="Expected inheritance" value={String(profile.expectedInheritance)} onChangeText={v => setNum('expectedInheritance', v)} />
        <Text style={styles.label}>Housing</Text>
        <View style={styles.wrap}>{(['rent','own','family','other'] as const).map(x => <Pill key={x} label={x} active={profile.rentOrOwn === x} onPress={() => setText('rentOrOwn', x)} />)}</View>
        <Field label="Rent / mortgage per month" value={String(profile.rentMortgage)} onChangeText={v => setNum('rentMortgage', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Taxes</Text>
        <Text style={styles.label}>Filing status</Text>
        <View style={styles.wrap}>{(['single','marriedJoint','headOfHousehold'] as FilingStatus[]).map(x => <Pill key={x} label={x === 'marriedJoint' ? 'married joint' : x === 'headOfHousehold' ? 'head of household' : x} active={profile.taxFilingStatus === x} onPress={() => setText('taxFilingStatus', x)} />)}</View>
        <Field label="Estimated federal withholding" value={String(profile.estimatedTaxWithholding)} onChangeText={v => setNum('estimatedTaxWithholding', v)} />
        <Field label="Expected long-term capital gains" value={String(profile.annualCapitalGains)} onChangeText={v => setNum('annualCapitalGains', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Housing goal</Text>
        <Field label="Desired home price" value={String(profile.desiredHomePrice)} onChangeText={v => setNum('desiredHomePrice', v)} />
        <Field label="Down payment saved" value={String(profile.downPaymentSaved)} onChangeText={v => setNum('downPaymentSaved', v)} />
        <Field label="Mortgage rate %" value={String(profile.mortgageRate)} onChangeText={v => setNum('mortgageRate', v)} />
        <Field label="Mortgage years" value={String(profile.mortgageYears)} onChangeText={v => setNum('mortgageYears', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Lifestyle and major purchases</Text>
        <Text style={styles.label}>Auto ownership</Text>
        <View style={styles.wrap}>{(['none','owned','financed','leased'] as AutoOwnership[]).map(x => <Pill key={x} label={x} active={profile.autoOwnership === x} onPress={() => setText('autoOwnership', x)} />)}</View>
        <Field label="Car make" value={profile.carMake} keyboardType="default" onChangeText={v => setText('carMake', v)} />
        <Field label="Car model" value={profile.carModel} keyboardType="default" onChangeText={v => setText('carModel', v)} />
        <Field label="Car year" value={String(profile.carYear)} onChangeText={v => setNum('carYear', v)} />
        <Field label="Car value" value={String(profile.carValue)} onChangeText={v => setNum('carValue', v)} />
        <Field label="Car loan balance" value={String(profile.carLoanBalance)} onChangeText={v => setNum('carLoanBalance', v)} />
        <Field label="Car payment per month" value={String(profile.carPayment)} onChangeText={v => setNum('carPayment', v)} />
        <Field label="Car loan APR %" value={String(profile.carLoanRate)} onChangeText={v => setNum('carLoanRate', v)} />
        <Field label="Annual travel budget" value={String(profile.annualTravelBudget)} onChangeText={v => setNum('annualTravelBudget', v)} />
        <Field label="Vacations per year" value={String(profile.vacationsPerYear)} onChangeText={v => setNum('vacationsPerYear', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Insurance + risk</Text>
        <Text style={styles.label}>Health insurance</Text>
        <View style={styles.wrap}>{(['none','employer','private','family'] as InsuranceCoverage[]).map(x => <Pill key={x} label={x} active={profile.healthInsurance === x} onPress={() => setText('healthInsurance', x)} />)}</View>
        <Text style={styles.label}>Life insurance</Text>
        <View style={styles.wrap}>{(['none','employer','term','permanent'] as LifeInsuranceCoverage[]).map(x => <Pill key={x} label={x} active={profile.lifeInsurance === x} onPress={() => setText('lifeInsurance', x)} />)}</View>
        <Text style={styles.label}>Disability insurance</Text>
        <View style={styles.wrap}>{(['none','employer','private','family'] as InsuranceCoverage[]).map(x => <Pill key={x} label={x} active={profile.disabilityInsurance === x} onPress={() => setText('disabilityInsurance', x)} />)}</View>
        <Text style={styles.label}>Auto insurance</Text>
        <View style={styles.wrap}>{(['none','liability','full','commercial'] as AutoInsuranceCoverage[]).map(x => <Pill key={x} label={x} active={profile.autoInsurance === x} onPress={() => setText('autoInsurance', x)} />)}</View>
        <Text style={styles.label}>Risk tolerance</Text>
        <View style={styles.wrap}>{(['low','medium','high'] as RiskTolerance[]).map(x => <Pill key={x} label={x} active={profile.riskTolerance === x} onPress={() => setText('riskTolerance', x)} />)}</View>
        <Field label="Target retirement age" value={String(profile.targetRetirementAge)} onChangeText={v => setNum('targetRetirementAge', v)} />
      </Card>
      <TouchableOpacity style={styles.button} onPress={onSave}><Text style={styles.buttonText}>Save profile</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: 18, paddingTop: 34, paddingBottom: 104 }, cardTitle: { fontSize: 18, color: theme.colors.secondary, fontWeight: '900', marginBottom: 12 }, label: { color: theme.colors.secondary, fontWeight: '800', marginBottom: 8 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }, button: { backgroundColor: theme.colors.deepBlue, padding: 17, borderRadius: 8, alignItems: 'center', marginBottom: 30 }, buttonText: { color: '#fff', fontWeight: '900', fontSize: 16 }, toggle: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline }, toggleLabel: { fontWeight: '800', color: theme.colors.text }, toggleValue: { fontWeight: '900' }, yes: { color: theme.colors.success }, no: { color: theme.colors.danger },
});
