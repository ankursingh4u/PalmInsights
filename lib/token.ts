import crypto from "crypto";
import { config } from "./config";

// ---------------------------------------------------------------------------
// HMAC-signed unlock tokens. After a successful payment the server issues a
// token bound to a scan id; the client stores it and presents it to fetch the
// premium report. Tokens are tamper-proof without server-side session storage.
// ---------------------------------------------------------------------------

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", config.unlockSecret)
    .update(payload)
    .digest("base64url");
}

/** Create an unlock token for a scan id (no expiry — a purchase is permanent). */
export function issueUnlockToken(scanId: string): string {
  const payload = `${scanId}.${Date.now()}`;
  const sig = sign(payload);
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

/**
 * Create a Pro-entitlement token bound to an owner (user id).
 * expiresAt = 0 → never expires (used by the launch coupon).
 * expiresAt = ms timestamp → expires then (used by the 30-day subscription).
 */
export function issueProToken(ownerKey: string, expiresAt = 0): string {
  const payload = `pro:${ownerKey}:${expiresAt}.${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

/** Verify a Pro token belongs to the given owner and hasn't expired. */
export function verifyProToken(token: string | undefined, ownerKey: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [b64, sig] = parts;
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  if (!payload.startsWith(`pro:${ownerKey}:`)) return false;
  // payload = pro:<ownerKey>:<expiresAt>.<issuedAt>
  const expiresAt = Number(payload.slice(`pro:${ownerKey}:`.length).split(".")[0]);
  if (expiresAt > 0 && Date.now() > expiresAt) return false;
  return true;
}

/** Verify a token belongs to the given scan id. */
export function verifyUnlockToken(token: string, scanId: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [b64, sig] = parts;
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expected = sign(payload);
  // Constant-time comparison.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return payload.startsWith(`${scanId}.`);
}
