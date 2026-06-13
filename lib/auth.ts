import crypto from "crypto";
import { cookies } from "next/headers";
import { config } from "./config";
import type { User, UserPublic } from "./types";

// ---------------------------------------------------------------------------
// Authentication: scrypt password hashing + HMAC-signed session cookies, plus
// an anonymous-identity cookie so scans can be attributed before sign-up and
// claimed on login. Self-contained — no external auth provider required.
// ---------------------------------------------------------------------------

const SESSION_COOKIE = "palm_session";
const ANON_COOKIE = "palm_anon";
const SESSION_TTL_DAYS = 30;

// --- password hashing -------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

// --- signed tokens ----------------------------------------------------------

function sign(payload: string): string {
  return crypto.createHmac("sha256", config.unlockSecret).update(payload).digest("base64url");
}

function makeToken(data: object): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

// --- session management (call from route handlers) --------------------------

export function setSession(userId: string): void {
  cookies().set(SESSION_COOKIE, makeToken({ uid: userId, iat: Date.now() }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export function clearSession(): void {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function getSessionUserId(): string | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const data = readToken<{ uid: string }>(token);
  return data?.uid ?? null;
}

/** Read the anon id, creating + setting the cookie if missing. */
export function getOrCreateAnonId(): string {
  const jar = cookies();
  const existing = readToken<{ aid: string }>(jar.get(ANON_COOKIE)?.value);
  if (existing?.aid) return existing.aid;
  const aid = `anon_${crypto.randomUUID()}`;
  jar.set(ANON_COOKIE, makeToken({ aid }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return aid;
}

export function getAnonId(): string | null {
  const data = readToken<{ aid: string }>(cookies().get(ANON_COOKIE)?.value);
  return data?.aid ?? null;
}

/** The current owner key (user id if signed in, else anon id). */
export function getOwnerKey(): string {
  return getSessionUserId() ?? getOrCreateAnonId();
}

// --- validation -------------------------------------------------------------

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "Password is too long.";
  return null;
}

export function toPublic(user: User): UserPublic {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

/** Whether an email is configured as an admin (comma-separated ADMIN_EMAILS). */
export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
