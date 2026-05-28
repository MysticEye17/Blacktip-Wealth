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

  const setNum = (key: keyof ClientProfile, value: string) => setProfile(p => ({ ...p, [key]: parseNumber(value) as never }));
  const setText = (key: keyof ClientProfile, value: string) => setProfile(p => ({ ...p, [key]: value as never }));
  const updateSection = (values: Partial<ClientProfile>) => setProfile(p => ({ ...p, ...values }));

  async function persist(message = 'Your profile was saved on this device.') {
    await saveProfile({
      ...profile,
      hasHealthInsurance: profile.healthInsurance !== 'none',
      hasLifeInsurance: profile.lifeInsurance !== 'none',
      hasDisabilityInsurance: profile.disabilityInsurance !== 'none',
      hasAutoInsurance: profile.autoInsurance !== 'none',
    });
    Alert.alert('Saved', message);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Profile" subtitle="Blank fields stay private. The calculators estimate carefully instead of treating missing answers as zero." />

      <ProfileSection
        title="Basics"
        onClear={() => updateSection({ name: '', age: null, state: '', heightInches: null, weightLbs: null })}
        onSave={() => persist('Basics saved.')}
      >
        <Field label="Name" value={profile.name} keyboardType="default" onChangeText={v => setText('name', v)} />
        <Field label="Age" value={fieldValue(profile.age)} onChangeText={v => setNum('age', v)} />
        <Field label="State" value={profile.state} keyboardType="default" onChangeText={v => setText('state', v)} />
        <Field label="Height in inches" value={fieldValue(profile.heightInches)} onChangeText={v => setNum('heightInches', v)} />
        <Field label="Weight in pounds" value={fieldValue(profile.weightLbs)} onChangeText={v => setNum('weightLbs', v)} />
      </ProfileSection>

      <ProfileSection
        title="Money"
        onClear={() => updateSection({ income: null, partnerIncome: null, monthlyExpenses: null, cashSavings: null, investments: null, retirement: null, currentRetirementContribution: null, debt: null, debtRate: null, studentLoans: null, creditScore: null })}
        onSave={() => persist('Money section saved.')}
      >
        <Field label="Your annual earned income" value={fieldValue(profile.income)} onChangeText={v => setNum('income', v)} />
        <Field label="Partner annual income" value={fieldValue(profile.partnerIncome)} onChangeText={v => setNum('partnerIncome', v)} />
        <Field label="Monthly expenses before car payment" value={fieldValue(profile.monthlyExpenses)} onChangeText={v => setNum('monthlyExpenses', v)} />
        <Field label="Cash savings" value={fieldValue(profile.cashSavings)} onChangeText={v => setNum('cashSavings', v)} />
        <Field label="Taxable investments" value={fieldValue(profile.investments)} onChangeText={v => setNum('investments', v)} />
        <Field label="Retirement accounts" value={fieldValue(profile.retirement)} onChangeText={v => setNum('retirement', v)} />
        <Field label="Your annual retirement contributions" value={fieldValue(profile.currentRetirementContribution)} onChangeText={v => setNum('currentRetirementContribution', v)} />
        <Field label="Debt balance" value={fieldValue(profile.debt)} onChangeText={v => setNum('debt', v)} />
        <Field label="Debt interest rate %" value={fieldValue(profile.debtRate)} onChangeText={v => setNum('debtRate', v)} />
        <Field label="Student loans" value={fieldValue(profile.studentLoans)} onChangeText={v => setNum('studentLoans', v)} />
        <Field label="Credit score" value={fieldValue(profile.creditScore)} onChangeText={v => setNum('creditScore', v)} />
      </ProfileSection>

      <ProfileSection
        title="Life situation"
        onClear={() => updateSection({ relationshipStatus: 'single', partnerAge: null, dependents: null, childrenPlanned: null, parentSupportMonthly: null, parent1Age: null, parent2Age: null, expectedInheritance: null })}
        onSave={() => persist('Life situation saved.')}
      >
        <Text style={styles.label}>Relationship status</Text>
        <View style={styles.wrap}>{(['single','dating','engaged','married','divorced'] as RelationshipStatus[]).map(x => <Pill key={x} label={x} active={profile.relationshipStatus === x} onPress={() => setText('relationshipStatus', x)} />)}</View>
        <Field label="Partner age" value={fieldValue(profile.partnerAge)} onChangeText={v => setNum('partnerAge', v)} />
        <Field label="Dependents" value={fieldValue(profile.dependents)} onChangeText={v => setNum('dependents', v)} />
        <Field label="Children planned" value={fieldValue(profile.childrenPlanned)} onChangeText={v => setNum('childrenPlanned', v)} />
        <Field label="Monthly parent / family support" value={fieldValue(profile.parentSupportMonthly)} onChangeText={v => setNum('parentSupportMonthly', v)} />
        <Field label="Parent 1 age" value={fieldValue(profile.parent1Age)} onChangeText={v => setNum('parent1Age', v)} />
        <Field label="Parent 2 age" value={fieldValue(profile.parent2Age)} onChangeText={v => setNum('parent2Age', v)} />
        <Field label="Expected inheritance" value={fieldValue(profile.expectedInheritance)} onChangeText={v => setNum('expectedInheritance', v)} />
      </ProfileSection>

      <ProfileSection
        title="Housing"
        onClear={() => updateSection({ rentOrOwn: 'rent', rentMortgage: null, homeValue: null, mortgageBalance: null, plannedHomeSaleAge: null })}
        onSave={() => persist('Housing section saved.')}
      >
        <Text style={styles.label}>Housing status</Text>
        <View style={styles.wrap}>{(['rent','own','family','other'] as const).map(x => <Pill key={x} label={x} active={profile.rentOrOwn === x} onPress={() => setText('rentOrOwn', x)} />)}</View>
        <Field label="Rent / mortgage per month" value={fieldValue(profile.rentMortgage)} onChangeText={v => setNum('rentMortgage', v)} />
        <Field label="Estimated home value" value={fieldValue(profile.homeValue)} onChangeText={v => setNum('homeValue', v)} />
        <Field label="Mortgage balance" value={fieldValue(profile.mortgageBalance)} onChangeText={v => setNum('mortgageBalance', v)} />
        <Field label="Planned age to sell house" value={fieldValue(profile.plannedHomeSaleAge)} onChangeText={v => setNum('plannedHomeSaleAge', v)} />
      </ProfileSection>

      <ProfileSection
        title="Taxes"
        onClear={() => updateSection({ taxFilingStatus: 'single', estimatedTaxWithholding: null, annualCapitalGains: null })}
        onSave={() => persist('Tax section saved.')}
      >
        <Text style={styles.label}>Filing status</Text>
        <View style={styles.wrap}>{(['single','marriedJoint','headOfHousehold'] as FilingStatus[]).map(x => <Pill key={x} label={x === 'marriedJoint' ? 'married joint' : x === 'headOfHousehold' ? 'head of household' : x} active={profile.taxFilingStatus === x} onPress={() => setText('taxFilingStatus', x)} />)}</View>
        <Field label="Estimated federal withholding" value={fieldValue(profile.estimatedTaxWithholding)} onChangeText={v => setNum('estimatedTaxWithholding', v)} />
        <Field label="Expected long-term capital gains" value={fieldValue(profile.annualCapitalGains)} onChangeText={v => setNum('annualCapitalGains', v)} />
      </ProfileSection>

      <ProfileSection
        title="Housing goal"
        onClear={() => updateSection({ desiredHomePrice: null, downPaymentSaved: null, mortgageRate: null, mortgageYears: null })}
        onSave={() => persist('Housing goal saved.')}
      >
        <Field label="Desired home price" value={fieldValue(profile.desiredHomePrice)} onChangeText={v => setNum('desiredHomePrice', v)} />
        <Field label="Down payment saved" value={fieldValue(profile.downPaymentSaved)} onChangeText={v => setNum('downPaymentSaved', v)} />
        <Field label="Mortgage rate %" value={fieldValue(profile.mortgageRate)} onChangeText={v => setNum('mortgageRate', v)} />
        <Field label="Mortgage years" value={fieldValue(profile.mortgageYears)} onChangeText={v => setNum('mortgageYears', v)} />
      </ProfileSection>

      <ProfileSection
        title="Lifestyle and major purchases"
        onClear={() => updateSection({ autoOwnership: 'none', carMake: '', carModel: '', carYear: null, carValue: null, carLoanBalance: null, carPayment: null, carLoanRate: null, annualTravelBudget: null, vacationsPerYear: null })}
        onSave={() => persist('Lifestyle section saved.')}
      >
        <Text style={styles.label}>Auto ownership</Text>
        <View style={styles.wrap}>{(['none','owned','financed','leased'] as AutoOwnership[]).map(x => <Pill key={x} label={x} active={profile.autoOwnership === x} onPress={() => setText('autoOwnership', x)} />)}</View>
        <Field label="Car make" value={profile.carMake} keyboardType="default" onChangeText={v => setText('carMake', v)} />
        <Field label="Car model" value={profile.carModel} keyboardType="default" onChangeText={v => setText('carModel', v)} />
        <Field label="Car year" value={fieldValue(profile.carYear)} onChangeText={v => setNum('carYear', v)} />
        <Field label="Car value" value={fieldValue(profile.carValue)} onChangeText={v => setNum('carValue', v)} />
        <Field label="Car loan balance" value={fieldValue(profile.carLoanBalance)} onChangeText={v => setNum('carLoanBalance', v)} />
        <Field label="Car payment per month" value={fieldValue(profile.carPayment)} onChangeText={v => setNum('carPayment', v)} />
        <Field label="Car loan APR %" value={fieldValue(profile.carLoanRate)} onChangeText={v => setNum('carLoanRate', v)} />
        <Field label="Annual travel budget" value={fieldValue(profile.annualTravelBudget)} onChangeText={v => setNum('annualTravelBudget', v)} />
        <Field label="Vacations per year" value={fieldValue(profile.vacationsPerYear)} onChangeText={v => setNum('vacationsPerYear', v)} />
      </ProfileSection>

      <ProfileSection
        title="Insurance + risk"
        onClear={() => updateSection({ healthInsurance: 'none', lifeInsurance: 'none', disabilityInsurance: 'none', autoInsurance: 'none', riskTolerance: 'medium', targetRetirementAge: null })}
        onSave={() => persist('Insurance and risk saved.')}
      >
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
        <Field label="Target retirement age" value={fieldValue(profile.targetRetirementAge)} onChangeText={v => setNum('targetRetirementAge', v)} />
      </ProfileSection>

      <TouchableOpacity style={styles.button} onPress={() => persist()}><Text style={styles.buttonText}>Save all profile sections</Text></TouchableOpacity>
    </ScrollView>
  );
}

