import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Lightweight in-memory sliding-window rate limiter, keyed by client IP +
// bucket name. Suitable for single-instance / serverless-warm deployments.
// For multi-instance production, swap the Map for Redis/Upstash (same API).
// ---------------------------------------------------------------------------

interface Hit {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __palmRate: Map<string, Hit> | undefined;
}

const buckets = global.__palmRate ?? new Map<string, Hit>();
if (process.env.NODE_ENV !== "production") global.__palmRate = buckets;

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

export interface RateResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Returns whether the request is within `limit` per `windowMs` for the bucket.
 */
export function rateLimit(
  req: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number
): RateResult {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const hit = buckets.get(key);

  if (!hit || hit.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  hit.count += 1;
  const ok = hit.count <= limit;
  return { ok, remaining: Math.max(0, limit - hit.count), resetAt: hit.resetAt };
}

/** Convenience: enforce a limit and return a 429 response if exceeded. */
export function enforceRateLimit(
  req: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const r = rateLimit(req, bucket, limit, windowMs);
  if (r.ok) return null;
  const retry = Math.ceil((r.resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retry) } }
  );
}

// Occasionally evict expired buckets to bound memory.
export function sweep(): void {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
}
