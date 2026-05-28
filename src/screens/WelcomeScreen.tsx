import React from 'react';
import { Image, ScrollView, Text, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const compactWidth = Math.min(360, Math.max(0, width - 56));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.topBar, !isWide && styles.topBarCompact]}>
        <Image source={require('../../assets/blacktip-logo-official.png')} style={[styles.logo, !isWide && styles.logoCompact]} resizeMode="contain" />
        <TouchableOpacity style={styles.smallButton} onPress={() => navigation.replace('Main')}>
          <Text style={styles.smallButtonText}>Start plan</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.brandTitle, !isWide && styles.brandTitleCompact]}>Blacktip Wealth</Text>

      <View style={[styles.hero, isWide && styles.heroWide]}>
        <View style={[styles.heroCopy, isWide ? styles.heroCopyWide : { width: compactWidth, maxWidth: compactWidth }]}>
          <Text style={styles.badge}>BLACKTIP WEALTH</Text>
          <Text style={[styles.title, !isWide && styles.titleCompact]}>Sharper move for financial planning.</Text>
          <Text style={[styles.copy, !isWide && styles.copyCompact]}>
            A personal decision engine for cash flow, debt, investing, taxes, insurance, housing, and the goals that compete for your money.
          </Text>
          <View style={[styles.actions, !isWide && styles.actionsCompact]}>
            <TouchableOpacity style={[styles.button, !isWide && styles.actionButtonCompact]} onPress={() => navigation.replace('Main')}>
              <Text style={styles.buttonText}>Build my plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ghostButton, !isWide && styles.actionButtonCompact]} onPress={() => navigation.replace('Main')}>
              <Text style={styles.ghostButtonText}>Preview dashboard</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.proofRow}>
            <Proof value="10 yr" label="wealth path" />
            <Proof value="6" label="planning areas" />
            <Proof value="7 day" label="action list" />
          </View>
        </View>

        <View style={[styles.previewWrap, isWide ? styles.previewWrapWide : { width: compactWidth, maxWidth: compactWidth }]}>
          <View style={styles.signal}>
            <View style={[styles.signalTop, !isWide && styles.signalTopCompact]}>
              <View>
                <Text style={styles.signalKicker}>WEALTH SIGNAL</Text>
                <Text style={styles.signalTitle}>Financial Health</Text>
              </View>
              <Text style={styles.live}>Live 85/100</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.score}>85</Text>
              <Text style={styles.scoreContext}>/ 100{'\n'}current plan strength</Text>
            </View>
            <View style={styles.track}><View style={styles.fill} /></View>
            <View style={styles.signalGrid}>
              <Signal label="Cash" value="88" tone="blue" />
              <Signal label="Debt" value="82" tone="green" />
              <Signal label="Future" value="86" tone="green" />
            </View>
            <View style={styles.nextMove}>
              <Text style={styles.nextMoveLabel}>Highest priority</Text>
              <Text style={styles.nextMoveText}>Keep automated savings on track and review one new goal.</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.valueBand}>
        <ValuePill title="Personalized" text="Plans react to your actual goals, debt, income, and timeline." />
        <ValuePill title="Actionable" text="Turns the dashboard into weekly money moves." />
        <ValuePill title="Educational" text="Clear guidance with professional-advice boundaries." />
      </View>

      <Text style={styles.disclaimer}>Educational planning only. Not tax, legal, investment, or insurance advice.</Text>
    </ScrollView>
  );
}

function Signal({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'red' | 'green' }) {
  const color = tone === 'blue' ? theme.colors.logoBlue : tone === 'red' ? theme.colors.danger : theme.colors.success;
  return (
    <View style={styles.signalTile}>
      <Text style={styles.signalLabel}>{label}</Text>
      <Text style={[styles.signalValue, { color }]}>{value}</Text>
    </View>
  );
}

function Proof({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.proof}>
      <Text style={styles.proofValue}>{value}</Text>
      <Text style={styles.proofLabel}>{label}</Text>
    </View>
  );
}

