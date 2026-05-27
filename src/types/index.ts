export type RelationshipStatus = 'single' | 'dating' | 'engaged' | 'married' | 'divorced';
export type RiskTolerance = 'low' | 'medium' | 'high';

export type ClientProfile = {
  name: string;
  age: number;
  state: string;
  income: number;
  monthlyExpenses: number;
  cashSavings: number;
  investments: number;
  retirement: number;
  debt: number;
  debtRate: number;
  studentLoans: number;
  creditScore: number;
  heightInches: number;
  weightLbs: number;
  relationshipStatus: RelationshipStatus;
  dependents: number;
  rentOrOwn: 'rent' | 'own' | 'family' | 'other';
  rentMortgage: number;
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
  targetAmount: number;
  currentAmount: number;
  years: number;
  priority: 'low' | 'medium' | 'high';
};

export type Recommendation = {
  title: string;
  category: 'Cash' | 'Debt' | 'Investing' | 'Tax' | 'Insurance' | 'Life Planning';
  priority: 'Low' | 'Medium' | 'High';
  explanation: string;
  action: string;
};

export type ProjectionPoint = { year: number; netWorth: number; cash: number; investments: number; retirement: number; debt: number };
