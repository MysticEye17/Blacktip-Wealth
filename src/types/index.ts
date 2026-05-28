export type RelationshipStatus = 'single' | 'dating' | 'engaged' | 'married' | 'divorced';
export type RiskTolerance = 'low' | 'medium' | 'high';
export type FilingStatus = 'single' | 'marriedJoint' | 'headOfHousehold';
export type InsuranceCoverage = 'none' | 'employer' | 'private' | 'family';
export type LifeInsuranceCoverage = 'none' | 'employer' | 'term' | 'permanent';
export type AutoInsuranceCoverage = 'none' | 'liability' | 'full' | 'commercial';
export type AutoOwnership = 'none' | 'owned' | 'financed' | 'leased';
export type GoalType = 'savings' | 'purchase' | 'vacation';

export type ClientProfile = {
  name: string;
  age: number;
  state: string;
  income: number;
  partnerIncome: number;
  monthlyExpenses: number;
  cashSavings: number;
  investments: number;
  retirement: number;
  currentRetirementContribution: number;
  debt: number;
  debtRate: number;
  studentLoans: number;
  creditScore: number;
  heightInches: number;
  weightLbs: number;
  relationshipStatus: RelationshipStatus;
  partnerAge: number;
  dependents: number;
  childrenPlanned: number;
  parentSupportMonthly: number;
  parent1Age: number;
  parent2Age: number;
  expectedInheritance: number;
  rentOrOwn: 'rent' | 'own' | 'family' | 'other';
  rentMortgage: number;
  desiredHomePrice: number;
  downPaymentSaved: number;
  mortgageRate: number;
  mortgageYears: number;
  autoOwnership: AutoOwnership;
  carMake: string;
  carModel: string;
  carYear: number;
  carPayment: number;
  carValue: number;
  carLoanBalance: number;
  carLoanRate: number;
  annualTravelBudget: number;
  vacationsPerYear: number;
  taxFilingStatus: FilingStatus;
  estimatedTaxWithholding: number;
  annualCapitalGains: number;
  healthInsurance: InsuranceCoverage;
  lifeInsurance: LifeInsuranceCoverage;
  disabilityInsurance: InsuranceCoverage;
  autoInsurance: AutoInsuranceCoverage;
  hasHealthInsurance: boolean;
  hasLifeInsurance: boolean;
  hasDisabilityInsurance: boolean;
  hasAutoInsurance: boolean;
  riskTolerance: RiskTolerance;
  targetRetirementAge: number;
};

export type Goal = {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  years: number;
  targetDate: string;
  priority: 'low' | 'medium' | 'high';
};

export type Recommendation = {
  title: string;
  category: 'Cash' | 'Debt' | 'Investing' | 'Tax' | 'Insurance' | 'Life Planning' | 'Housing' | 'Lifestyle';
  priority: 'Low' | 'Medium' | 'High';
  explanation: string;
  action: string;
};

export type ProjectionPoint = { year: number; netWorth: number; cash: number; investments: number; retirement: number; debt: number };

export type PlanningChart = {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  labels: string[];
  values: number[];
  valuePrefix?: string;
  valueSuffix?: string;
};

export type PlanningModule = {
  id: string;
  title: string;
  category: 'Taxes' | 'Wealth' | 'Life';
  score: number;
  metric: string;
  summary: string;
  stats: { label: string; value: string }[];
  chart: PlanningChart | null;
  details: string[];
  nextMove: string;
};
