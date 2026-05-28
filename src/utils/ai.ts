import { ClientProfile, Goal, PlanningModule, ProjectionPoint, Recommendation } from '../types';
import appConfig from '../../app.json';

function localExplanation(profile: ClientProfile, goals: Goal[], recs: Recommendation[], planningModules: PlanningModule[], projection: ProjectionPoint[] = []) {
  const topModule = [...planningModules].sort((a, b) => a.score - b.score)[0];
  const topGoal = goals.find(goal => goal.priority === 'high') || goals[0];
  const finalProjection = projection[projection.length - 1];
  const projectionText = finalProjection ? ` The 10-year projection ends near $${Math.round(finalProjection.netWorth).toLocaleString()}, assuming the current monthly plan is followed.` : '';
  const firstMove = recs[0]?.action || 'Keep profile inputs current and review the plan after income, debt, or goal changes.';

  return [
    `Blacktip's built-in analysis sees ${profile.name || 'this client'} as strongest where the score is already stable, and most exposed around ${topModule?.title || 'the lowest-scoring module'}.${projectionText}`,
    `The highest-value next move is: ${firstMove}`,
    topGoal ? `The plan should stay anchored to "${topGoal.name}" because goal funding affects cash flow, investing capacity, and debt payoff timing.` : '',
    'OpenAI can add a more conversational advisor-style memo when the secure backend proxy is configured, but the app should still show these calculation-based explanations without it. Educational only, not tax, legal, investment, insurance, or financial advice.',
  ].filter(Boolean).join('\n\n');
}

export async function explainWithAI(
  profile: ClientProfile,
  goals: Goal[],
  recs: Recommendation[],
  planningModules: PlanningModule[] = [],
  projection: ProjectionPoint[] = [],
) {
  const proxyUrl = appConfig.expo?.extra?.openAiProxyUrl;
  if (!proxyUrl) {
    return localExplanation(profile, goals, recs, planningModules, projection);
  }

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, goals, recommendations: recs, planningModules, projection }),
  });

  if (!response.ok) throw new Error('AI explanation failed');
  const data = await response.json();
  return data.explanation || 'No explanation returned.';
}

export async function weeklySuggestionsWithAI(
  profile: ClientProfile,
  goals: Goal[],
  recs: Recommendation[],
  planningModules: PlanningModule[] = [],
) {
  const proxyUrl = appConfig.expo?.extra?.openAiProxyUrl;
  if (!proxyUrl) {
    return localWeeklySuggestions(profile, goals, recs, planningModules);
  }

  const weeklyUrl = /\/explain\/?$/.test(proxyUrl) ? proxyUrl.replace(/\/explain\/?$/, '/weekly-suggestions') : `${proxyUrl.replace(/\/$/, '')}/weekly-suggestions`;
  const response = await fetch(weeklyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, goals, recommendations: recs, planningModules }),
  });

  if (!response.ok) throw new Error('AI weekly suggestions failed');
  const data = await response.json();
  return data.suggestions || localWeeklySuggestions(profile, goals, recs, planningModules);
}

function localWeeklySuggestions(profile: ClientProfile, goals: Goal[], recs: Recommendation[], planningModules: PlanningModule[]) {
  const weakest = [...planningModules].sort((a, b) => a.score - b.score)[0];
  const topGoal = goals.find(goal => goal.priority === 'high') || goals[0];
  const first = recs[0]?.action || 'Review spending and move one extra dollar toward the highest-priority goal.';
  const second = weakest?.nextMove || 'Open the planning tab and review the lowest-scoring module.';
  const third = topGoal ? `Check whether "${topGoal.name}" is still realistic by its target date and adjust the monthly transfer if needed.` : 'Add one short-term goal with a target date.';

  return [
    `1. ${first}`,
    `2. ${second}`,
    `3. ${third}`,
    `4. Spend 15 minutes this week updating one profile input that changed recently: income, expenses, vehicle costs, insurance, or family support.`,
  ].join('\n\n');
}
