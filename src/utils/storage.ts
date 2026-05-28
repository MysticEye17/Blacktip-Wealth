import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClientProfile, Goal } from '../types';
import { defaultGoals, defaultProfile } from './defaultData';

const PROFILE_KEY = 'decision_engine_profile';
const GOALS_KEY = 'decision_engine_goals';
const PREMIUM_ACCESS_KEY = 'blacktip_premium_access';

export async function loadProfile(): Promise<ClientProfile> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  const profile = raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  return {
    ...profile,
    hasHealthInsurance: profile.healthInsurance !== 'none',
    hasLifeInsurance: profile.lifeInsurance !== 'none',
    hasDisabilityInsurance: profile.disabilityInsurance !== 'none',
    hasAutoInsurance: profile.autoInsurance !== 'none',
  };
}

export async function saveProfile(profile: ClientProfile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadGoals(): Promise<Goal[]> {
  const raw = await AsyncStorage.getItem(GOALS_KEY);
  const goals: Goal[] = raw ? JSON.parse(raw) : defaultGoals;
  return goals.map(goal => ({
    ...goal,
    type: goal.type || 'savings',
    targetDate: goal.targetDate || dateFromYears(goal.years ?? 1),
  }));
}

export async function saveGoals(goals: Goal[]) {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export async function loadPremiumAccess(): Promise<boolean> {
  return (await AsyncStorage.getItem(PREMIUM_ACCESS_KEY)) === 'unlocked';
}

export async function savePremiumAccess(unlocked: boolean) {
  if (unlocked) {
    await AsyncStorage.setItem(PREMIUM_ACCESS_KEY, 'unlocked');
    return;
  }

  await AsyncStorage.removeItem(PREMIUM_ACCESS_KEY);
}

function dateFromYears(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + Math.max(1, years));
  return date.toISOString().slice(0, 10);
}
