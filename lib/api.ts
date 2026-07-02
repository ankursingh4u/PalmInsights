"use client";

import type {
  AnalysisResult,
  ChatMessage,
  CompatibilityResult,
  Landmark,
  ScanSummary,
  UserPublic,
} from "./types";

// Thin client-side wrappers around the API routes.
//
// API base: empty on the website (same-origin relative calls, unchanged). For
// the BUNDLED app build, set NEXT_PUBLIC_API_BASE to the hosted backend (e.g.
// https://palm-drab.vercel.app) so the on-device UI calls the live API. Auth in
// the app is sent as a bearer token (stored on-device) since it's cross-origin.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

/** Prefix a relative /api path with the configured backend base. */
export function apiUrl(path: string): string {
  return path.startsWith("/") ? `${API_BASE}${path}` : path;
}

/** Bearer token for the bundled app (no-op on the cookie-authed website). */
function authToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("palm:auth") || null;
  } catch {
    return null;
  }
}

function headers(json: boolean): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const t = authToken();
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(url), {
    method: "POST",
    headers: headers(true),
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(apiUrl(url), {
    headers: headers(false),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function analyze(
  landmarks: Landmark[],
  handedness: "Left" | "Right" | "Unknown",
  opts?: { image?: string; saveImage?: boolean; personName?: string }
): Promise<{
  scanId?: string;
  result?: AnalysisResult;
  notPalm?: boolean;
  requiresLogin?: boolean;
  message?: string;
}> {
  return postJSON("/api/analyze", {
    landmarks,
    handedness,
    // The image is always sent so the AI can read the actual palm lines.
    image: opts?.image,
    saveImage: opts?.saveImage ?? false,
    personName: opts?.personName,
  });
}

// --- auth + account ---------------------------------------------------------

export function signup(
  email: string,
  password: string
): Promise<{ user?: UserPublic; isAdmin?: boolean; needsVerify?: boolean; email?: string }> {
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
  void fetch(apiUrl("/api/event"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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

export function askAstrologer(
  scanId: string,
  token: string,
  messages: ChatMessage[]
): Promise<{ reply: string }> {
  return postJSON("/api/chat", { scanId, token, messages });
}

export function fetchHoroscope(
  scanId: string
): Promise<{ guidance: import("./types").DailyGuidance; date: string }> {
  return postJSON("/api/horoscope", { scanId });
}

export function fetchCompatibility(args: {
  scanId: string;
  token: string;
  partnerScanId?: string;
  birthdate?: string;
}): Promise<{ result: CompatibilityResult }> {
  return postJSON("/api/compatibility", args);
}