function ValuePill({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.valuePill}>
      <Text style={styles.valueTitle}>{title}</Text>
      <Text style={styles.valueText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.logoBlue },
  content: { minHeight: '100%', padding: 28, paddingTop: 30 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 18 },
  topBarCompact: { flexDirection: 'column', alignItems: 'flex-start', gap: 12 },
  logo: { width: 168, height: 72 },
  logoCompact: { width: 128, height: 72 },
  smallButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 13, borderRadius: 8 },
  smallButtonText: { color: theme.colors.logoBlue, fontWeight: '900', fontSize: 15 },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 92,
    lineHeight: 100,
    fontWeight: '900',
    marginTop: 30,
  },
  brandTitleCompact: { fontSize: 48, lineHeight: 56, marginTop: 22 },
  hero: { marginTop: 26, gap: 28 },
  heroWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroCopy: { width: '100%' },
  heroCopyWide: { flex: 1, maxWidth: 760, paddingRight: 34 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    color: '#D9ECFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    fontWeight: '900',
    marginBottom: 18,
  },
  title: { fontSize: 56, lineHeight: 62, fontWeight: '900', color: '#FFFFFF', marginBottom: 18 },
  titleCompact: { fontSize: 40, lineHeight: 46 },
  copy: { color: '#D8EBFF', fontSize: 20, lineHeight: 31, marginBottom: 26 },
  copyCompact: { fontSize: 17, lineHeight: 27 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  actionsCompact: { flexDirection: 'column', alignItems: 'stretch', width: '100%' },
  button: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 17, paddingHorizontal: 28, alignItems: 'center' },
  actionButtonCompact: { width: '100%' },
  buttonText: { color: theme.colors.logoBlue, fontSize: 17, fontWeight: '900' },
  ghostButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 17,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  ghostButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  proofRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 },
  proof: {
    minWidth: 124,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 8,
    padding: 14,
  },
  proofValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  proofLabel: { color: '#BFDFFF', fontWeight: '800', marginTop: 4 },
  previewWrap: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    padding: 14,
  },
  previewWrapWide: { width: 560 },
  signal: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 24 },
  signalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
  signalTopCompact: { flexDirection: 'column' },
  signalKicker: { color: theme.colors.logoBlue, fontWeight: '900', letterSpacing: 0 },
  live: { color: theme.colors.danger, backgroundColor: '#FFF1F1', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, fontWeight: '900' },
  signalTitle: { color: '#071427', fontSize: 28, fontWeight: '900', marginTop: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  score: { color: theme.colors.logoBlueDark, fontSize: 64, fontWeight: '900', lineHeight: 68 },
  scoreContext: { color: theme.colors.muted, fontSize: 16, lineHeight: 22, marginLeft: 12 },
  track: { height: 10, backgroundColor: '#E8F1FA', borderRadius: 999, overflow: 'hidden', marginVertical: 20 },
  fill: { width: '85%', height: '100%', backgroundColor: theme.colors.logoBlue },
  signalGrid: { flexDirection: 'row', gap: 10 },
  signalTile: { flex: 1, backgroundColor: '#EFF7FF', borderRadius: 8, padding: 14 },
  signalLabel: { color: theme.colors.muted, fontWeight: '800' },
  signalValue: { fontSize: 22, fontWeight: '900', marginTop: 6 },
  nextMove: { backgroundColor: theme.colors.logoBlue, borderRadius: 8, padding: 16, marginTop: 16 },
  nextMoveLabel: { color: '#BFDFFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  nextMoveText: { color: '#FFFFFF', fontWeight: '900', lineHeight: 22, marginTop: 6 },
  valueBand: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 },
  valuePill: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  valueTitle: { color: theme.colors.logoBlue, fontWeight: '900', fontSize: 16 },
  valueText: { color: theme.colors.text, lineHeight: 21, marginTop: 6 },
  disclaimer: { color: '#C6E4FF', marginTop: 18, lineHeight: 20 },
});
