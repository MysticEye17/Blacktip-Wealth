import { ClientProfile, Goal, ProjectionPoint, Recommendation } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const money = (value: number) => `$${Math.round(value).toLocaleString()}`;

export function monthlySurplus(profile: ClientProfile) {
  return profile.income / 12 - profile.monthlyExpenses;
}

export function emergencyFundTarget(profile: ClientProfile) {
  const months = profile.dependents > 0 || profile.riskTolerance === 'low' ? 6 : 4;
  return profile.monthlyExpenses * months;
}

export function netWorth(profile: ClientProfile) {
  return profile.cashSavings + profile.investments + profile.retirement - profile.debt - profile.studentLoans;
}

export function bmi(profile: ClientProfile) {
  if (!profile.heightInches || !profile.weightLbs) return 0;
  return (profile.weightLbs / (profile.heightInches * profile.heightInches)) * 703;
}

export function riskAllocation(profile: ClientProfile) {
  const ageStockRule = clamp(120 - profile.age, 45, 95);
  const riskAdjustment = profile.riskTolerance === 'high' ? 8 : profile.riskTolerance === 'low' ? -12 : 0;
  const stock = clamp(ageStockRule + riskAdjustment, 35, 95);
  const bonds = clamp(100 - stock - 5, 0, 60);
  const cash = 100 - stock - bonds;
  return { stock, bonds, cash };
}

export function recommendedMonthlyPlan(profile: ClientProfile) {
  const surplus = Math.max(0, monthlySurplus(profile));
  const emergencyGap = Math.max(0, emergencyFundTarget(profile) - profile.cashSavings);
  const debtAggressive = profile.debtRate >= 7;
  const emergency = emergencyGap > 0 ? surplus * 0.45 : surplus * 0.1;
  const debt = debtAggressive ? surplus * 0.3 : surplus * 0.15;
  const retirement = surplus * (profile.age < 30 ? 0.25 : 0.2);
  const taxable = Math.max(0, surplus - emergency - debt - retirement);
  return { surplus, emergency, debt, retirement, taxable };
}

