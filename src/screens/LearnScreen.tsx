import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { theme } from '../utils/theme';

const lessons = [
  ['Emergency fund', 'This is boring money that protects you when life punches you in the face. Young adults usually need 3 to 6 months of core expenses.'],
  ['Debt avalanche', 'Pay minimums on every debt, then throw extra money at the highest interest rate first. This saves the most interest.'],
  ['Roth vs traditional', 'Roth is often attractive for younger people who may earn more later. Traditional can help when today’s tax rate is high.'],
  ['Insurance', 'Insurance is for risks that can financially wreck you. Health, auto, renters/home, disability, and term life are the main categories.'],
  ['Marriage and divorce planning', 'Money planning before marriage is not unromantic. It protects both people by setting clear expectations.'],
  ['Investing', 'A simple diversified ETF portfolio usually beats trying to pick hot stocks with your rent money. Automate it and keep fees low.'],
];

export default function LearnScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Learn" subtitle="Simple explanations so users understand the graphs and results." />
      {lessons.map(([title, body]) => <Card key={title}><Text style={styles.title}>{title}</Text><Text style={styles.body}>{body}</Text></Card>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: 18, paddingTop: 56, paddingBottom: 100 }, title: { fontSize: 19, color: theme.colors.secondary, fontWeight: '900', marginBottom: 8 }, body: { color: theme.colors.text, lineHeight: 23, fontSize: 15 } });
