"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// "App mode" = the site is running inside the Capacitor native shell (or being
// previewed as the app in a browser with ?app=1). In app mode we render native
// chrome (top app bar + bottom tab bar + safe areas) and hide the marketing
// header/footer, so the exact same web app feels like a real app in the store.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
      Plugins?: Record<string, any>;
    };
  }
}

/** True when running inside the native app. Client-only (false during SSR). */
export function isAppMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.Capacitor?.isNativePlatform?.()) return true;
  // Browser preview / testing: ?app=1 (sticky via localStorage).
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("app") === "1") localStorage.setItem("palm:appPreview", "1");
    if (params.get("app") === "0") localStorage.removeItem("palm:appPreview");
    return localStorage.getItem("palm:appPreview") === "1";
  } catch {
    return false;
  }
}

/** Reactive hook version. Starts false (SSR-safe), resolves after mount. */
export function useAppMode(): boolean {
  const [app, setApp] = useState(false);
  useEffect(() => {
    setApp(isAppMode());
  }, []);
  return app;
}
