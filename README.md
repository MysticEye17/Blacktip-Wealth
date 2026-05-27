# Blacktip Wealth

Blacktip Wealth is an Expo React Native app for a personal financial decision engine for young adults.

The current app is intentionally Expo Go-friendly: it uses standard Expo/React Native components first so the frontend can be developed quickly before adding native-only features.

## Local Development

```bash
npm install
npm run start
```

Scan the QR code with Expo Go, or open the local Expo URL from the Expo Go app.

Useful scripts:

```bash
npm run start:clear
npm run typecheck
npm run doctor
```

## Current Frontend

The main app entry is [App.tsx](./App.tsx). It contains the Blacktip Wealth mobile frontend adapted from the original web React concept:

- branded Blacktip Wealth dashboard
- client financial inputs
- financial health scores
- next-dollar allocation logic
- AI interpretation placeholder
- timeline recommendations
- insurance, relationship, and housing planning cards

## Expo Go vs Development Builds

Use Expo Go while the app only needs JavaScript and Expo Go-supported native libraries.

Switch to development builds when the app needs native behavior that Expo Go cannot provide, such as custom native libraries, push notifications, universal links, store-parity icon/splash testing, or other native configuration.

When switching, install the dev client:

```bash
npx expo install expo-dev-client
```

Then create a development build:

```bash
npm run build:development -- --platform ios
npm run build:development -- --platform android
```

## Preview And Production Builds

Internal test builds:

```bash
npm run build:preview -- --platform ios
npm run build:preview -- --platform android
```

Store builds:

```bash
npm run build:production -- --platform ios
npm run build:production -- --platform android
```

Submit after the production binaries are ready:

```bash
npm run submit -- --platform ios
npm run submit -- --platform android
```

## OpenAI Security Note

Do not put an OpenAI API key directly inside the mobile app. Mobile apps can be reverse engineered. Use a backend proxy.

In `app.json`, set:

```json
"extra": {
  "openAiProxyUrl": "https://your-backend.com/explain"
}
```

The backend should receive `{ "profile": {}, "goals": [], "recommendations": [] }`, call OpenAI, and return:

```json
{ "explanation": "plain English explanation here" }
```

## Disclaimer

This app is educational planning software only. It is not tax, legal, investment, insurance, or financial advice.
