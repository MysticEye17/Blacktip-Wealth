import React, { useCallback, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import Pill from '../components/Pill';
import SectionHeader from '../components/SectionHeader';
import { ClientProfile, Goal, PlanningChart as PlanningChartType, PlanningModule } from '../types';
import { buildPlanningModules } from '../utils/calculations';
import { defaultGoals, defaultProfile } from '../utils/defaultData';
import { loadGoals, loadProfile } from '../utils/storage';
import { theme } from '../utils/theme';

const categories: ('All' | PlanningModule['category'])[] = ['All', 'Taxes', 'Wealth', 'Life'];

export default function PlanningScreen() {
  const [profile, setProfile] = useState<ClientProfile>(defaultProfile);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [category, setCategory] = useState<'All' | PlanningModule['category']>('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PlanningModule | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  useFocusEffect(useCallback(() => {
    loadProfile().then(setProfile);
    loadGoals().then(setGoals);
  }, []));

  const modules = useMemo(() => buildPlanningModules(profile, goals), [profile, goals]);
  const filtered = modules.filter(module => {
    const term = query.trim().toLowerCase();
    const matchesCategory = category === 'All' || module.category === category;
    const matchesSearch = !term || [module.title, module.category, module.summary, module.nextMove].join(' ').toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Plan" subtitle="Search any topic, scan the mini-result, then open the card for the full calculation and plain-English next move." />
        <TextInput
          placeholder="Search taxes, mortgage, IRA, marriage, car, travel..."
          placeholderTextColor="#71839B"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <View style={styles.menu}>
          {categories.map(item => (
            <Pill key={item} label={item} active={category === item} onPress={() => setCategory(item)} />
          ))}
        </View>

        <View style={styles.moduleGrid}>
          {filtered.map(module => (
            <TouchableOpacity key={module.id} activeOpacity={0.86} onPress={() => setSelected(module)} style={[styles.moduleWrap, { width: isWide ? '48.6%' : '100%' }]}>
              <Card style={styles.moduleCard}>
                <View style={styles.moduleTop}>
                  <Text style={styles.moduleCategory}>{module.category}</Text>
                  <Text style={[styles.score, module.score < 50 && styles.scoreLow]}>{Math.round(module.score)}/100</Text>
                </View>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.metric}>{module.metric}</Text>
                {module.chart ? <PlanningChart chart={module.chart} /> : <StatsSummary stats={module.stats} />}
                <Text style={styles.summary}>{module.summary}</Text>
                <Text style={styles.previewDetail}>{module.details[0]}</Text>
                <View style={styles.statsRow}>
                  {module.stats.slice(0, 3).map(stat => (
                    <View key={stat.label} style={styles.stat}>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalTop}>
                <View>
                  <Text style={styles.moduleCategory}>{selected?.category}</Text>
                  <Text style={styles.modalTitle}>{selected?.title}</Text>
                </View>
                <TouchableOpacity style={styles.close} onPress={() => setSelected(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              {selected ? (
                <>
                  <View style={styles.detailScore}>
                    <Text style={styles.detailScoreText}>{Math.round(selected.score)}</Text>
                    <View style={styles.detailTrack}><View style={[styles.detailFill, { width: `${Math.round(selected.score)}%` }]} /></View>
                  </View>
                  <Text style={styles.detailMetric}>{selected.metric}</Text>
                  {selected.chart ? <PlanningChart chart={selected.chart} tall /> : <StatsSummary stats={selected.stats} large />}
                  <View style={styles.detailStats}>
                    {selected.stats.map(stat => (
                      <View key={stat.label} style={styles.detailStat}>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                      </View>
                    ))}
                  </View>
                  {selected.details.map(item => <Text key={item} style={styles.detailText}>{item}</Text>)}
                  <View style={styles.nextMove}>
                    <Text style={styles.nextMoveLabel}>Next move</Text>
                    <Text style={styles.nextMoveText}>{selected.nextMove}</Text>
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PlanningChart({ chart, tall = false }: { chart: PlanningChartType; tall?: boolean }) {
  const max = Math.max(1, ...chart.values.map(value => Math.abs(value)));
  const chartHeight = tall ? 118 : 54;
  const colors = [theme.colors.primary, theme.colors.wave, theme.colors.deepBlue];
  return (
    <View style={[styles.chartWrap, tall && styles.chartWrapTall]}>
      <View style={styles.chartTitleRow}>
        <Text style={styles.chartTitle}>{chart.title}</Text>
        <Text style={styles.axisLabel}>{chart.yAxisLabel}</Text>
      </View>
      <View style={[styles.chart, tall && styles.chartTall]}>
        <Text style={styles.yMax}>{formatChartValue(max, chart)}</Text>
        <Text style={styles.yMin}>0</Text>
        <View style={styles.chartBaseline} />
        {chart.values.map((value, index) => {
          const height = Math.max(8, Math.min(chartHeight, Math.abs(value) / max * chartHeight));
          return (
            <View key={`${chart.labels[index]}-${index}`} style={styles.barColumn}>
              <View style={[styles.bar, { height, backgroundColor: colors[index % colors.length] }]} />
              <Text style={styles.barValue}>{formatChartValue(value, chart)}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.xLabels}>
        {chart.labels.map(label => <Text key={label} style={styles.xLabel} numberOfLines={2}>{label}</Text>)}
      </View>
      <Text style={styles.xAxis}>{chart.xAxisLabel}</Text>
    </View>
  );
}

function StatsSummary({ stats, large = false }: { stats: PlanningModule['stats']; large?: boolean }) {
  return (
    <View style={[styles.statsOnly, large && styles.statsOnlyLarge]}>
      {stats.map(stat => (
        <View key={stat.label} style={styles.statsOnlyItem}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={styles.statValue}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

function formatChartValue(value: number, chart: PlanningChartType) {
  const rounded = Math.abs(value) >= 1000 ? Math.round(value).toLocaleString() : Math.round(value * 10) / 10;
  return `${chart.valuePrefix || ''}${rounded}${chart.valueSuffix || ''}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingTop: 34, paddingBottom: 104 },
  search: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  menu: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleWrap: { marginBottom: 14 },
  moduleCard: { marginBottom: 0, minHeight: 348 },
  moduleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moduleCategory: { color: theme.colors.primary, fontWeight: '900', fontSize: 12, letterSpacing: 0, textTransform: 'uppercase' },
  score: { color: theme.colors.primary, fontWeight: '900' },
  scoreLow: { color: theme.colors.danger },
  moduleTitle: { color: theme.colors.secondary, fontSize: 20, fontWeight: '900', marginTop: 8 },
  metric: { color: theme.colors.accent, fontSize: 24, fontWeight: '900', marginTop: 8 },
  summary: { color: theme.colors.text, lineHeight: 21, minHeight: 63 },
  previewDetail: { color: theme.colors.muted, lineHeight: 20, marginTop: 8, marginBottom: 12 },
  chartWrap: { marginVertical: 16, borderWidth: 1, borderColor: theme.colors.hairline, borderRadius: 8, padding: 10, backgroundColor: '#FFFFFF' },
  chartWrapTall: { marginBottom: 18 },
  chartTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  chartTitle: { color: theme.colors.secondary, fontWeight: '900', flex: 1 },
  axisLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '800' },
  chart: { height: 86, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingLeft: 28, paddingRight: 2, position: 'relative' },
  chartTall: { height: 150 },
  chartBaseline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: theme.colors.border },
  yMax: { position: 'absolute', left: 0, top: 0, color: theme.colors.muted, fontSize: 10, fontWeight: '800' },
  yMin: { position: 'absolute', left: 0, bottom: 2, color: theme.colors.muted, fontSize: 10, fontWeight: '800' },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 },
  bar: { width: '78%', maxWidth: 56, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barValue: { color: theme.colors.muted, fontSize: 10, fontWeight: '800', marginTop: 4 },
  xLabels: { flexDirection: 'row', gap: 8, paddingLeft: 28, marginTop: 8 },
  xLabel: { flex: 1, color: theme.colors.secondary, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  xAxis: { color: theme.colors.muted, fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  statsOnly: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  statsOnlyLarge: { flexWrap: 'wrap' },
  statsOnlyItem: { flex: 1, minWidth: 96, backgroundColor: theme.colors.primaryLight, borderRadius: 8, padding: 10 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: theme.colors.panel, borderRadius: 8, padding: 10 },
  statLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '700' },
  statValue: { color: theme.colors.secondary, fontSize: 14, fontWeight: '900', marginTop: 4 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4, 18, 38, 0.48)' },
  modal: { maxHeight: '88%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 8, borderTopRightRadius: 8, padding: 22 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  modalTitle: { color: theme.colors.secondary, fontSize: 28, fontWeight: '900', marginTop: 4 },
  close: { backgroundColor: theme.colors.panel, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  closeText: { color: theme.colors.deepBlue, fontWeight: '900' },
  detailScore: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailScoreText: { color: theme.colors.deepBlue, fontSize: 48, fontWeight: '900', marginRight: 16 },
  detailTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: '#E9F0F8', overflow: 'hidden' },
  detailFill: { height: '100%', backgroundColor: theme.colors.primary },
  detailMetric: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginBottom: 8 },
  detailStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  detailStat: { width: '31%', minWidth: 110, backgroundColor: theme.colors.panel, borderRadius: 8, padding: 12 },
  detailText: { color: theme.colors.text, lineHeight: 23, marginBottom: 10 },
  nextMove: { backgroundColor: theme.colors.deepBlue, borderRadius: 8, padding: 18, marginTop: 8, marginBottom: 20 },
  nextMoveLabel: { color: '#BFD8F6', fontWeight: '900', textTransform: 'uppercase', fontSize: 12, letterSpacing: 0 },
  nextMoveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', lineHeight: 26, marginTop: 8 },
});
