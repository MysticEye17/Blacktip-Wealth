import { ClientProfile, FilingStatus, Goal, PlanningModule, ProjectionPoint, Recommendation } from '../types';
import { defaultProfile } from './defaultData';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const money = (value: number) => `$${Math.round(value).toLocaleString()}`;
export const percent = (value: number) => `${Math.round(value)}%`;
const numeric = (value: number | null | undefined, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const defaultNumeric = (key: keyof ClientProfile, fallback = 0) => numeric(defaultProfile[key] as number | null | undefined, fallback);
const profileNumber = (profile: ClientProfile, key: keyof ClientProfile, fallback = 0) => numeric(profile[key] as number | null | undefined, fallback);
const profileDefaultNumber = (profile: ClientProfile, key: keyof ClientProfile, fallback = 0) => profileNumber(profile, key, defaultNumeric(key, fallback));
const goalNumber = (goal: Goal, key: keyof Goal, fallback = 0) => numeric(goal[key] as number | null | undefined, fallback);
const SOCIAL_SECURITY_WAGE_BASE_2026 = 184500;
const ADDITIONAL_MEDICARE_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200000,
  marriedJoint: 250000,
  headOfHousehold: 200000,
};
const LONG_TERM_GAIN_BRACKETS_2026: Record<FilingStatus, { zeroRateCap: number; fifteenRateCap: number }> = {
  single: { zeroRateCap: 49450, fifteenRateCap: 545500 },
  marriedJoint: { zeroRateCap: 98900, fifteenRateCap: 613700 },
  headOfHousehold: { zeroRateCap: 66200, fifteenRateCap: 579600 },
};
const IRA_BASE_LIMIT_2026 = 7500;
const IRA_CATCH_UP_50_PLUS_2026 = 1100;
const ROTH_IRA_PHASEOUT_2026: Record<FilingStatus, { starts: number; ends: number }> = {
  single: { starts: 153000, ends: 168000 },
  marriedJoint: { starts: 242000, ends: 252000 },
  headOfHousehold: { starts: 153000, ends: 168000 },
};
const TRADITIONAL_IRA_ACTIVE_PARTICIPANT_PHASEOUT_2026: Record<FilingStatus, { starts: number; ends: number }> = {
  single: { starts: 81000, ends: 91000 },
  marriedJoint: { starts: 129000, ends: 149000 },
  headOfHousehold: { starts: 81000, ends: 91000 },
};

