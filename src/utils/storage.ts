import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClientProfile, Goal } from '../types';
import { defaultGoals, defaultProfile } from './defaultData';

const PROFILE_KEY = 'decision_engine_profile';
const GOALS_KEY = 'decision_engine_goals';

export async function loadProfile(): Promise<ClientProfile> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : defaultProfile;
}

export async function saveProfile(profile: ClientProfile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadGoals(): Promise<Goal[]> {
  const raw = await AsyncStorage.getItem(GOALS_KEY);
  return raw ? JSON.parse(raw) : defaultGoals;
}

export async function saveGoals(goals: Goal[]) {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}
