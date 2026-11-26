import { config } from "../config";
import type { LineKey, Point } from "../types";

export interface CVLine {
  points: Point[];
  lengthClass: "long" | "short";
}

export type CVLines = Record<"heart" | "head" | "life", CVLine>;

// The service itself answers in ~3-4s; this leaves headroom for cold-start
// overhead (first contact with this host from a fresh Vercel lambda) without
// silently dropping grounding on an otherwise-healthy request.
const DETECT_TIMEOUT_MS = 15_000;

/**
 * Calls the deterministic CV palm-line-detector service. Returns null on any
 * failure (timeout, no hand detected, service down) — callers must fall back
 * to the LLM-only path rather than blocking the reading on this. Failures are
 * logged (not thrown) so a silent drop in grounding is visible in `vercel logs`.
 */
export async function detectLinesCV(image: string): Promise<CVLines | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DETECT_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.lineDetectorUrl}/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[lineDetector] HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!data.ok) {
      console.warn(`[lineDetector] no grounding: ${data.reason ?? "unknown"}`);
      return null;
    }
    return data.lines as CVLines;
  } catch (err) {
    console.error(`[lineDetector] call failed: ${(err as Error).message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Plain-language facts to ground the LLM's narrative for these 3 lines. */
export function cvFactsPrompt(cv: CVLines | null): string {
  if (!cv) return "";
  const label = (k: keyof CVLines) =>
    ({ heart: "Heart", head: "Head", life: "Life" }[k]);
  const lines = (Object.keys(cv) as (keyof CVLines)[])
    .map((k) => `- ${label(k)} line: measured ${cv[k].lengthClass.toUpperCase()} (from the actual photo, not a guess).`)
    .join("\n");
  return `\n\nMEASURED FACTS (from a deterministic computer-vision trace of this exact photo — these are ground truth, not your opinion; your pattern label and interpretation for these 3 lines MUST be consistent with them, e.g. a line measured SHORT cannot be described as "Long"):\n${lines}\n`;
}

/** Shape expected by lib/palmistry.ts's applyLineGeometry (normalized 0..1 points). */
export function cvToGeometry(cv: CVLines): Partial<Record<LineKey, Point[]>> {
  return { heart: cv.heart.points, head: cv.head.points, life: cv.life.points };
}
