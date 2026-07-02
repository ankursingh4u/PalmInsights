"use client";

import { useEffect } from "react";
import { useAppMode } from "@/lib/useAppMode";
import { AppHeader } from "./AppHeader";
import { AppTabBar } from "./AppTabBar";

// Orchestrates native app chrome. Renders nothing on the plain website.
// In app mode it: (1) flags <html> so CSS can restyle for the app,
// (2) configures the native status bar so the OS clock/battery/network are
// never covered, and (3) mounts the top app bar + bottom tab bar.

export function AppShell() {
  const isApp = useAppMode();

  useEffect(() => {
    const root = document.documentElement;
    if (!isApp) {
      root.classList.remove("app-mode");
      return;
    }
    root.classList.add("app-mode");

    // Push the WebView below the status bar and match its color to the theme,
    // so the battery/network/time stay visible on a dark bar.
    const StatusBar = (window as Window).Capacitor?.Plugins?.StatusBar;
    if (StatusBar) {
      try {
        StatusBar.setOverlaysWebView?.({ overlay: false });
        StatusBar.setBackgroundColor?.({ color: "#07040f" });
        StatusBar.setStyle?.({ style: "DARK" }); // light icons for the dark bar
      } catch {
        /* plugin not available (e.g. web preview) — ignore */
      }
    }

    return () => root.classList.remove("app-mode");
  }, [isApp]);

  if (!isApp) return null;

  return (
    <>
      <AppHeader />
      <AppTabBar />
    </>
  );
}
