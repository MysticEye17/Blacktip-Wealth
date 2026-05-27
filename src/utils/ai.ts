import { ClientProfile, Goal, Recommendation } from '../types';
import appConfig from '../../app.json';

export async function explainWithAI(profile: ClientProfile, goals: Goal[], recs: Recommendation[]) {
  const proxyUrl = appConfig.expo.extra?.openAiProxyUrl;
  if (!proxyUrl) {
    return 'AI explanation is not connected yet. Add a secure backend proxy URL in app.json. Do not put your OpenAI API key directly inside the mobile app.';
  }

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, goals, recommendations: recs }),
  });

  if (!response.ok) throw new Error('AI explanation failed');
  const data = await response.json();
  return data.explanation || 'No explanation returned.';
}
