import type { CapacitorConfig } from "@capacitor/cli";

// ---------------------------------------------------------------------------
// PalmInsight mobile shell.
//
// The app loads the LIVE hosted web app (Vercel) inside a native WebView, and
// adds native value on top: camera, splash, status bar, and — for Play/App
// Store compliance — native in-app billing (Google Play / Apple IAP) wired via
// RevenueCat (see LAUNCH_GUIDE.md, Phase 3).
//
// Because server.url points at the hosted site, content updates ship instantly
// with no app resubmission. The Capacitor native bridge is still injected into
// the WebView for that origin, so the web app can call native plugins.
// ---------------------------------------------------------------------------

const config: CapacitorConfig = {
  appId: "live.bolddev.palminsight",
  appName: "PalmInsight",
  webDir: "www",
  server: {
    // The live web app. Update this to a custom domain later (e.g.
    // https://app.bolddev.live) — see LAUNCH_GUIDE.md "After a custom domain".
    url: "https://palm-drab.vercel.app",
    cleartext: false,
  },
  android: {
    // Allow the WebView to use the device camera (getUserMedia) for palm scans.
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0b0714",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      // Keep the WebView BELOW the status bar so the clock/battery/network are
      // never covered; dark bar with light icons to match the theme.
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#07040f",
    },
  },
};

export default config;
