import { ClientProfile, FilingStatus, Goal, PlanningModule, ProjectionPoint, Recommendation } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const money = (value: number) => `$${Math.round(value).toLocaleString()}`;
export const percent = (value: number) => `${Math.round(value)}%`;

export function goalYears(goal: Goal) {
  if (!goal.targetDate) return Math.max(1 / 12, goal.years || 1);
  const target = new Date(`${goal.targetDate}T00:00:00`);
  const now = new Date();
  const months = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth());
  return months / 12;
}

function hasHealthCoverage(profile: ClientProfile) {
  return profile.healthInsurance ? profile.healthInsurance !== 'none' : profile.hasHealthInsurance;
}

function hasLifeCoverage(profile: ClientProfile) {
  return profile.lifeInsurance ? profile.lifeInsurance !== 'none' : profile.hasLifeInsurance;
}

function hasDisabilityCoverage(profile: ClientProfile) {
  return profile.disabilityInsurance ? profile.disabilityInsurance !== 'none' : profile.hasDisabilityInsurance;
}

function hasAutoCoverage(profile: ClientProfile) {
  return profile.autoInsurance ? profile.autoInsurance !== 'none' : profile.hasAutoInsurance;
}

export function monthlySurplus(profile: ClientProfile) {
  return profile.income / 12 - profile.monthlyExpenses - profile.parentSupportMonthly;
}

export function emergencyFundTarget(profile: ClientProfile) {
  const months = profile.dependents > 0 || profile.riskTolerance === 'low' ? 6 : 4;
  return profile.monthlyExpenses * months;
}

export function netWorth(profile: ClientProfile) {
  return profile.cashSavings + profile.investments + profile.retirement + profile.carValue - profile.debt - profile.studentLoans - profile.carLoanBalance;
}

export function bmi(profile: ClientProfile) {
  if (!profile.heightInches || !profile.weightLbs) return 0;
  return (profile.weightLbs / (profile.heightInches * profile.heightInches)) * 703;
}

