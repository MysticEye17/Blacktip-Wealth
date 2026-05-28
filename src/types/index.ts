export type RelationshipStatus = 'single' | 'dating' | 'engaged' | 'married' | 'divorced';
export type RiskTolerance = 'low' | 'medium' | 'high';
export type FilingStatus = 'single' | 'marriedJoint' | 'headOfHousehold';
export type InsuranceCoverage = 'none' | 'employer' | 'private' | 'family';
export type LifeInsuranceCoverage = 'none' | 'employer' | 'term' | 'permanent';
export type AutoInsuranceCoverage = 'none' | 'liability' | 'full' | 'commercial';
export type AutoOwnership = 'none' | 'owned' | 'financed' | 'leased';
export type GoalType = 'savings' | 'purchase' | 'vacation' | 'homeSale';
export type OptionalNumber = number | null;

export type ClientProfile = {
  name: string;
  age: OptionalNumber;
  state: string;
  income: OptionalNumber;
  partnerIncome: OptionalNumber;
  monthlyExpenses: OptionalNumber;
  cashSavings: OptionalNumber;
  investments: OptionalNumber;
  retirement: OptionalNumber;
  currentRetirementContribution: OptionalNumber;
  debt: OptionalNumber;
  debtRate: OptionalNumber;
  studentLoans: OptionalNumber;
  creditScore: OptionalNumber;
  heightInches: OptionalNumber;
  weightLbs: OptionalNumber;
  relationshipStatus: RelationshipStatus;
  partnerAge: OptionalNumber;
  dependents: OptionalNumber;
  childrenPlanned: OptionalNumber;
  parentSupportMonthly: OptionalNumber;
  parent1Age: OptionalNumber;
  parent2Age: OptionalNumber;
  expectedInheritance: OptionalNumber;
  rentOrOwn: 'rent' | 'own' | 'family' | 'other';
  rentMortgage: OptionalNumber;
  homeValue: OptionalNumber;
  mortgageBalance: OptionalNumber;
  plannedHomeSaleAge: OptionalNumber;
  desiredHomePrice: OptionalNumber;
  downPaymentSaved: OptionalNumber;
  mortgageRate: OptionalNumber;
  mortgageYears: OptionalNumber;
  autoOwnership: AutoOwnership;
  carMake: string;
  carModel: string;
  carYear: OptionalNumber;
  carPayment: OptionalNumber;
  carValue: OptionalNumber;
  carLoanBalance: OptionalNumber;
  carLoanRate: OptionalNumber;
  annualTravelBudget: OptionalNumber;
  vacationsPerYear: OptionalNumber;
  taxFilingStatus: FilingStatus;
  estimatedTaxWithholding: OptionalNumber;
  annualCapitalGains: OptionalNumber;
  healthInsurance: InsuranceCoverage;
  lifeInsurance: LifeInsuranceCoverage;
  disabilityInsurance: InsuranceCoverage;
  autoInsurance: AutoInsuranceCoverage;
  hasHealthInsurance: boolean;
  hasLifeInsurance: boolean;
  hasDisabilityInsurance: boolean;
  hasAutoInsurance: boolean;
  riskTolerance: RiskTolerance;
  targetRetirementAge: OptionalNumber;
};

export type Goal = {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: OptionalNumber;
  currentAmount: OptionalNumber;
  years: OptionalNumber;
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

export type ProjectionPoint = { year: number; netWorth: number; cash: number; investments: number; retirement: number; debt: number; carValue: number; carLoanDebt: number; homeValue?: number; mortgageDebt?: number };

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