function ProfileSection({ title, children, onClear, onSave }: { title: string; children: React.ReactNode; onClear: () => void; onSave: () => void }) {
  return (
    <Card>
      <View style={styles.sectionTop}>
        <Text style={styles.cardTitle}>{title}</Text>
        <TouchableOpacity style={styles.clearButton} onPress={onClear}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
      </View>
      {children}
      <View style={styles.sectionBottom}>
        <TouchableOpacity style={styles.saveBox} onPress={onSave}>
          <Text style={styles.saveBoxText}>Save</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function parseNumber(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return cleaned ? Number(cleaned) : null;
}

function fieldValue(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingTop: 34, paddingBottom: 104 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardTitle: { fontSize: 18, color: theme.colors.secondary, fontWeight: '900', flex: 1 },
  clearButton: { backgroundColor: '#FFF1F1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  clearText: { color: theme.colors.danger, fontWeight: '900' },
  sectionBottom: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  saveBox: { backgroundColor: theme.colors.deepBlue, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11 },
  saveBoxText: { color: '#FFFFFF', fontWeight: '900' },
  label: { color: theme.colors.secondary, fontWeight: '800', marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  button: { backgroundColor: theme.colors.deepBlue, padding: 17, borderRadius: 8, alignItems: 'center', marginBottom: 30 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
