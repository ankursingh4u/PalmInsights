import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AnalysisResult,
  ChatMessage,
  ScanSummary,
  UserPublic,
} from "./types";

// The native app talks to the SAME backend + database as the website. Auth is a
// bearer token (issued by /api/auth/login|signup) stored on-device. React Native
// isn't subject to CORS, so we call the hosted API directly.
export const BASE_URL = "https://palm-drab.vercel.app";

const TOKEN_KEY = "palm:token";
let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== null) return cachedToken || null;
  cachedToken = (await AsyncStorage.getItem(TOKEN_KEY)) ?? "";
  return cachedToken || null;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token ?? "";
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

// --- Pro entitlement (from the launch coupon, or billing later) ---
const PRO_KEY = "palm:pro";
let cachedPro: string | null = null;

export async function getProToken(): Promise<string | null> {
  if (cachedPro !== null) return cachedPro || null;
  cachedPro = (await AsyncStorage.getItem(PRO_KEY)) ?? "";
  return cachedPro || null;
}
export async function setProToken(token: string | null): Promise<void> {
  cachedPro = token ?? "";
  if (token) await AsyncStorage.setItem(PRO_KEY, token);
  else await AsyncStorage.removeItem(PRO_KEY);
}
export async function isPro(): Promise<boolean> {
  return Boolean(await getProToken());
}

async function request<T>(
  path: string,
  opts: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // --- auth ---
  login: (email: string, password: string) =>
    request<{ user: UserPublic; isAdmin?: boolean; token: string }>("/api/auth/login", {
      body: { email, password },
    }),
  signup: (email: string, password: string) =>
    request<{ user?: UserPublic; token?: string; needsVerify?: boolean; email?: string }>(
      "/api/auth/signup",
      { body: { email, password } }
    ),
  me: () => request<{ user: UserPublic | null; isAdmin?: boolean }>("/api/auth/me"),
  google: (idToken: string) =>
    request<{ user: UserPublic; isAdmin?: boolean; token: string }>("/api/auth/google", {
      body: { idToken },
    }),

  // --- palm ---
  scan: (image: string, handedness: "Left" | "Right" | "Unknown" = "Unknown") =>
    request<{
      scanId?: string;
      result?: AnalysisResult;
      notPalm?: boolean;
      message?: string;
    }>("/api/mobile/scan", { body: { image, handedness } }),
  history: () => request<{ scans: ScanSummary[]; signedIn: boolean }>("/api/history"),
  getScan: (id: string) => request<{ result: AnalysisResult }>(`/api/scan/${id}`),
  report: (scanId: string, proToken: string | null) =>
    request<{ result?: AnalysisResult; requiresPro?: boolean }>("/api/mobile/report", {
      body: { scanId, proToken: proToken ?? undefined },
    }),
  redeem: (code: string) =>
    request<{ pro: boolean; proToken: string }>("/api/mobile/redeem", { body: { code } }),
  chat: (scanId: string, messages: ChatMessage[]) =>
    request<{ reply: string }>("/api/mobile/chat", { body: { scanId, messages } }),
};
