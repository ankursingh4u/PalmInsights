import type { CompatibilityResult } from "./types";

// ---------------------------------------------------------------------------
// Love compatibility engine (premium). Accepts either two palm "seeds"
// (hashes of two analyzed hands) or a partner birth date. Produces a stable,
// deterministic compatibility reading.
// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  }
  return h >>> 0;
}

function rand(seed: number, salt: number): number {
  let t = (seed + salt * 0x9e3779b9) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pickN<T>(arr: T[], seed: number, n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand(seed, 200 + i) * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

const STRENGTHS = [
  "Strong emotional understanding",
  "Natural, easy communication",
  "Complementary energy levels",
  "Shared sense of ambition",
  "Deep mutual trust",
  "Aligned long-term values",
  "Playful, light-hearted connection",
  "Balanced give-and-take",
];

const CHALLENGES = [
  "Different decision-making styles",
  "Contrasting needs for independence",
  "Mismatched pacing in commitment",
  "Differing ways of handling stress",
  "Opposite approaches to planning",
  "Varied emotional expression styles",
];

const ADVICE = [
  "Lead with curiosity — ask before you assume.",
  "Make space for each other's independence; it strengthens the bond.",
  "Name what you need out loud rather than waiting to be understood.",
  "Celebrate small wins together to build momentum.",
  "When you disagree, slow down and find the shared goal underneath.",
];

/** Build a compatibility reading from a combined seed. */
export function computeCompatibility(seed: number): CompatibilityResult {
  // Score skewed toward the optimistic 60–95 range (it's an entertainment app),
  // but stable per input pair.
  const score = 60 + Math.floor(rand(seed, 1) * 36);
  const strengths = pickN(STRENGTHS, seed, 2 + (rand(seed, 9) > 0.5 ? 1 : 0));
  const challenges = pickN(CHALLENGES, seed, 1 + (rand(seed, 13) > 0.6 ? 1 : 0));
  const advice = pickN(ADVICE, seed, 2);

  const summary =
    score >= 85
      ? "A rare, magnetic match with deep natural alignment."
      : score >= 72
      ? "A warm, well-balanced connection with real long-term potential."
      : "A promising pairing — the spark is there, and it grows with effort.";

  return { score, summary, strengths, challenges, advice };
}

/** Compatibility from two palm seeds (two uploaded hands). */
export function compatibilityFromPalms(seedA: string, seedB: string): CompatibilityResult {
  const combined = hashString([seedA, seedB].sort().join("|"));
  return computeCompatibility(combined);
}

/** Compatibility from one palm seed + a partner birth date (YYYY-MM-DD). */
export function compatibilityFromBirthdate(seedA: string, birthdate: string): CompatibilityResult {
  const combined = hashString(`${seedA}|${birthdate}`);
  return computeCompatibility(combined);
}
