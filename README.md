# DecisionEngine — Cross-Platform Wealth Management App

Positioning: **A personal financial decision engine for young adults.**

This is an Expo React Native starter app for iOS and Android. It includes:

- Onboarding / brand screen
- Detailed profile inputs: age, state, income, expenses, debt, student loans, credit score, height, weight, relationship status, dependents, housing, insurance, risk tolerance
- Goal planner for short-term and long-term goals
- Local device saving with AsyncStorage
- Dashboard with net worth, surplus, monthly allocation, and 10-year projection chart
- Recommendation engine covering cash, debt, investing, tax basics, insurance, and life planning
- Optional AI explanation button using a secure backend proxy

## Run it

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go, or run:

```bash
npm run ios
npm run android
```

## Important OpenAI security note

Do **not** put an OpenAI API key directly inside this mobile app. Mobile apps can be reverse engineered. Use a backend proxy.

In `app.json`, set:

```json
"extra": {
  "openAiProxyUrl": "https://your-backend.com/explain"
}
```

Your backend should receive `{ profile, goals, recommendations }`, call OpenAI, and return:

```json
{ "explanation": "plain English explanation here" }
```

## Next production steps

1. Replace local storage with Supabase or Firebase authentication + database.
2. Add user accounts and encrypted personal data storage.
3. Add compliance disclaimers and licensed-professional review.
4. Add real tax tables, insurance quote integrations, and state-specific rules.
5. Add backend audit logs for recommendations.
6. Add subscription payments with RevenueCat or Stripe.

## Disclaimer

This app is educational planning software only. It is not tax, legal, investment, insurance, or financial advice.

## Optional backend proxy for OpenAI

A simple Express backend is included in `/backend`.

```bash
cd backend
npm install
cp .env.example .env
# add your OpenAI key to .env
npm run dev
```

Then set `openAiProxyUrl` in `app.json` to your deployed endpoint, for example:

```json
"https://your-backend.com/explain"
```
