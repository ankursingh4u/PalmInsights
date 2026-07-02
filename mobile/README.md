# PalmInsight — Mobile Shell (Capacitor)

Native Android/iOS wrapper around the hosted PalmInsight web app. It loads the
live site (`capacitor.config.ts` → `server.url`) inside a native WebView and
adds native camera + store billing on top.

## Quick start (Android)

Prerequisites: **Node 18+**, **JDK 17**, **Android Studio** (with an SDK + an
emulator or a USB device in developer mode).

```bash
cd mobile
npm install
npx cap add android      # generates the native android/ project
npx cap sync             # copies config + plugins into it
npx cap open android     # opens Android Studio → press ▶ Run
```

That gives you PalmInsight running on a phone/emulator — the full live site,
with a native shell, camera, and splash screen.

## Everything else

Signing, Play Store upload, app icons, and **Google Play billing** (the paid
plan) are covered step-by-step in **[`../LAUNCH_GUIDE.md`](../LAUNCH_GUIDE.md)**.
