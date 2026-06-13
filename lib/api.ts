"use client";

import type {
  AnalysisResult,
  CompatibilityResult,
  Landmark,
  ScanSummary,
  UserPublic,
} from "./types";

// Thin client-side wrappers around the API routes.

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function analyze(
  landmarks: Landmark[],
  handedness: "Left" | "Right" | "Unknown",
  opts?: { image?: string; saveImage?: boolean }
): Promise<{ scanId?: string; result?: AnalysisResult; notPalm?: boolean; message?: string }> {
  return postJSON("/api/analyze", {
    landmarks,
    handedness,
    // The image is always sent so the AI can read the actual palm lines.
    image: opts?.image,
    saveImage: opts?.saveImage ?? false,
  });
}

// --- auth + account ---------------------------------------------------------

export function signup(email: string, password: string): Promise<{ user: UserPublic; isAdmin: boolean }> {
  return postJSON("/api/auth/signup", { email, password });
}
export function login(email: string, password: string): Promise<{ user: UserPublic; isAdmin: boolean }> {
  return postJSON("/api/auth/login", { email, password });
}
export function logout(): Promise<{ ok: boolean }> {
  return postJSON("/api/auth/logout", {});
}
export function me(): Promise<{ user: UserPublic | null; isAdmin?: boolean; scanCount?: number }> {
  return getJSON("/api/auth/me");
}
export function history(): Promise<{ scans: ScanSummary[]; signedIn: boolean }> {
  return getJSON("/api/history");
}
export function trackEvent(name: "paywall_viewed" | "share_created", scanId?: string): void {
  // fire-and-forget
  void fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, scanId }),
  }).catch(() => {});
}

export function startCheckout(
  scanId: string
): Promise<{ mock?: boolean; url?: string; token?: string; message?: string; alreadyPaid?: boolean }> {
  return postJSON("/api/checkout", { scanId });
}

export function confirmPayment(
  scanId: string,
  checkoutId?: string
): Promise<{ paid: boolean; token?: string }> {
  return postJSON("/api/confirm", { scanId, checkoutId });
}

export function fetchReport(
  scanId: string,
  token: string
): Promise<{ result: AnalysisResult }> {
  return postJSON("/api/report", { scanId, token });
}

export function fetchCompatibility(args: {
  scanId: string;
  token: string;
  partnerScanId?: string;
  birthdate?: string;
}): Promise<{ result: CompatibilityResult }> {
  return postJSON("/api/compatibility", args);
}
