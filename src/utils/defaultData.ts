import { ClientProfile, Goal } from '../types';

export const defaultProfile: ClientProfile = {
  name: 'Patrick',
  age: 24,
  state: 'FL',
  income: 75000,
  monthlyExpenses: 3600,
  cashSavings: 9000,
  investments: 12000,
  retirement: 8000,
  debt: 15000,
  debtRate: 8.5,
  studentLoans: 6000,
  creditScore: 710,
  heightInches: 70,
  weightLbs: 180,
  relationshipStatus: 'single',
  dependents: 0,
  rentOrOwn: 'rent',
  rentMortgage: 1800,
  hasHealthInsurance: true,
  hasLifeInsurance: false,
  hasDisabilityInsurance: false,
  hasAutoInsurance: true,
  riskTolerance: 'medium',
  targetRetirementAge: 65,
};

export const defaultGoals: Goal[] = [
  { id: '1', name: 'Emergency fund', targetAmount: 18000, currentAmount: 9000, years: 1, priority: 'high' },
  { id: '2', name: 'First home down payment', targetAmount: 60000, currentAmount: 5000, years: 5, priority: 'medium' },
  { id: '3', name: 'Retirement acceleration', targetAmount: 250000, currentAmount: 8000, years: 10, priority: 'high' },
];