export function buildRecommendations(profile: ClientProfile, goals: Goal[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const surplus = monthlySurplus(profile);
  const efTarget = emergencyFundTarget(profile);
  const allocation = riskAllocation(profile);
  const currentBmi = bmi(profile);

  if (profile.cashSavings < efTarget) {
    recs.push({
      title: 'Build your emergency fund first',
      category: 'Cash',
      priority: 'High',
      explanation: `You have ${money(profile.cashSavings)} in cash. A safer target is about ${money(efTarget)}, based on your monthly expenses and risk profile.`,
      action: `Move about ${money(recommendedMonthlyPlan(profile).emergency)} per month into high-yield savings until funded.`,
    });
  }

  if (profile.debt + profile.studentLoans > 0 && profile.debtRate >= 7) {
    recs.push({
      title: 'Attack high-interest debt before extra investing',
      category: 'Debt',
      priority: 'High',
      explanation: `Debt costing around ${profile.debtRate}% is a guaranteed drag. Paying it down can beat many low-risk investments.`,
      action: `Use the avalanche method: minimum payments on everything, extra dollars to the highest rate balance.`,
    });
  }

  recs.push({
    title: 'Use a simple age-and-risk investment mix',
    category: 'Investing',
    priority: 'Medium',
    explanation: `Based on age ${profile.age} and ${profile.riskTolerance} risk tolerance, a starter allocation is approximately ${allocation.stock}% stock ETFs, ${allocation.bonds}% bond ETFs, and ${allocation.cash}% cash.`,
    action: 'Automate monthly investing after emergency cash and expensive debt are under control.',
  });

  if (!profile.hasDisabilityInsurance && profile.income > 40000) {
    recs.push({
      title: 'Protect your income with disability coverage',
      category: 'Insurance',
      priority: 'High',
      explanation: 'For young adults, future income is usually the biggest financial asset. Disability coverage protects that paycheck.',
      action: 'Check employer benefits first, then quote an individual long-term disability policy if needed.',
    });
  }

  if ((profile.dependents > 0 || profile.relationshipStatus === 'married') && !profile.hasLifeInsurance) {
    recs.push({
      title: 'Consider term life insurance',
      category: 'Insurance',
      priority: 'Medium',
      explanation: 'Life insurance matters most when someone else depends on your income or debt obligations.',
      action: 'Compare 20- to 30-year term life quotes for 10x to 15x income coverage.',
    });
  }

  if (profile.relationshipStatus === 'engaged' || profile.relationshipStatus === 'married') {
    recs.push({
      title: 'Plan marriage finances before merging accounts',
      category: 'Life Planning',
      priority: 'Medium',
      explanation: 'Marriage changes budgeting, taxes, insurance beneficiaries, estate documents, and debt responsibility conversations.',
      action: 'Create a joint budget, define separate vs. joint accounts, and compare married filing jointly vs separately.',
    });
  }

  if (surplus < 0) {
    recs.push({
      title: 'Spending reset needed',
      category: 'Cash',
      priority: 'High',
      explanation: `Your monthly cash flow is negative by about ${money(Math.abs(surplus))}. No plan works until cash flow turns positive.`,
      action: 'Cut the three largest flexible expenses or increase income before adding new goals.',
    });
  }

  const urgentGoal = goals.find(g => g.priority === 'high' && g.targetAmount > g.currentAmount);
  if (urgentGoal) {
    const needed = (urgentGoal.targetAmount - urgentGoal.currentAmount) / Math.max(1, urgentGoal.years * 12);
    recs.push({
      title: `Fund goal: ${urgentGoal.name}`,
      category: 'Cash',
      priority: 'Medium',
      explanation: `To hit ${money(urgentGoal.targetAmount)} in ${urgentGoal.years} year(s), you need about ${money(needed)} per month before investment returns.`,
      action: 'Create a separate goal bucket and automate transfers on payday.',
    });
  }

  if (currentBmi >= 30) {
    recs.push({
      title: 'Health data may affect insurance planning',
      category: 'Insurance',
      priority: 'Low',
      explanation: 'Some insurance underwriting can consider health markers. This app should use health inputs carefully and respectfully.',
      action: 'Use health inputs only to explain potential insurance needs, not to shame or overreach.',
    });
  }

  recs.push({
    title: 'Tax basics for young adults',
    category: 'Tax',
    priority: 'Medium',
    explanation: 'Tax planning starts with retirement account choice, HSA eligibility, deductions, student loan interest, and filing status.',
    action: 'Prioritize employer match, then Roth vs traditional contributions based on current vs future expected tax bracket.',
  });

  return recs.sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.priority] - { High: 0, Medium: 1, Low: 2 }[b.priority]));
}

export function projectNetWorth(profile: ClientProfile, years = 10): ProjectionPoint[] {
  const plan = recommendedMonthlyPlan(profile);
  const allocation = riskAllocation(profile);
  const annualReturn = allocation.stock / 100 * 0.07 + allocation.bonds / 100 * 0.035 + allocation.cash / 100 * 0.015;
  let cash = profile.cashSavings;
  let investments = profile.investments;
  let retirement = profile.retirement;
  let debt = profile.debt + profile.studentLoans;
  const points: ProjectionPoint[] = [];

  for (let y = 0; y <= years; y++) {
    points.push({ year: y, cash, investments, retirement, debt, netWorth: cash + investments + retirement - debt });
    cash += plan.emergency * 12;
    investments = investments * (1 + annualReturn) + plan.taxable * 12;
    retirement = retirement * (1 + annualReturn) + plan.retirement * 12;
    debt = Math.max(0, debt * (1 + profile.debtRate / 100) - plan.debt * 12);
  }
  return points;
}