export function riskAllocation(profile: ClientProfile) {
  const ageStockRule = clamp(110 - profile.age, 40, 95);
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

export function grossHouseholdIncome(profile: ClientProfile) {
  return profile.income + (profile.relationshipStatus === 'married' ? profile.partnerIncome : 0);
}

export function retirementRate(profile: ClientProfile) {
  return grossHouseholdIncome(profile) ? profile.currentRetirementContribution / grossHouseholdIncome(profile) : 0;
}

const ordinaryBrackets: Record<FilingStatus, { cap: number; rate: number }[]> = {
  single: [
    { cap: 12400, rate: 0.1 },
    { cap: 50400, rate: 0.12 },
    { cap: 105700, rate: 0.22 },
    { cap: 201775, rate: 0.24 },
    { cap: 256225, rate: 0.32 },
    { cap: 640600, rate: 0.35 },
    { cap: Infinity, rate: 0.37 },
  ],
  marriedJoint: [
    { cap: 24800, rate: 0.1 },
    { cap: 100800, rate: 0.12 },
    { cap: 211400, rate: 0.22 },
    { cap: 403550, rate: 0.24 },
    { cap: 512450, rate: 0.32 },
    { cap: 768700, rate: 0.35 },
    { cap: Infinity, rate: 0.37 },
  ],
  headOfHousehold: [
    { cap: 17700, rate: 0.1 },
    { cap: 67450, rate: 0.12 },
    { cap: 105700, rate: 0.22 },
    { cap: 201750, rate: 0.24 },
    { cap: 256200, rate: 0.32 },
    { cap: 640600, rate: 0.35 },
    { cap: Infinity, rate: 0.37 },
  ],
};

const standardDeduction: Record<FilingStatus, number> = {
  single: 16100,
  marriedJoint: 32200,
  headOfHousehold: 24150,
};

export function taxableIncome(profile: ClientProfile, filingStatus = profile.taxFilingStatus, income = grossHouseholdIncome(profile)) {
  return Math.max(0, income - standardDeduction[filingStatus] - profile.currentRetirementContribution);
}

export function federalTaxFromTaxable(taxable: number, filingStatus: FilingStatus) {
  let tax = 0;
  let previous = 0;
  for (const bracket of ordinaryBrackets[filingStatus]) {
    const dollars = Math.max(0, Math.min(taxable, bracket.cap) - previous);
    tax += dollars * bracket.rate;
    previous = bracket.cap;
    if (taxable <= bracket.cap) break;
  }
  return tax;
}

export function federalTax(profile: ClientProfile, filingStatus = profile.taxFilingStatus, income = grossHouseholdIncome(profile)) {
  return federalTaxFromTaxable(taxableIncome(profile, filingStatus, income), filingStatus);
}

export function marginalTaxRate(profile: ClientProfile) {
  const income = taxableIncome(profile);
  return ordinaryBrackets[profile.taxFilingStatus].find(bracket => income <= bracket.cap)?.rate || 0.37;
}

export function iraRecommendation(profile: ClientProfile) {
  const filing = profile.relationshipStatus === 'married' ? 'marriedJoint' : 'single';
  const income = grossHouseholdIncome(profile);
  const rothLimit = filing === 'marriedJoint' ? 252000 : 168000;
  const traditionalDeductionLimit = filing === 'marriedJoint' ? 149000 : 91000;
  const currentRate = marginalTaxRate(profile);
  const futureLikelyHigher = profile.age < 35 && income < traditionalDeductionLimit && profile.riskTolerance !== 'low';

  if (income > rothLimit) {
    return {
      account: 'Traditional IRA / 401(k)',
      reason: 'Income is above the simple Roth IRA limit from the presentation. Pre-tax workplace contributions may still create tax savings.',
      annualLimit: 7500,
      score: 58,
    };
  }

  if (futureLikelyHigher) {
    return {
      account: 'Roth IRA',
      reason: 'The presentation frames Roth as strongest when future tax rates are expected to be higher than today.',
      annualLimit: 7500,
      score: 86,
    };
  }

  return {
    account: currentRate >= 0.24 ? 'Traditional IRA / 401(k)' : 'Roth IRA',
    reason: currentRate >= 0.24 ? 'A higher current bracket makes a deduction more valuable today.' : 'A lower current bracket makes paying tax now more attractive.',
    annualLimit: 7500,
    score: currentRate >= 0.24 ? 78 : 82,
  };
}

export function marriageTaxDelta(profile: ClientProfile) {
  const singleA = federalTax(profile, 'single', profile.income);
  const singleB = federalTax(profile, 'single', profile.partnerIncome);
  const married = federalTax(profile, 'marriedJoint', profile.income + profile.partnerIncome);
  return married - singleA - singleB;
}

export function monthlyMortgagePayment(principal: number, annualRate: number, years: number) {
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  if (!principal || !months) return 0;
  if (!monthlyRate) return principal / months;
  return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
}

export function housingReadiness(profile: ClientProfile) {
  const downPaymentTarget = profile.desiredHomePrice * 0.2;
  const principal = Math.max(0, profile.desiredHomePrice - profile.downPaymentSaved);
  const payment = monthlyMortgagePayment(principal, profile.mortgageRate, profile.mortgageYears);
  const totalHousing = payment + profile.desiredHomePrice * 0.012 / 12 + profile.desiredHomePrice * 0.006 / 12;
  const dti = grossHouseholdIncome(profile) ? totalHousing * 12 / grossHouseholdIncome(profile) : 1;
  const score = clamp(100 - Math.max(0, dti - 0.28) * 180 - Math.max(0, downPaymentTarget - profile.downPaymentSaved) / Math.max(1, downPaymentTarget) * 35, 15, 96);
  return { downPaymentTarget, payment, totalHousing, dti, score };
}

export function carAffordability(profile: ClientProfile) {
  const monthlyIncome = grossHouseholdIncome(profile) / 12;
  const carBurden = monthlyIncome ? profile.carPayment / monthlyIncome : 0;
  const score = clamp(100 - carBurden * 450 - Math.max(0, profile.carLoanRate - 6) * 4, 18, 96);
  return { carBurden, score };
}

export function vacationMonthlyNeed(profile: ClientProfile) {
  return profile.annualTravelBudget / 12;
}

export function insuranceScore(profile: ClientProfile) {
  let score = 25;
  if (hasHealthCoverage(profile)) score += 20;
  if (hasAutoCoverage(profile)) score += profile.autoInsurance === 'full' ? 18 : 12;
  if (hasDisabilityCoverage(profile)) score += profile.income > 40000 ? 25 : 15;
  if (hasLifeCoverage(profile) || (profile.dependents === 0 && profile.relationshipStatus !== 'married')) score += 15;
  return clamp(score, 0, 100);
}

export function planScores(profile: ClientProfile) {
  const cash = clamp(profile.cashSavings / Math.max(1, emergencyFundTarget(profile)) * 100, 0, 100);
  const debt = clamp(100 - (profile.debt + profile.studentLoans + profile.carLoanBalance) / Math.max(1, grossHouseholdIncome(profile)) * 140 - Math.max(0, profile.debtRate - 7) * 4, 0, 100);
  const future = clamp(retirementRate(profile) / 0.15 * 70 + profile.retirement / Math.max(1, grossHouseholdIncome(profile)) * 30, 0, 100);
  const housing = housingReadiness(profile).score;
  const tax = clamp(100 - Math.abs(federalTax(profile) - profile.estimatedTaxWithholding) / Math.max(1, grossHouseholdIncome(profile)) * 260, 20, 96);
  return { cash, debt, future, housing, tax, overall: Math.round((cash + debt + future + housing + tax) / 5) };
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

  if (!hasDisabilityCoverage(profile) && profile.income > 40000) {
    recs.push({
      title: 'Protect your income with disability coverage',
      category: 'Insurance',
      priority: 'High',
      explanation: 'For young adults, future income is usually the biggest financial asset. Disability coverage protects that paycheck.',
      action: 'Check employer benefits first, then quote an individual long-term disability policy if needed.',
    });
  }

  if ((profile.dependents > 0 || profile.relationshipStatus === 'married') && !hasLifeCoverage(profile)) {
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
    const needed = (urgentGoal.targetAmount - urgentGoal.currentAmount) / Math.max(1, goalYears(urgentGoal) * 12);
    recs.push({
      title: `Fund goal: ${urgentGoal.name}`,
      category: 'Cash',
      priority: 'Medium',
      explanation: `To hit ${money(urgentGoal.targetAmount)} by ${urgentGoal.targetDate}, you need about ${money(needed)} per month before investment returns.`,
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

  const ira = iraRecommendation(profile);
  recs.push({
    title: `Prioritize a ${ira.account}`,
    category: 'Tax',
    priority: 'Medium',
    explanation: ira.reason,
    action: `Aim toward the IRA contribution limit shown in the lecture: ${money(ira.annualLimit)} per year, after employer match and urgent debt.`,
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

export function buildPlanningModules(profile: ClientProfile, goals: Goal[]): PlanningModule[] {
  const scores = planScores(profile);
  const plan = recommendedMonthlyPlan(profile);
  const ira = iraRecommendation(profile);
  const marriageDelta = marriageTaxDelta(profile);
  const housing = housingReadiness(profile);
  const car = carAffordability(profile);
  const goalMonthly = goals.reduce((sum, goal) => sum + Math.max(0, goal.targetAmount - goal.currentAmount) / Math.max(1, goalYears(goal) * 12), 0);
  const insurance = insuranceScore(profile);
  const annualTax = federalTax(profile);
  const taxGap = annualTax - profile.estimatedTaxWithholding;
  const allocation = riskAllocation(profile);
  const capitalGainsTax = profile.annualCapitalGains * (profile.taxFilingStatus === 'marriedJoint' ? 0.15 : taxableIncome(profile) < 49450 ? 0 : 0.15);
  const vacationNeed = vacationMonthlyNeed(profile);
  const monthlyIncome = grossHouseholdIncome(profile) / 12;

  return [
    {
      id: 'ira',
      title: 'Roth vs Traditional',
      category: 'Taxes',
      score: ira.score,
      metric: ira.account,
      summary: ira.reason,
      stats: [
        { label: 'Annual limit', value: money(ira.annualLimit) },
        { label: 'Current bracket', value: `${Math.round(marginalTaxRate(profile) * 100)}%` },
        { label: 'Retirement rate', value: `${Math.round(retirementRate(profile) * 100)}%` },
      ],
      chart: {
        title: 'Retirement Readiness',
        xAxisLabel: 'Measure',
        yAxisLabel: 'Percent / score',
        labels: ['Current rate', 'Target rate', 'Fit score'],
        values: [retirementRate(profile) * 100, 15, ira.score],
        valueSuffix: '%',
      },
      details: [
        'The presentation compares traditional accounts as tax-deferred and Roth accounts as tax-exempt.',
        'The app treats younger users in lower current brackets as better Roth candidates, then shifts toward pre-tax savings when today tax rate is high.',
        'Qualified accounts also have contribution limits, withdrawal rules, and RMD considerations.',
      ],
      nextMove: `Put the next retirement dollars toward ${ira.account}, after any employer match and expensive debt.`,
    },
    {
      id: 'tax-bill',
      title: 'Tax Withholding',
      category: 'Taxes',
      score: scores.tax,
      metric: taxGap > 0 ? `${money(taxGap)} short` : `${money(Math.abs(taxGap))} cushion`,
      summary: 'Estimates ordinary federal tax using the 2026 bracket structure from the presentation and compares it with withholding.',
      stats: [
        { label: 'Taxable income', value: money(taxableIncome(profile)) },
        { label: 'Federal tax', value: money(annualTax) },
        { label: 'Withheld', value: money(profile.estimatedTaxWithholding) },
      ],
      chart: {
        title: 'Tax Withholding Check',
        xAxisLabel: 'Tax figure',
        yAxisLabel: 'Dollars',
        labels: ['Taxable income', 'Federal tax', 'Withheld'],
        values: [taxableIncome(profile), annualTax, profile.estimatedTaxWithholding],
        valuePrefix: '$',
      },
      details: [
        'Ordinary income, short-term capital gains, and ordinary dividends are modeled through the same progressive bracket ladder.',
        'A gap is not a final tax return, but it gives the user an early warning before April.',
        'Pre-tax retirement contributions reduce taxable income in this simplified model.',
      ],
      nextMove: taxGap > 0 ? 'Increase withholding or quarterly savings so the tax bill does not surprise you.' : 'Keep the cushion modest and redirect extra cash toward goals or debt.',
    },
    {
      id: 'marriage',
      title: 'Marriage Tax Check',
      category: 'Taxes',
      score: clamp(85 - Math.abs(marriageDelta) / 1000 * 6, 25, 95),
      metric: marriageDelta > 0 ? `${money(marriageDelta)} penalty` : `${money(Math.abs(marriageDelta))} bonus`,
      summary: 'Compares two single tax estimates with a married filing jointly estimate.',
      stats: [
        { label: 'Your income', value: money(profile.income) },
        { label: 'Partner income', value: money(profile.partnerIncome) },
        { label: 'Delta', value: money(marriageDelta) },
      ],
      chart: {
        title: 'Filing Scenario Tax',
        xAxisLabel: 'Filing scenario',
        yAxisLabel: 'Estimated tax',
        labels: ['You single', 'Partner single', 'Married joint'],
        values: [federalTax(profile, 'single', profile.income), federalTax(profile, 'single', profile.partnerIncome), federalTax(profile, 'marriedJoint', profile.income + profile.partnerIncome)],
        valuePrefix: '$',
      },
      details: [
        'The presentation flags marriage tax penalty or bonus as a wealth-management topic.',
        'The biggest swings often appear when both partners have high and similar incomes, or when one partner earns much less.',
        'The app should pair this with prenup, beneficiary, insurance, debt, and shared-budget planning before giving a life decision answer.',
      ],
      nextMove: profile.partnerIncome ? 'Review tax, debt, insurance, and beneficiary changes before combining finances.' : 'Add partner income to make this module meaningful.',
    },
    {
      id: 'capital-gains',
      title: 'Capital Gains Layer',
      category: 'Taxes',
      score: clamp(90 - capitalGainsTax / Math.max(1, profile.annualCapitalGains) * 60, 35, 95),
      metric: `${money(capitalGainsTax)} est. tax`,
      summary: 'Models long-term capital gains as a separate layer stacked on taxable income, matching the graphic approach in the presentation.',
      stats: [
        { label: 'Gains', value: money(profile.annualCapitalGains) },
        { label: 'Taxable base', value: money(taxableIncome(profile)) },
        { label: 'Est. gain tax', value: money(capitalGainsTax) },
      ],
      chart: {
        title: 'Capital Gains Context',
        xAxisLabel: 'Tax layer',
        yAxisLabel: 'Dollars',
        labels: ['Taxable base', 'Gains', 'Est. gain tax'],
        values: [taxableIncome(profile), profile.annualCapitalGains, capitalGainsTax],
        valuePrefix: '$',
      },
      details: [
        'Long-term gains and qualified dividends use a separate 0%, 15%, and 20% bracket table.',
        'Tax-loss harvesting can help offset gains, but wash-sale rules can deny losses when replacement purchases happen too soon.',
        'The simplified model is best used as a planning signal, not a filing calculation.',
      ],
      nextMove: 'Track unrealized gains and losses before selling, especially near year-end.',
    },
    {
      id: 'cash-flow',
      title: 'Cash Runway',
      category: 'Wealth',
      score: scores.cash,
      metric: `${(profile.cashSavings / Math.max(1, profile.monthlyExpenses)).toFixed(1)} months`,
      summary: 'Uses core expenses, dependents, and risk tolerance to set a 4 to 6 month emergency-fund target.',
      stats: [
        { label: 'Cash', value: money(profile.cashSavings) },
        { label: 'Target', value: money(emergencyFundTarget(profile)) },
        { label: 'Monthly surplus', value: money(plan.surplus) },
      ],
      chart: {
        title: 'Emergency Fund Gap',
        xAxisLabel: 'Cash measure',
        yAxisLabel: 'Dollars',
        labels: ['Cash', 'Target', 'Annual surplus'],
        values: [profile.cashSavings, emergencyFundTarget(profile), plan.surplus * 12],
        valuePrefix: '$',
      },
      details: [
        'Liquidity needs in the presentation include major purchases, life events, education, and medical needs.',
        'The app keeps emergency cash separate from vacation, car, and home goals so one goal does not cannibalize another.',
        'Lower risk tolerance or dependents pushes the target closer to six months.',
      ],
      nextMove: profile.cashSavings < emergencyFundTarget(profile) ? `Route about ${money(plan.emergency)} per month to cash first.` : 'Keep cash stable and send extra dollars to debt, retirement, or goals.',
    },
    {
      id: 'housing',
      title: 'Mortgage Readiness',
      category: 'Wealth',
      score: housing.score,
      metric: `${Math.round(housing.dti * 100)}% housing DTI`,
      summary: 'Combines down payment progress, estimated mortgage payment, taxes, insurance, and income stress.',
      stats: [
        { label: 'Home target', value: money(profile.desiredHomePrice) },
        { label: 'Payment est.', value: money(housing.totalHousing) },
        { label: 'Down target', value: money(housing.downPaymentTarget) },
      ],
      chart: {
        title: 'Home Purchase Readiness',
        xAxisLabel: 'Housing measure',
        yAxisLabel: 'Dollars',
        labels: ['Saved', 'Down target', 'Annual cost'],
        values: [profile.downPaymentSaved, housing.downPaymentTarget, housing.totalHousing * 12],
        valuePrefix: '$',
      },
      details: [
        'Housing fits the presentation liquidity bucket because the down payment competes with cars, travel, weddings, and emergencies.',
        'The readiness score is lower when the estimated monthly housing cost rises above a comfortable share of income.',
        'This is designed to become a full mortgage calculator tab with amortization, rent-vs-buy, and payoff scenarios.',
      ],
      nextMove: housing.dti > 0.28 ? 'Lower the home target, increase down payment, or delay purchase until income catches up.' : 'Start comparing rent-vs-buy and closing-cost scenarios.',
    },
    {
      id: 'goals',
      title: 'Goal Funding',
      category: 'Wealth',
      score: clamp(100 - Math.max(0, goalMonthly - plan.surplus) / Math.max(1, goalMonthly) * 70, 20, 96),
      metric: `${money(goalMonthly)} / mo`,
      summary: 'Adds every goal bucket together so lifestyle dreams are priced before they become credit-card debt.',
      stats: [
        { label: 'Goals', value: `${goals.length}` },
        { label: 'Need monthly', value: money(goalMonthly) },
        { label: 'Surplus', value: money(plan.surplus) },
      ],
      chart: {
        title: 'Monthly Goal Fit',
        xAxisLabel: 'Monthly source / need',
        yAxisLabel: 'Dollars per month',
        labels: ['Goal need', 'Surplus', 'Travel need'],
        values: [goalMonthly, plan.surplus, vacationNeed],
        valuePrefix: '$',
      },
      details: [
        'This is where vacations, weddings, car upgrades, and big purchases become monthly savings targets.',
        'If goal need exceeds surplus, the app should force prioritization instead of pretending every goal fits.',
        'The output supports the two-box planning layout: a small graph first, detailed tradeoffs on tap.',
      ],
      nextMove: goalMonthly > plan.surplus ? 'Rank goals by urgency and delay the lowest-value item.' : 'Automate each goal into separate buckets on payday.',
    },
    {
      id: 'vacations',
      title: 'Travel Lifestyle',
      category: 'Life',
      score: clamp(100 - vacationNeed / Math.max(1, monthlyIncome) * 500, 20, 96),
      metric: `${money(vacationNeed)} / mo`,
      summary: `${profile.vacationsPerYear} planned vacation(s) per year are translated into a monthly savings target.`,
      stats: [
        { label: 'Annual travel', value: money(profile.annualTravelBudget) },
        { label: 'Trips', value: `${profile.vacationsPerYear}` },
        { label: 'Per trip', value: money(profile.annualTravelBudget / Math.max(1, profile.vacationsPerYear)) },
      ],
      chart: {
        title: 'Travel Budget Fit',
        xAxisLabel: 'Monthly amount',
        yAxisLabel: 'Dollars per month',
        labels: ['Travel need', 'Income', 'Surplus'],
        values: [vacationNeed, monthlyIncome, plan.surplus],
        valuePrefix: '$',
      },
      details: [
        'The app treats lifestyle goals as valid inputs, then shows the tradeoff against retirement, housing, and debt.',
        'Travel is healthiest when funded in advance instead of financed after the trip.',
        'The user can make the plan more aggressive by changing trip count, trip cost, or savings timeline.',
      ],
      nextMove: vacationNeed > plan.surplus * 0.35 ? 'Trim trip cost or count until travel fits beside emergency cash and retirement.' : 'Create a dedicated travel bucket and automate it monthly.',
    },
    {
      id: 'car',
      title: 'Car Purchase',
      category: 'Life',
      score: car.score,
      metric: `${Math.round(car.carBurden * 100)}% of income`,
      summary: 'Checks whether the current or next car is crowding out savings goals.',
      stats: [
        { label: 'Payment', value: money(profile.carPayment) },
        { label: 'Loan balance', value: money(profile.carLoanBalance) },
        { label: 'APR', value: `${profile.carLoanRate}%` },
      ],
      chart: {
        title: 'Auto Cost Pressure',
        xAxisLabel: 'Auto measure',
        yAxisLabel: 'Dollars per month',
        labels: ['Payment', 'Income', 'Loan / 12'],
        values: [profile.carPayment, monthlyIncome, profile.carLoanBalance / 12],
        valuePrefix: '$',
      },
      details: [
        'Automobiles are listed in the presentation as a major liquidity need.',
        'The score penalizes high payment burden and high loan APR because those dollars compete with goals.',
        'A later version can add lease-vs-buy, depreciation, insurance, maintenance, and trade-in scenarios.',
      ],
      nextMove: car.carBurden > 0.1 ? 'Avoid upgrading the car until the payment is below 10% of monthly income.' : 'Keep the car plan, but compare insurance and maintenance costs before upgrading.',
    },
    {
      id: 'insurance',
      title: 'Insurance Gaps',
      category: 'Life',
      score: insurance,
      metric: `${insurance}/100 ready`,
      summary: 'Looks at health, auto, disability, life, dependents, and income protection.',
      stats: [
        { label: 'Health', value: profile.healthInsurance },
        { label: 'Auto', value: profile.autoInsurance },
        { label: 'Vehicle', value: `${profile.carYear || ''} ${profile.carMake || ''} ${profile.carModel || ''}`.trim() || 'Not listed' },
      ],
      chart: null,
      details: [
        'The presentation lists health, auto, property, liability, life, disability, and long-term care insurance.',
        'For young adults, disability insurance often matters because future income is their largest asset.',
        'Life insurance becomes more important with dependents, a spouse, shared debt, or family support obligations.',
      ],
      nextMove: !hasDisabilityCoverage(profile) && profile.income > 40000 ? 'Check employer disability coverage first.' : 'Review deductibles, liability limits, and beneficiaries once per year.',
    },
    {
      id: 'allocation',
      title: 'Investment Policy',
      category: 'Wealth',
      score: scores.future,
      metric: `${allocation.stock}% stocks`,
      summary: 'Converts RRTTLLU inputs into a simple starter allocation using the lecture stock rule.',
      stats: [
        { label: 'Stocks', value: `${allocation.stock}%` },
        { label: 'Bonds', value: `${allocation.bonds}%` },
        { label: 'Cash', value: `${allocation.cash}%` },
      ],
      chart: {
        title: 'Starter Allocation',
        xAxisLabel: 'Asset class',
        yAxisLabel: 'Portfolio percent',
        labels: ['Stocks', 'Bonds', 'Cash'],
        values: [allocation.stock, allocation.bonds, allocation.cash],
        valueSuffix: '%',
      },
      details: [
        'The presentation uses risk tolerance, return objectives, time horizon, tax situation, liquidity, legal constraints, and unique circumstances.',
        'The app starts with age and willingness to take risk, then adjusts as more profile data is added.',
        'Strategic allocation should be reviewed when goals, income, family, or tax situation changes.',
      ],
      nextMove: `Use a starter allocation around ${allocation.stock}% stocks, ${allocation.bonds}% bonds, and ${allocation.cash}% cash.`,
    },
  ];
}
