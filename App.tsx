import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export type RootStackParamList = { Welcome: undefined; Main: undefined };

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const colors = {
  navy: '#031B3A',
  deep: '#062A5E',
  royal: '#003B8F',
  ice: '#EAF2FF',
  foam: '#F7FBFF',
  ink: '#172033',
  muted: '#667085',
  border: '#D8E6F3',
};

type Profile = {
  age: string;
  annualIncome: string;
  monthlyExpenses: string;
  cashSavings: string;
  creditCardDebt: string;
  creditCardApr: string;
  studentLoans: string;
  studentLoanApr: string;
  retirementSavings: string;
  monthlyRetirementContribution: string;
  employerMatchAvailable: 'yes' | 'no';
  filingStatus: 'single' | 'married_joint' | 'head';
  relationshipStatus: 'single' | 'dating' | 'engaged' | 'married' | 'divorced';
  housingGoal: 'none' | 'buy_1_2' | 'buy_3_5' | 'rent';
  riskTolerance: 'low' | 'medium' | 'high';
};

const initialProfile: Profile = {
  age: '24',
  annualIncome: '68000',
  monthlyExpenses: '3600',
  cashSavings: '6500',
  creditCardDebt: '2800',
  creditCardApr: '24',
  studentLoans: '18000',
  studentLoanApr: '6',
  retirementSavings: '7200',
  monthlyRetirementContribution: '350',
  employerMatchAvailable: 'yes',
  filingStatus: 'single',
  relationshipStatus: 'dating',
  housingGoal: 'buy_3_5',
  riskTolerance: 'medium',
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const numeric = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function BrandMark() {
  return (
    <View style={styles.brand}>
      <View style={styles.mark}>
        <View style={styles.fin} />
        <View style={styles.wave} />
      </View>
      <View>
        <Text style={styles.brandName}>BLACKTIP</Text>
        <View style={styles.wealthLine}>
          <View style={styles.rule} />
          <Text style={styles.wealth}>WEALTH</Text>
          <View style={styles.rule} />
        </View>
      </View>
    </View>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  light,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <View style={styles.sectionTitleWrap}>
      {eyebrow ? <Text style={[styles.eyebrow, light && styles.lightMuted]}>{eyebrow}</Text> : null}
      <Text style={[styles.sectionTitle, light && styles.lightText]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, light && styles.lightSubtext]}>{subtitle}</Text> : null}
    </View>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  const tone = score >= 75 ? styles.good : score >= 50 ? styles.okay : styles.risk;
  return (
    <View style={[styles.scorePill, tone]}>
      <Text style={styles.scorePillText}>{label}</Text>
      <Text style={styles.scorePillText}>{score}/100</Text>
    </View>
  );
}

function ProgressBar({ value, light = false }: { value: number; light?: boolean }) {
  return (
    <View style={[styles.track, light && styles.trackLight]}>
      <View style={[styles.fill, light && styles.fillLight, { width: `${clamp(value, 0, 100)}%` }]} />
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput value={value} onChangeText={onChange} keyboardType="numeric" style={styles.input} />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function Segments<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmentRow}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.segment, active && styles.segmentActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function StatCard({
  token,
  label,
  value,
  helper,
}: {
  token: string;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconBubble}>
        <Text style={styles.iconText}>{token}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHelper}>{helper}</Text>
    </View>
  );
}