export function goalYears(goal: Goal) {
  if (!goal.targetDate) return Math.max(1 / 12, goalNumber(goal, 'years', 1));
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

export function emergencyFundTarget(profile: ClientProfile) {
  const months = profileDefaultNumber(profile, 'dependents') > 0 || profile.riskTolerance === 'low' ? 6 : 4;
  return profileDefaultNumber(profile, 'monthlyExpenses') * months;
}

export function netWorth(profile: ClientProfile) {
  const homeEquity = profile.rentOrOwn === 'own' ? Math.max(0, profileNumber(profile, 'homeValue') - profileNumber(profile, 'mortgageBalance')) : 0;
  return profileNumber(profile, 'cashSavings') + profileNumber(profile, 'investments') + profileNumber(profile, 'retirement') + profileNumber(profile, 'carValue') + homeEquity
    - profileNumber(profile, 'debt') - profileNumber(profile, 'studentLoans') - profileNumber(profile, 'carLoanBalance');
}

export function bmi(profile: ClientProfile) {
  const heightInches = profileNumber(profile, 'heightInches');
  const weightLbs = profileNumber(profile, 'weightLbs');
  if (!heightInches || !weightLbs) return 0;
  return (weightLbs / (heightInches * heightInches)) * 703;
}

export function riskAllocation(profile: ClientProfile) {
  const age = profileDefaultNumber(profile, 'age', 30);
  const ageStockRule = clamp(110 - age, 40, 95);
  const riskAdjustment = profile.riskTolerance === 'high' ? 8 : profile.riskTolerance === 'low' ? -12 : 0;
  const stock = clamp(ageStockRule + riskAdjustment, 35, 95);
  const bonds = clamp(100 - stock - 5, 0, 60);
  const cash = 100 - stock - bonds;
  return { stock, bonds, cash };
}

export function recommendedMonthlyPlan(profile: ClientProfile) {
  const surplus = Math.max(0, monthlySurplus(profile));
  const emergencyGap = Math.max(0, emergencyFundTarget(profile) - profileNumber(profile, 'cashSavings'));
  const debtBalance = profileNumber(profile, 'debt') + profileNumber(profile, 'studentLoans') + profileNumber(profile, 'carLoanBalance');
  const debtAggressive = profileDefaultNumber(profile, 'debtRate') >= 7;
  const emergency = emergencyGap > 0 ? Math.min(surplus * 0.45, emergencyGap / 12) : 0;
  const debt = debtBalance > 0 ? surplus * (debtAggressive ? 0.3 : 0.15) : 0;
  const retirement = surplus * (profileDefaultNumber(profile, 'age', 30) < 30 ? 0.25 : 0.2);
  const taxable = Math.max(0, surplus - emergency - debt - retirement);
  return { surplus, emergency, debt, retirement, taxable };
}

function includesPartnerInHousehold(profile: ClientProfile) {
  return profileNumber(profile, 'partnerIncome') > 0 && (profile.relationshipStatus === 'married' || profile.relationshipStatus === 'engaged' || profile.taxFilingStatus === 'marriedJoint');
}

export function grossHouseholdIncome(profile: ClientProfile) {
  return profileDefaultNumber(profile, 'income') + (includesPartnerInHousehold(profile) ? profileNumber(profile, 'partnerIncome') : 0);
}

function taxIncomeForFilingStatus(profile: ClientProfile, filingStatus = profile.taxFilingStatus) {
  return profileDefaultNumber(profile, 'income') + (filingStatus === 'marriedJoint' ? profileNumber(profile, 'partnerIncome') : 0);
}

export function retirementRate(profile: ClientProfile) {
  return grossHouseholdIncome(profile) ? profileNumber(profile, 'currentRetirementContribution') / grossHouseholdIncome(profile) : 0;
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

export function taxableIncome(
  profile: ClientProfile,
  filingStatus = profile.taxFilingStatus,
  income = taxIncomeForFilingStatus(profile, filingStatus),
  preTaxRetirement = profileNumber(profile, 'currentRetirementContribution'),
) {
  return Math.max(0, income - standardDeduction[filingStatus] - Math.min(preTaxRetirement, income));
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

export function federalTax(
  profile: ClientProfile,
  filingStatus = profile.taxFilingStatus,
  income = taxIncomeForFilingStatus(profile, filingStatus),
  preTaxRetirement = profileNumber(profile, 'currentRetirementContribution'),
) {
  return federalTaxFromTaxable(taxableIncome(profile, filingStatus, income, preTaxRetirement), filingStatus);
}

export function marginalTaxRate(profile: ClientProfile) {
  const income = taxableIncome(profile);
  return ordinaryBrackets[profile.taxFilingStatus].find(bracket => income <= bracket.cap)?.rate || 0.37;
}

export function payrollTax(income: number, filingStatus: FilingStatus = 'single') {
  const socialSecurity = Math.min(Math.max(0, income), SOCIAL_SECURITY_WAGE_BASE_2026) * 0.062;
  const medicare = Math.max(0, income) * 0.0145;
  const additionalMedicare = Math.max(0, income - ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus]) * 0.009;
  return socialSecurity + medicare + additionalMedicare;
}

export function estimatedPayrollTax(profile: ClientProfile) {
  const income = grossHouseholdIncome(profile);
  const userIncome = profileDefaultNumber(profile, 'income');
  const partnerIncome = profileNumber(profile, 'partnerIncome');
  if (!includesPartnerInHousehold(profile)) return payrollTax(userIncome, profile.taxFilingStatus);
  if (profile.taxFilingStatus !== 'marriedJoint') return payrollTax(userIncome, profile.taxFilingStatus) + payrollTax(partnerIncome, 'single');

  const socialSecurity = Math.min(Math.max(0, userIncome), SOCIAL_SECURITY_WAGE_BASE_2026) * 0.062
    + Math.min(Math.max(0, partnerIncome), SOCIAL_SECURITY_WAGE_BASE_2026) * 0.062;
  const medicare = Math.max(0, income) * 0.0145;
  const additionalMedicare = Math.max(0, income - ADDITIONAL_MEDICARE_THRESHOLDS[profile.taxFilingStatus]) * 0.009;
  return socialSecurity + medicare + additionalMedicare;
}

export function estimatedFederalTax(profile: ClientProfile) {
  if (!includesPartnerInHousehold(profile) || profile.taxFilingStatus === 'marriedJoint') return federalTax(profile);
  return federalTax(profile, profile.taxFilingStatus, profileDefaultNumber(profile, 'income'), profileNumber(profile, 'currentRetirementContribution'))
    + federalTax(profile, 'single', profileNumber(profile, 'partnerIncome'), 0);
}

export function estimatedAnnualTakeHome(profile: ClientProfile) {
  const income = grossHouseholdIncome(profile);
  return Math.max(0, income - Math.min(profileNumber(profile, 'currentRetirementContribution'), income) - estimatedFederalTax(profile) - estimatedPayrollTax(profile));
}

export function monthlySurplus(profile: ClientProfile) {
  const autoPayment = profile.autoOwnership === 'financed' || profile.autoOwnership === 'leased' ? profileNumber(profile, 'carPayment') : 0;
  return estimatedAnnualTakeHome(profile) / 12 - profileDefaultNumber(profile, 'monthlyExpenses') - autoPayment - profileNumber(profile, 'parentSupportMonthly');
}

export function iraRecommendation(profile: ClientProfile) {
  const filing = profile.taxFilingStatus;
  const income = taxIncomeForFilingStatus(profile, filing);
  const rothPhaseout = ROTH_IRA_PHASEOUT_2026[filing];
  const traditionalPhaseout = TRADITIONAL_IRA_ACTIVE_PARTICIPANT_PHASEOUT_2026[filing];
  const currentRate = marginalTaxRate(profile);
  const age = profileDefaultNumber(profile, 'age', 30);
  const futureLikelyHigher = age < 35 && income < traditionalPhaseout.ends && profile.riskTolerance !== 'low';
  const statutoryLimit = IRA_BASE_LIMIT_2026 + (age >= 50 ? IRA_CATCH_UP_50_PLUS_2026 : 0);
  const annualLimit = Math.min(statutoryLimit, Math.max(0, income));

  if (income >= rothPhaseout.ends) {
    return {
      account: 'Traditional IRA / 401(k)',
      reason: 'Income is above the 2026 Roth IRA phaseout range, so pre-tax workplace contributions or backdoor Roth planning may matter more.',
      annualLimit,
      score: 58,
    };
  }

  if (income >= rothPhaseout.starts) {
    return {
      account: 'Partial Roth IRA / 401(k)',
      reason: 'Income falls inside the 2026 Roth IRA phaseout range, so only a reduced Roth IRA contribution may be allowed.',
      annualLimit,
      score: 68,
    };
  }

  if (futureLikelyHigher) {
    return {
      account: 'Roth IRA',
      reason: 'The presentation frames Roth as strongest when future tax rates are expected to be higher than today.',
      annualLimit,
      score: 86,
    };
  }

  return {
    account: currentRate >= 0.24 ? 'Traditional IRA / 401(k)' : 'Roth IRA',
    reason: currentRate >= 0.24 ? 'A higher current bracket makes a deduction more valuable today.' : 'A lower current bracket makes paying tax now more attractive.',
    annualLimit,
    score: currentRate >= 0.24 ? 78 : 82,
  };
}

export function marriageTaxDelta(profile: ClientProfile) {
  const userIncome = profileDefaultNumber(profile, 'income');
  const partnerIncome = profileNumber(profile, 'partnerIncome');
  const householdIncome = userIncome + partnerIncome;
  const userRetirement = Math.min(profileNumber(profile, 'currentRetirementContribution'), userIncome);
  const singleA = federalTax(profile, 'single', userIncome, userRetirement);
  const singleB = federalTax(profile, 'single', partnerIncome, 0);
  const married = federalTax(profile, 'marriedJoint', householdIncome, userRetirement);
  return married - singleA - singleB;
}

export function longTermCapitalGainsTax(profile: ClientProfile, gains = profileNumber(profile, 'annualCapitalGains')) {
  const filingStatus = profile.taxFilingStatus;
  const ordinaryIncome = taxIncomeForFilingStatus(profile, filingStatus);
  const preTaxRetirement = Math.min(profileNumber(profile, 'currentRetirementContribution'), ordinaryIncome);
  const adjustedGrossIncomeBeforeGains = Math.max(0, ordinaryIncome - preTaxRetirement);
  const ordinaryTaxableIncome = taxableIncome(profile, filingStatus, ordinaryIncome, preTaxRetirement);
  const totalTaxableIncome = Math.max(0, adjustedGrossIncomeBeforeGains + Math.max(0, gains) - standardDeduction[filingStatus]);
  const taxableGains = Math.max(0, Math.min(Math.max(0, gains), totalTaxableIncome - ordinaryTaxableIncome));
  const taxableBase = ordinaryTaxableIncome;
  const brackets = LONG_TERM_GAIN_BRACKETS_2026[profile.taxFilingStatus];
  const zeroRateDollars = Math.max(0, Math.min(taxableGains, brackets.zeroRateCap - taxableBase));
  const remainingAfterZero = Math.max(0, taxableGains - zeroRateDollars);
  const fifteenRateSpace = Math.max(0, brackets.fifteenRateCap - Math.max(taxableBase, brackets.zeroRateCap));
  const fifteenRateDollars = Math.min(remainingAfterZero, fifteenRateSpace);
  const twentyRateDollars = Math.max(0, remainingAfterZero - fifteenRateDollars);
  const niitBase = Math.max(0, adjustedGrossIncomeBeforeGains + Math.max(0, gains) - ADDITIONAL_MEDICARE_THRESHOLDS[profile.taxFilingStatus]);
  const niit = Math.min(Math.max(0, gains), niitBase) * 0.038;
  return fifteenRateDollars * 0.15 + twentyRateDollars * 0.2 + niit;
}

export function monthlyMortgagePayment(principal: number, annualRate: number, years: number) {
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  if (!principal || !months) return 0;
  if (!monthlyRate) return principal / months;
  return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
}

export function housingReadiness(profile: ClientProfile) {
  const desiredHomePrice = profileDefaultNumber(profile, 'desiredHomePrice');
  const downPaymentSaved = profileNumber(profile, 'downPaymentSaved');
  const downPaymentTarget = desiredHomePrice * 0.2;
  const principal = Math.max(0, desiredHomePrice - downPaymentSaved);
  const payment = monthlyMortgagePayment(principal, profileDefaultNumber(profile, 'mortgageRate'), profileDefaultNumber(profile, 'mortgageYears', 30));
  const totalHousing = payment + desiredHomePrice * 0.012 / 12 + desiredHomePrice * 0.006 / 12;
  const dti = grossHouseholdIncome(profile) ? totalHousing * 12 / grossHouseholdIncome(profile) : 1;
  const score = clamp(100 - Math.max(0, dti - 0.28) * 180 - Math.max(0, downPaymentTarget - downPaymentSaved) / Math.max(1, downPaymentTarget) * 35, 15, 96);
  return { downPaymentTarget, payment, totalHousing, dti, score };
}

export function carAffordability(profile: ClientProfile) {
  const monthlyIncome = grossHouseholdIncome(profile) / 12;
  const carBurden = monthlyIncome ? profileNumber(profile, 'carPayment') / monthlyIncome : 0;
  const score = clamp(100 - carBurden * 450 - Math.max(0, profileDefaultNumber(profile, 'carLoanRate') - 6) * 4, 18, 96);
  return { carBurden, score };
}

export function vacationMonthlyNeed(profile: ClientProfile) {
  return profileNumber(profile, 'annualTravelBudget') / 12;
}

export function insuranceScore(profile: ClientProfile) {
  let score = 25;
  if (hasHealthCoverage(profile)) score += 20;
  if (hasAutoCoverage(profile)) score += profile.autoInsurance === 'full' ? 18 : 12;
  if (hasDisabilityCoverage(profile)) score += profileDefaultNumber(profile, 'income') > 40000 ? 25 : 15;
  if (hasLifeCoverage(profile) || (profileDefaultNumber(profile, 'dependents') === 0 && profile.relationshipStatus !== 'married')) score += 15;
  return clamp(score, 0, 100);
}

export function planScores(profile: ClientProfile) {
  const cash = clamp(profileNumber(profile, 'cashSavings') / Math.max(1, emergencyFundTarget(profile)) * 100, 0, 100);
  const debt = clamp(100 - (profileNumber(profile, 'debt') + profileNumber(profile, 'studentLoans') + profileNumber(profile, 'carLoanBalance')) / Math.max(1, grossHouseholdIncome(profile)) * 140 - Math.max(0, profileDefaultNumber(profile, 'debtRate') - 7) * 4, 0, 100);
  const future = clamp(retirementRate(profile) / 0.15 * 70 + profileNumber(profile, 'retirement') / Math.max(1, grossHouseholdIncome(profile)) * 30, 0, 100);
  const housing = housingReadiness(profile).score;
  const estimatedFederalTax = federalTax(profile) + longTermCapitalGainsTax(profile);
  const tax = clamp(100 - Math.abs(estimatedFederalTax - profileNumber(profile, 'estimatedTaxWithholding')) / Math.max(1, grossHouseholdIncome(profile)) * 260, 20, 96);
  return { cash, debt, future, housing, tax, overall: Math.round((cash + debt + future + housing + tax) / 5) };
}

export function buildRecommendations(profile: ClientProfile, goals: Goal[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const surplus = monthlySurplus(profile);
  const efTarget = emergencyFundTarget(profile);
  const allocation = riskAllocation(profile);
  const currentBmi = bmi(profile);

  if (profileNumber(profile, 'cashSavings') < efTarget) {
    recs.push({
      title: 'Build your emergency fund first',
      category: 'Cash',
      priority: 'High',
      explanation: `You have ${money(profileNumber(profile, 'cashSavings'))} in cash entered. A safer target is about ${money(efTarget)}, based on your monthly expenses and risk profile.`,
      action: `Move about ${money(recommendedMonthlyPlan(profile).emergency)} per month into high-yield savings until funded.`,
    });
  }

  if (profileNumber(profile, 'debt') + profileNumber(profile, 'studentLoans') > 0 && profileDefaultNumber(profile, 'debtRate') >= 7) {
    recs.push({
      title: 'Attack high-interest debt before extra investing',
      category: 'Debt',
      priority: 'High',
      explanation: `Debt costing around ${profileDefaultNumber(profile, 'debtRate')}% is a guaranteed drag. Paying it down can beat many low-risk investments.`,
      action: `Use the avalanche method: minimum payments on everything, extra dollars to the highest rate balance.`,
    });
  }

  recs.push({
    title: 'Use a simple age-and-risk investment mix',
    category: 'Investing',
    priority: 'Medium',
    explanation: `Based on age ${profileDefaultNumber(profile, 'age', 30)} and ${profile.riskTolerance} risk tolerance, a starter allocation is approximately ${allocation.stock}% stock ETFs, ${allocation.bonds}% bond ETFs, and ${allocation.cash}% cash.`,
    action: 'Automate monthly investing after emergency cash and expensive debt are under control.',
  });

  if (!hasDisabilityCoverage(profile) && profileDefaultNumber(profile, 'income') > 40000) {
    recs.push({
      title: 'Protect your income with disability coverage',
      category: 'Insurance',
      priority: 'High',
      explanation: 'For young adults, future income is usually the biggest financial asset. Disability coverage protects that paycheck.',
      action: 'Check employer benefits first, then quote an individual long-term disability policy if needed.',
    });
  }

  if ((profileDefaultNumber(profile, 'dependents') > 0 || profile.relationshipStatus === 'married') && !hasLifeCoverage(profile)) {
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

  const urgentGoal = goals.find(g => g.priority === 'high' && goalNumber(g, 'targetAmount') > goalNumber(g, 'currentAmount'));
  if (urgentGoal) {
    const needed = (goalNumber(urgentGoal, 'targetAmount') - goalNumber(urgentGoal, 'currentAmount')) / Math.max(1, goalYears(urgentGoal) * 12);
    recs.push({
      title: `Fund goal: ${urgentGoal.name}`,
      category: 'Cash',
      priority: 'Medium',
      explanation: `To hit ${money(goalNumber(urgentGoal, 'targetAmount'))} by ${urgentGoal.targetDate}, you need about ${money(needed)} per month before investment returns.`,
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
  const targetCash = emergencyFundTarget(profile);
  let cash = profileNumber(profile, 'cashSavings');
  let investments = profileNumber(profile, 'investments');
  let retirement = profileNumber(profile, 'retirement');
  let nonCarDebt = profileNumber(profile, 'debt') + profileNumber(profile, 'studentLoans');
  let carLoanDebt = profile.autoOwnership === 'financed' ? profileNumber(profile, 'carLoanBalance') : 0;
  let carValue = profileNumber(profile, 'carValue');
  let homeValue = profile.rentOrOwn === 'own' ? profileNumber(profile, 'homeValue') : 0;
  let mortgageDebt = profile.rentOrOwn === 'own' ? profileNumber(profile, 'mortgageBalance') : 0;
  const plannedHomeSaleAge = profileNumber(profile, 'plannedHomeSaleAge');
  const currentAge = profileDefaultNumber(profile, 'age', 30);
  const points: ProjectionPoint[] = [];

  for (let y = 0; y <= years; y++) {
    if (homeValue > 0 && plannedHomeSaleAge > 0 && currentAge + y >= plannedHomeSaleAge) {
      investments += Math.max(0, homeValue - mortgageDebt) * 0.92;
      homeValue = 0;
      mortgageDebt = 0;
    }

    const debt = nonCarDebt + carLoanDebt + mortgageDebt;
    points.push({ year: y, cash, investments, retirement, debt, carValue, carLoanDebt, homeValue, mortgageDebt, netWorth: cash + investments + retirement + carValue + homeValue - debt });
    const emergencyContribution = Math.min(plan.emergency * 12, Math.max(0, targetCash - cash));
    let redirectedCash = plan.emergency * 12 - emergencyContribution;
    cash += emergencyContribution;
    nonCarDebt *= (1 + Math.max(0, profileDefaultNumber(profile, 'debtRate')) / 100);
    carLoanDebt *= (1 + Math.max(0, profileDefaultNumber(profile, 'carLoanRate')) / 100);
    mortgageDebt = Math.max(0, mortgageDebt - profileNumber(profile, 'rentMortgage') * 12 * 0.55);

    const annualCarPayment = profile.autoOwnership === 'financed' ? profileNumber(profile, 'carPayment') * 12 : 0;
    const regularCarPaydown = Math.min(carLoanDebt, annualCarPayment);
    carLoanDebt -= regularCarPaydown;

    let extraDebtPayment = plan.debt * 12;
    if (profileDefaultNumber(profile, 'carLoanRate') > profileDefaultNumber(profile, 'debtRate')) {
      const carExtra = Math.min(carLoanDebt, extraDebtPayment);
      carLoanDebt -= carExtra;
      extraDebtPayment -= carExtra;
      const nonCarExtra = Math.min(nonCarDebt, extraDebtPayment);
      nonCarDebt -= nonCarExtra;
      extraDebtPayment -= nonCarExtra;
    } else {
      const nonCarExtra = Math.min(nonCarDebt, extraDebtPayment);
      nonCarDebt -= nonCarExtra;
      extraDebtPayment -= nonCarExtra;
      const carExtra = Math.min(carLoanDebt, extraDebtPayment);
      carLoanDebt -= carExtra;
      extraDebtPayment -= carExtra;
    }

    redirectedCash += extraDebtPayment;
    investments = investments * (1 + annualReturn) + (plan.taxable * 12) + redirectedCash;
    retirement = retirement * (1 + annualReturn) + plan.retirement * 12;
    carValue *= profile.autoOwnership === 'none' ? 1 : 0.88;
    homeValue *= homeValue > 0 ? 1.025 : 0;
  }
  return points;
}

export function buildPlanningModules(profile: ClientProfile, goals: Goal[]): PlanningModule[] {
  const scores = planScores(profile);
  const plan = recommendedMonthlyPlan(profile);
  const ira = iraRecommendation(profile);
  const marriageDelta = marriageTaxDelta(profile);
  const userIncome = profileDefaultNumber(profile, 'income');
  const partnerIncome = profileNumber(profile, 'partnerIncome');
  const marriageHouseholdIncome = userIncome + partnerIncome;
  const userRetirement = Math.min(profileNumber(profile, 'currentRetirementContribution'), userIncome);
  const userSingleTax = federalTax(profile, 'single', userIncome, userRetirement);
  const partnerSingleTax = federalTax(profile, 'single', partnerIncome, 0);
  const marriedJointTax = federalTax(profile, 'marriedJoint', marriageHouseholdIncome, userRetirement);
  const housing = housingReadiness(profile);
  const car = carAffordability(profile);
  const goalMonthly = goals.reduce((sum, goal) => sum + Math.max(0, goalNumber(goal, 'targetAmount') - goalNumber(goal, 'currentAmount')) / Math.max(1, goalYears(goal) * 12), 0);
  const insurance = insuranceScore(profile);
  const ordinaryTax = federalTax(profile);
  const capitalGainsTax = longTermCapitalGainsTax(profile);
  const annualTax = ordinaryTax + capitalGainsTax;
  const taxGap = annualTax - profileNumber(profile, 'estimatedTaxWithholding');
  const allocation = riskAllocation(profile);
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
        'The 2026 IRA model uses the indexed $7,500 base limit, the $1,100 age-50 catch-up amount, and Roth phaseout ranges by filing status.',
        'Traditional IRA deductibility can phase out when the contributor is covered by a workplace retirement plan, so employer-plan details still matter.',
      ],
      nextMove: `Put the next retirement dollars toward ${ira.account}, after any employer match and expensive debt.`,
    },
    {
      id: 'tax-bill',
      title: 'Tax Withholding',
      category: 'Taxes',
      score: scores.tax,
      metric: taxGap > 0 ? `${money(taxGap)} short` : `${money(Math.abs(taxGap))} cushion`,
      summary: 'Estimates ordinary federal tax plus long-term capital gains tax, then compares the result with withholding.',
      stats: [
        { label: 'Taxable income', value: money(taxableIncome(profile)) },
        { label: 'Federal tax', value: money(ordinaryTax) },
        { label: 'Gain tax', value: money(capitalGainsTax) },
        { label: 'Withheld', value: money(profileNumber(profile, 'estimatedTaxWithholding')) },
      ],
      chart: {
        title: 'Tax Withholding Check',
        xAxisLabel: 'Tax figure',
        yAxisLabel: 'Dollars',
        labels: ['Taxable income', 'Est. tax', 'Withheld'],
        values: [taxableIncome(profile), annualTax, profileNumber(profile, 'estimatedTaxWithholding')],
        valuePrefix: '$',
      },
      details: [
        'Ordinary income, short-term capital gains, and ordinary dividends are modeled through the same progressive bracket ladder.',
        'Monthly surplus starts with estimated take-home pay after federal income tax, payroll tax, and entered retirement contributions.',
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
        { label: 'Your income', value: money(userIncome) },
        { label: 'Partner income', value: money(partnerIncome) },
        { label: 'Delta', value: money(marriageDelta) },
      ],
      chart: {
        title: 'Filing Scenario Tax',
        xAxisLabel: 'Filing scenario',
        yAxisLabel: 'Estimated tax',
        labels: ['You single', 'Partner single', 'Married joint'],
        values: [userSingleTax, partnerSingleTax, marriedJointTax],
        valuePrefix: '$',
      },
      details: [
        'The presentation flags marriage tax penalty or bonus as a wealth-management topic.',
        'The comparison keeps the entered retirement contribution with the user instead of splitting it across both partners.',
        'The biggest swings often appear when both partners have high and similar incomes, or when one partner earns much less.',
        'The app should pair this with prenup, beneficiary, insurance, debt, and shared-budget planning before giving a life decision answer.',
      ],
      nextMove: partnerIncome ? 'Review tax, debt, insurance, and beneficiary changes before combining finances.' : 'Add partner income to make this module meaningful.',
    },
    {
      id: 'capital-gains',
      title: 'Capital Gains Layer',
      category: 'Taxes',
      score: clamp(90 - capitalGainsTax / Math.max(1, profileNumber(profile, 'annualCapitalGains')) * 60, 35, 95),
      metric: `${money(capitalGainsTax)} est. tax`,
      summary: 'Models long-term capital gains as a separate layer stacked on taxable income, matching the graphic approach in the presentation.',
      stats: [
        { label: 'Gains', value: money(profileNumber(profile, 'annualCapitalGains')) },
        { label: 'Taxable base', value: money(taxableIncome(profile)) },
        { label: 'Est. gain tax', value: money(capitalGainsTax) },
      ],
      chart: {
        title: 'Capital Gains Context',
        xAxisLabel: 'Tax layer',
        yAxisLabel: 'Dollars',
        labels: ['Taxable base', 'Gains', 'Est. gain tax'],
        values: [taxableIncome(profile), profileNumber(profile, 'annualCapitalGains'), capitalGainsTax],
        valuePrefix: '$',
      },
      details: [
        'Long-term gains and qualified dividends use the 2026 0%, 15%, and 20% bracket table.',
        'Unused standard deduction can shield part of the gains before the preferential brackets apply.',
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
      metric: `${(profileNumber(profile, 'cashSavings') / Math.max(1, profileDefaultNumber(profile, 'monthlyExpenses'))).toFixed(1)} months`,
      summary: 'Uses core expenses, dependents, and risk tolerance to set a 4 to 6 month emergency-fund target.',
      stats: [
        { label: 'Cash', value: money(profileNumber(profile, 'cashSavings')) },
        { label: 'Target', value: money(emergencyFundTarget(profile)) },
        { label: 'Monthly surplus', value: money(plan.surplus) },
      ],
      chart: {
        title: 'Emergency Fund Gap',
        xAxisLabel: 'Cash measure',
        yAxisLabel: 'Dollars',
        labels: ['Cash', 'Target', 'Annual surplus'],
        values: [profileNumber(profile, 'cashSavings'), emergencyFundTarget(profile), plan.surplus * 12],
        valuePrefix: '$',
      },
      details: [
        'Liquidity needs in the presentation include major purchases, life events, education, and medical needs.',
        'The surplus calculation uses estimated take-home pay, then subtracts expenses, car payments, and family support.',
        'The app keeps emergency cash separate from vacation, car, and home goals so one goal does not cannibalize another.',
        'Lower risk tolerance or dependents pushes the target closer to six months.',
      ],
      nextMove: profileNumber(profile, 'cashSavings') < emergencyFundTarget(profile) ? `Route about ${money(plan.emergency)} per month to cash first.` : 'Keep cash stable and send extra dollars to debt, retirement, or goals.',
    },
    {
      id: 'housing',
      title: 'Mortgage Readiness',
      category: 'Wealth',
      score: housing.score,
      metric: `${Math.round(housing.dti * 100)}% housing DTI`,
      summary: 'Combines down payment progress, estimated mortgage payment, taxes, insurance, and income stress.',
      stats: [
        { label: 'Home target', value: money(profileDefaultNumber(profile, 'desiredHomePrice')) },
        { label: 'Payment est.', value: money(housing.totalHousing) },
        { label: 'Down target', value: money(housing.downPaymentTarget) },
      ],
      chart: {
        title: 'Home Purchase Readiness',
        xAxisLabel: 'Housing measure',
        yAxisLabel: 'Dollars',
        labels: ['Saved', 'Down target', 'Annual cost'],
        values: [profileNumber(profile, 'downPaymentSaved'), housing.downPaymentTarget, housing.totalHousing * 12],
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
      summary: `${profileNumber(profile, 'vacationsPerYear')} planned vacation(s) per year are translated into a monthly savings target.`,
      stats: [
        { label: 'Annual travel', value: money(profileNumber(profile, 'annualTravelBudget')) },
        { label: 'Trips', value: `${profileNumber(profile, 'vacationsPerYear')}` },
        { label: 'Per trip', value: money(profileNumber(profile, 'annualTravelBudget') / Math.max(1, profileNumber(profile, 'vacationsPerYear'))) },
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
        { label: 'Payment', value: money(profileNumber(profile, 'carPayment')) },
        { label: 'Loan balance', value: money(profileNumber(profile, 'carLoanBalance')) },
        { label: 'APR', value: `${profileDefaultNumber(profile, 'carLoanRate')}%` },
      ],
      chart: {
        title: 'Auto Cost Pressure',
        xAxisLabel: 'Auto measure',
        yAxisLabel: 'Dollars per month',
        labels: ['Payment', 'Income', 'Loan / 12'],
        values: [profileNumber(profile, 'carPayment'), monthlyIncome, profileNumber(profile, 'carLoanBalance') / 12],
        valuePrefix: '$',
      },
      details: [
        'Automobiles are listed in the presentation as a major liquidity need.',
        'The score penalizes high payment burden and high loan APR because those dollars compete with goals.',
        'The projection now carries car loan debt separately, applies the regular car payment, and depreciates the vehicle value over time.',
        'A later version can add lease-vs-buy, insurance, maintenance, and trade-in scenarios.',
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
        { label: 'Vehicle', value: `${profileNumber(profile, 'carYear') || ''} ${profile.carMake || ''} ${profile.carModel || ''}`.trim() || 'Not listed' },
      ],
      chart: null,
      details: [
        'The presentation lists health, auto, property, liability, life, disability, and long-term care insurance.',
        'For young adults, disability insurance often matters because future income is their largest asset.',
        'Life insurance becomes more important with dependents, a spouse, shared debt, or family support obligations.',
      ],
      nextMove: !hasDisabilityCoverage(profile) && profileDefaultNumber(profile, 'income') > 40000 ? 'Check employer disability coverage first.' : 'Review deductibles, liability limits, and beneficiaries once per year.',
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
