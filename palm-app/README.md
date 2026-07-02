# PalmInsight — Native App (Expo / React Native)

A **real native app** (not a webview). Separate UI from the website, but it talks
to the **same backend + Supabase database** via a bearer token — so an account and
its readings are identical on web and app.

## Prerequisites
- Node 18+ (you have 20)
- The **Expo Go** app on your Android phone (from the Play Store)
- The backend must be deployed with the app changes: from the repo root run
  **`vercel --prod`** (bearer auth + `/api/mobile/scan` must be live).

## Run it (test on your phone in ~2 min — no Android SDK needed)
```bash
cd palm-app
npm install
npx expo install --fix   # aligns native module versions to the Expo SDK
npx expo start
```
A QR code appears in the terminal. Open **Expo Go** on your phone → **Scan QR** →
the app loads instantly on your device with live reload.

## What works now
- Sign up / log in (same account as the website)
- Home + bottom tabs (Home · Scan · Readings · Profile)
- **Scan**: take/pick a palm photo → AI reads your lines → reading screen
- Readings history, Profile, log out

## Coming next
- Ask-the-Astrologer chat + Deep Report unlock via **Google Play Billing**
- App icon + splash, then a store build via **EAS Build** (`eas build -p android`)

## Config
- Backend URL is in `lib/api.ts` (`BASE_URL`). Point it at a custom domain later.
- Android package id: `live.bolddev.palminsight` (`app.json`).