export default function App() {
  const [profile, setProfile] = useState(initialProfile);
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const results = useMemo(() => {
    const age = numeric(profile.age);
    const annualIncome = numeric(profile.annualIncome);
    const monthlyIncome = annualIncome / 12;
    const monthlyExpenses = numeric(profile.monthlyExpenses);
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    const cashSavings = numeric(profile.cashSavings);
    const creditCardDebt = numeric(profile.creditCardDebt);
    const studentLoans = numeric(profile.studentLoans);
    const retirementSavings = numeric(profile.retirementSavings);
    const monthlyRetirementContribution = numeric(profile.monthlyRetirementContribution);
    const totalDebt = creditCardDebt + studentLoans;
    const netWorth = cashSavings + retirementSavings - totalDebt;
    const emergencyFundMonths = monthlyExpenses > 0 ? cashSavings / monthlyExpenses : 0;
    const targetMonths = profile.riskTolerance === 'low' ? 6 : profile.riskTolerance === 'medium' ? 4 : 3;
    const targetEmergencyFund = monthlyExpenses * targetMonths;
    const emergencyGap = Math.max(targetEmergencyFund - cashSavings, 0);
    const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;
    const retirementRate = monthlyIncome > 0 ? (monthlyRetirementContribution / monthlyIncome) * 100 : 0;
    const debtToIncome = annualIncome > 0 ? (totalDebt / annualIncome) * 100 : 0;

    const cashScore = clamp(Math.round((emergencyFundMonths / 4) * 100), 0, 100);
    const debtScore = clamp(Math.round(100 - debtToIncome * 1.4 - (creditCardDebt > 0 ? 20 : 0)), 0, 100);
    const retirementScore = clamp(
      Math.round((retirementRate / 15) * 100 + Math.min(retirementSavings / Math.max(annualIncome, 1), 1) * 20),
      0,
      100,
    );
    const housingScore = clamp(
      Math.round(cashScore * 0.45 + debtScore * 0.35 + (savingsRate > 15 ? 20 : savingsRate > 8 ? 12 : 4)),
      0,
      100,
    );
    const overallScore = Math.round((cashScore + debtScore + retirementScore + housingScore) / 4);

    const nextDollar: { bucket: string; amount: number; reason: string }[] = [];
    let remaining = 1000;
    if (creditCardDebt > 0 && numeric(profile.creditCardApr) >= 12) {
      const amount = Math.min(remaining * 0.35, creditCardDebt);
      nextDollar.push({
        bucket: 'Eliminate expensive debt',
        amount,
        reason: 'This is your clearest guaranteed win because every dollar reduces interest drag.',
      });
      remaining -= amount;
    }
    if (profile.employerMatchAvailable === 'yes' && retirementRate < 6) {
      const amount = remaining * 0.25;
      nextDollar.push({
        bucket: 'Capture employer match',
        amount,
        reason: 'Before advanced planning, collect the benefit already available to you.',
      });
      remaining -= amount;
    }
    if (emergencyFundMonths < 3) {
      const amount = remaining * 0.45;
      nextDollar.push({
        bucket: 'Build cash runway',
        amount,
        reason: 'Your cash buffer is thin compared with monthly obligations.',
      });
      remaining -= amount;
    }
    if (age < 35 && retirementRate < 15) {
      const amount = remaining * 0.35;
      nextDollar.push({
        bucket: 'Increase long-term savings',
        amount,
        reason: 'Young adults benefit most from time, consistency, and automation.',
      });
      remaining -= amount;
    }
    if (profile.housingGoal !== 'none' && housingScore >= 55) {
      const amount = remaining * 0.35;
      nextDollar.push({
        bucket: 'Fund housing goal',
        amount,
        reason: 'A house fund can grow once cash, debt, and retirement basics are stable.',
      });
      remaining -= amount;
    }
    if (remaining > 0) {
      nextDollar.push({
        bucket: 'Flexible goal reserve',
        amount: remaining,
        reason: 'Keep this available for near-term life decisions, insurance, or moving costs.',
      });
    }

    let aiSummary =
      'You have a workable foundation, but sequence matters: protect cash, remove interest drag, capture benefits, then scale long-term savings.';
    if (cashScore < 50) {
      aiSummary = 'Your biggest exposure is liquidity. Build a stronger cash runway before making aggressive long-term moves.';
    }
    if (creditCardDebt > 0 && numeric(profile.creditCardApr) >= 18) {
      aiSummary =
        'Your sharpest next move is reducing high-interest debt. The interest rate is likely working against your wealth faster than normal investing can help.';
    }
    if (overallScore >= 75) {
      aiSummary =
        'You are in a strong position for your age. The next layer is optimization: taxes, retirement account choice, housing timing, and insurance coverage.';
    }

    return {
      monthlySurplus,
      netWorth,
      emergencyFundMonths,
      targetEmergencyFund,
      retirementRate,
      scores: { cashScore, debtScore, retirementScore, housingScore, overallScore },
      nextDollar: nextDollar.map((item) => ({ ...item, amount: Math.round(item.amount) })),
      timeline: [
        creditCardDebt > 0
          ? 'Now: clear the highest-interest debt while keeping enough cash to avoid new debt.'
          : 'Now: lock in your cash runway and automate core savings.',
        emergencyGap > 0
          ? `1 year: move cash reserves toward ${money.format(targetEmergencyFund)}.`
          : '1 year: hold your emergency fund steady and raise retirement contributions.',
        retirementRate < 15
          ? '2 years: push retirement contributions closer to 15% of gross income.'
          : '2 years: use excess cash flow for medium-term goals and tax-aware planning.',
        profile.housingGoal === 'buy_3_5'
          ? '3-4 years: run a housing readiness test before taking on a mortgage.'
          : '3-4 years: stress-test marriage, relocation, school, family, or other life decisions.',
        'Long term: create a formal wealth policy around risk, goals, taxes, liquidity, legal needs, and unique circumstances.',
      ],
      aiSummary,
    };
  }, [profile]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.page} contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <BrandMark />
            <View style={styles.navRow}>
              {['Dashboard', 'Next Move', 'Goals', 'Housing'].map((item) => (
                <View key={item} style={styles.navPill}>
                  <Text style={styles.navText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Clarity beneath the surface</Text>
            </View>
            <Text style={styles.heroTitle}>A personal financial decision engine for young adults.</Text>
            <Text style={styles.heroCopy}>
              Blacktip Wealth turns personal inputs into clear next moves across budgeting, taxes,
              retirement, insurance, housing, relationships, and major life decisions.
            </Text>
            <View style={styles.ctaRow}>
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>See your next move</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
                <Text style={styles.secondaryButtonText}>View dashboard</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.signalShell}>
              <View style={styles.signalCard}>
                <View style={styles.signalHeader}>
                  <View>
                    <Text style={styles.signalKicker}>WEALTH SIGNAL</Text>
                    <Text style={styles.signalTitle}>Financial Health</Text>
                  </View>
                  <ScorePill label="Live" score={results.scores.overallScore} />
                </View>
                <View style={styles.scoreBigRow}>
                  <Text style={styles.scoreNumber}>{results.scores.overallScore}</Text>
                  <Text style={styles.scoreCaption}>/ 100{'\n'}current plan strength</Text>
                </View>
                <ProgressBar value={results.scores.overallScore} />
                <View style={styles.miniGrid}>
                  <MiniScore label="Cash" value={results.scores.cashScore} />
                  <MiniScore label="Debt" value={results.scores.debtScore} />
                  <MiniScore label="Future" value={results.scores.retirementScore} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard token="$" label="Monthly surplus" value={money.format(results.monthlySurplus)} helper="Estimated income after current monthly expenses." />
            <StatCard token="NW" label="Net worth" value={money.format(results.netWorth)} helper="Cash plus retirement savings minus listed debt." />
            <StatCard token="EF" label="Cash runway" value={`${results.emergencyFundMonths.toFixed(1)} mo.`} helper={`Target: ${money.format(results.targetEmergencyFund)}`} />
            <StatCard token="%" label="Retirement rate" value={`${results.retirementRate.toFixed(1)}%`} helper="Monthly contribution as a share of gross income." />
          </View>

          <View style={styles.card}>
            <SectionTitle eyebrow="Profile" title="Client inputs" subtitle="Start simple. Add more details as the plan gets smarter." />
            <View style={styles.twoCol}>
              <Field label="Age" value={profile.age} onChange={(v) => update('age', v)} />
              <Field label="Annual income" prefix="$" value={profile.annualIncome} onChange={(v) => update('annualIncome', v)} />
            </View>
            <Field label="Monthly expenses" prefix="$" value={profile.monthlyExpenses} onChange={(v) => update('monthlyExpenses', v)} />
            <View style={styles.twoCol}>
              <Field label="Cash savings" prefix="$" value={profile.cashSavings} onChange={(v) => update('cashSavings', v)} />
              <Field label="Retirement savings" prefix="$" value={profile.retirementSavings} onChange={(v) => update('retirementSavings', v)} />
            </View>
            <View style={styles.twoCol}>
              <Field label="Card debt" prefix="$" value={profile.creditCardDebt} onChange={(v) => update('creditCardDebt', v)} />
              <Field label="Card APR" suffix="%" value={profile.creditCardApr} onChange={(v) => update('creditCardApr', v)} />
            </View>
            <View style={styles.twoCol}>
              <Field label="Student loans" prefix="$" value={profile.studentLoans} onChange={(v) => update('studentLoans', v)} />
              <Field label="Loan APR" suffix="%" value={profile.studentLoanApr} onChange={(v) => update('studentLoanApr', v)} />
            </View>
            <Field
              label="Monthly retirement contribution"
              prefix="$"
              value={profile.monthlyRetirementContribution}
              onChange={(v) => update('monthlyRetirementContribution', v)}
            />
            <Segments
              label="Employer match available"
              value={profile.employerMatchAvailable}
              onChange={(v) => update('employerMatchAvailable', v)}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
            <Segments
              label="Relationship status"
              value={profile.relationshipStatus}
              onChange={(v) => update('relationshipStatus', v)}
              options={[
                { value: 'single', label: 'Single' },
                { value: 'dating', label: 'Dating' },
                { value: 'engaged', label: 'Engaged' },
                { value: 'married', label: 'Married' },
                { value: 'divorced', label: 'Divorced' },
              ]}
            />
            <Segments
              label="Tax filing status"
              value={profile.filingStatus}
              onChange={(v) => update('filingStatus', v)}
              options={[
                { value: 'single', label: 'Single' },
                { value: 'married_joint', label: 'Married jointly' },
                { value: 'head', label: 'Head of household' },
              ]}
            />
            <Segments
              label="Risk tolerance"
              value={profile.riskTolerance}
              onChange={(v) => update('riskTolerance', v)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
            <Segments
              label="Housing goal"
              value={profile.housingGoal}
              onChange={(v) => update('housingGoal', v)}
              options={[
                { value: 'none', label: 'No housing goal yet' },
                { value: 'buy_1_2', label: 'Buy in 1-2 years' },
                { value: 'buy_3_5', label: 'Buy in 3-5 years' },
                { value: 'rent', label: 'Prefer renting' },
              ]}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <SectionTitle eyebrow="Command center" title="Personalized financial scores" subtitle="Cash, debt, retirement, and housing readiness." />
              <ScorePill label="Overall" score={results.scores.overallScore} />
            </View>
            <ScoreTile label="Cash health" score={results.scores.cashScore} helper="Runway and emergency reserves" />
            <ScoreTile label="Debt risk" score={results.scores.debtScore} helper="Interest drag and debt load" />
            <ScoreTile label="Future wealth" score={results.scores.retirementScore} helper="Long-term savings momentum" />
            <ScoreTile label="Housing readiness" score={results.scores.housingScore} helper="Cash, debt, and flexibility" />
          </View>

          <View style={styles.card}>
            <SectionTitle eyebrow="Next move" title="Where the next $1,000 goes" subtitle="Prioritized by urgency, stability, and long-term impact." />
            {results.nextDollar.map((item, index) => (
              <View key={`${item.bucket}-${index}`} style={styles.nextMove}>
                <View style={styles.nextMoveTop}>
                  <View style={styles.rank}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.nextMoveTitle}>{item.bucket}</Text>
                  <View style={styles.amountPill}>
                    <Text style={styles.amountText}>{money.format(item.amount)}</Text>
                  </View>
                </View>
                <Text style={styles.nextMoveText}>{item.reason}</Text>
              </View>
            ))}
          </View>

          <View style={styles.aiCard}>
            <View style={styles.aiTop}>
              <SectionTitle eyebrow="AI layer" title="Clear interpretation" light />
              <Text style={styles.aiSummary}>{results.aiSummary}</Text>
            </View>
            <View style={styles.guardrail}>
              <Text style={styles.guardrailTitle}>Compliance guardrail</Text>
              <Text style={styles.guardrailText}>
                The app should calculate first, then use OpenAI to explain. Keep outputs educational unless reviewed by licensed tax, legal, or investment professionals.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <SectionTitle eyebrow="Roadmap" title="Timeline recommendations" subtitle="Turn today's profile into short-term and long-term moves." />
            {results.timeline.map((item) => (
              <View key={item} style={styles.timelineItem}>
                <Text style={styles.timelineText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.insightGrid}>
            <Insight title="Insurance intelligence" token="IN">
              Next build: renter, health, disability, life, and umbrella insurance gap checks.
            </Insight>
            <Insight title="Relationship planning" token="RL">
              Next build: marriage tax estimate, shared-budget readiness, beneficiaries, and prenup checklist.
            </Insight>
            <Insight title="Housing decisions" token="HM">
              Next build: rent-vs-buy, mortgage affordability, down-payment timeline, and stress testing.
            </Insight>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniScore}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

function ScoreTile({ label, score, helper }: { label: string; score: number; helper: string }) {
  return (
    <View style={styles.scoreTile}>
      <View style={styles.scoreTileTop}>
        <Text style={styles.scoreTileTitle}>{label}</Text>
        <Text style={styles.scoreTileValue}>{score}</Text>
      </View>
      <ProgressBar value={score} />
      <Text style={styles.scoreTileHelper}>{helper}</Text>
    </View>
  );
}

function Insight({ title, token, children }: { title: string; token: string; children: React.ReactNode }) {
  return (
    <View style={styles.insight}>
      <View style={styles.insightTop}>
        <View style={styles.iconBubble}>
          <Text style={styles.iconText}>{token}</Text>
        </View>
        <Text style={styles.insightTitle}>{title}</Text>
      </View>
      <Text style={styles.insightText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.navy },
  page: { flex: 1, backgroundColor: colors.foam },
  content: { paddingBottom: 34 },
  hero: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fin: { width: 21, height: 30, backgroundColor: 'rgba(255,255,255,0.92)', borderTopRightRadius: 26, borderBottomLeftRadius: 4, transform: [{ skewX: '-24deg' }] },
  wave: { position: 'absolute', bottom: 11, width: 36, height: 2, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.72)' },
  brandName: { color: '#FFFFFF', fontSize: 23, fontWeight: '700', letterSpacing: 3 },
  wealthLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 },
  rule: { width: 28, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  wealth: { color: 'rgba(255,255,255,0.66)', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  navRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  navPill: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 8 },
  navText: { color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: '700' },
  badge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 9, marginTop: 34, marginBottom: 16 },
  badgeText: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '800' },
  heroTitle: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', lineHeight: 44 },
  heroCopy: { color: 'rgba(255,255,255,0.76)', fontSize: 16, lineHeight: 25, marginTop: 16 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  primaryButton: { borderRadius: 999, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 15 },
  primaryButtonText: { color: colors.navy, fontSize: 15, fontWeight: '900' },
  secondaryButton: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 20, paddingVertical: 15 },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  signalShell: { marginTop: 28, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.1)', padding: 12 },
  signalCard: { borderRadius: 24, backgroundColor: '#FFFFFF', padding: 20 },
  signalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  signalKicker: { color: colors.royal, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  signalTitle: { color: '#0F172A', fontSize: 24, fontWeight: '900', marginTop: 4 },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  good: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  okay: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  risk: { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' },
  scorePillText: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  scoreBigRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 22, marginBottom: 14 },
  scoreNumber: { color: colors.navy, fontSize: 64, fontWeight: '900', letterSpacing: 0 },
  scoreCaption: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingBottom: 10 },
  track: { height: 8, borderRadius: 999, backgroundColor: colors.ice, overflow: 'hidden' },
  trackLight: { backgroundColor: 'rgba(255,255,255,0.15)' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: colors.royal },
  fillLight: { backgroundColor: '#FFFFFF' },
  miniGrid: { flexDirection: 'row', gap: 10, marginTop: 18 },
  miniScore: { flex: 1, borderRadius: 18, backgroundColor: colors.ice, padding: 12 },
  miniLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  miniValue: { color: colors.navy, fontSize: 20, fontWeight: '900', marginTop: 4 },
  statsGrid: { gap: 12, padding: 18 },
  statCard: { borderRadius: 24, borderWidth: 1, borderColor: '#DCEBFA', backgroundColor: '#FFFFFF', padding: 18 },
  iconBubble: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.ice, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  iconText: { color: colors.royal, fontSize: 12, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  statValue: { color: '#0F172A', fontSize: 26, fontWeight: '900', marginTop: 4 },
  statHelper: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  card: { marginHorizontal: 18, marginTop: 16, borderRadius: 28, borderWidth: 1, borderColor: '#DCEBFA', backgroundColor: '#FFFFFF', padding: 18 },
  sectionTitleWrap: { flex: 1, marginBottom: 14 },
  eyebrow: { color: colors.royal, fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  sectionTitle: { color: '#0F172A', fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 2 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 4 },
  lightText: { color: '#FFFFFF' },
  lightMuted: { color: 'rgba(255,255,255,0.6)' },
  lightSubtext: { color: 'rgba(255,255,255,0.72)' },
  twoCol: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, marginBottom: 14 },
  label: { color: '#334155', fontSize: 13, fontWeight: '900', marginBottom: 7 },
  inputWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: '#DCEBFA', backgroundColor: '#FFFFFF', paddingHorizontal: 12 },
  affix: { color: '#94A3B8', fontSize: 15, fontWeight: '800' },
  input: { flex: 1, minHeight: 48, color: '#0F172A', fontSize: 16, fontWeight: '700', paddingHorizontal: 5 },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segment: { borderRadius: 999, borderWidth: 1, borderColor: '#DCEBFA', backgroundColor: colors.foam, paddingHorizontal: 12, paddingVertical: 10 },
  segmentActive: { backgroundColor: colors.royal, borderColor: colors.royal },
  segmentText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  segmentTextActive: { color: '#FFFFFF' },
  cardHeaderRow: { gap: 12, marginBottom: 4 },
  scoreTile: { borderRadius: 22, borderWidth: 1, borderColor: '#E6F0FB', backgroundColor: colors.foam, padding: 14, marginTop: 10 },
  scoreTileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  scoreTileTitle: { color: '#1E293B', fontSize: 14, fontWeight: '900' },
  scoreTileValue: { color: colors.royal, fontSize: 16, fontWeight: '900' },
  scoreTileHelper: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 9 },
  nextMove: { borderRadius: 22, borderWidth: 1, borderColor: '#E6F0FB', backgroundColor: colors.foam, padding: 14, marginTop: 10 },
  nextMoveTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  nextMoveTitle: { flex: 1, color: '#0F172A', fontSize: 15, fontWeight: '900' },
  amountPill: { borderRadius: 999, backgroundColor: colors.royal, paddingHorizontal: 12, paddingVertical: 6 },
  amountText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  nextMoveText: { color: '#475569', fontSize: 13, lineHeight: 21, marginTop: 10 },
  aiCard: { marginHorizontal: 18, marginTop: 16, borderRadius: 28, borderWidth: 1, borderColor: '#DCEBFA', backgroundColor: '#FFFFFF', overflow: 'hidden' },
  aiTop: { backgroundColor: colors.navy, padding: 18 },
  aiSummary: { color: 'rgba(255,255,255,0.92)', fontSize: 18, lineHeight: 28, fontWeight: '700' },
  guardrail: { margin: 18, borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB', padding: 14 },
  guardrailTitle: { color: '#78350F', fontSize: 14, fontWeight: '900', marginBottom: 5 },
  guardrailText: { color: '#92400E', fontSize: 13, lineHeight: 20 },
  timelineItem: { borderRadius: 20, borderWidth: 1, borderColor: '#E6F0FB', backgroundColor: colors.foam, padding: 14, marginTop: 10 },
  timelineText: { color: '#475569', fontSize: 13, lineHeight: 21, fontWeight: '700' },
  insightGrid: { paddingHorizontal: 18 },
  insight: { borderRadius: 24, borderWidth: 1, borderColor: '#DCEBFA', backgroundColor: '#FFFFFF', padding: 18, marginTop: 16 },
  insightTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  insightTitle: { flex: 1, color: '#0F172A', fontSize: 16, fontWeight: '900' },
  insightText: { color: '#475569', fontSize: 14, lineHeight: 22 },
});
