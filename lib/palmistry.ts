import type {
  AnalysisResult,
  Landmark,
  LineKey,
  PalmLine,
  Point,
  PremiumReport,
  Tier,
} from "./types";
import {
  add,
  arc,
  centroid,
  dist,
  lerp,
  normalize,
  perp,
  polylineLength,
  scale,
  smoothPath,
  sub,
  toViewBox,
} from "./geometry";

// ---------------------------------------------------------------------------
// PalmInsight rule engine.
//
// Given 21 MediaPipe hand landmarks, this module:
//   1. Derives anatomically-anchored geometry for the four palm lines.
//   2. Extracts geometric features from the actual hand.
//   3. Maps those features to discrete palmistry patterns (deterministic).
//   4. Generates interpretation text and a premium narrative report.
//
// Everything is deterministic: the same hand image always yields the same
// reading. Results are "based on" the real detected hand (its proportions,
// thumb spread, finger arch, palm width, etc.) rather than random.
// ---------------------------------------------------------------------------

// MediaPipe hand landmark indices.
const WRIST = 0;
const THUMB_CMC = 1;
const THUMB_MCP = 2;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const PINKY_MCP = 17;
const PINKY_TIP = 20;

export const LINE_META: Record<
  LineKey,
  { label: string; color: string; tier: Tier }
> = {
  life: { label: "Life Line", color: "#ef4444", tier: "free" },
  heart: { label: "Heart Line", color: "#3b82f6", tier: "free" },
  head: { label: "Head Line", color: "#eab308", tier: "premium" },
  fate: { label: "Fate Line", color: "#22c55e", tier: "premium" },
};

export const LINE_ORDER: LineKey[] = ["life", "heart", "head", "fate"];

// --- deterministic hashing --------------------------------------------------

/** Stable 32-bit hash of the landmark set (rounded) — used for tie-breaks. */
function hashLandmarks(lms: Landmark[]): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (const l of lms) {
    const a = Math.round(l.x * 1000);
    const b = Math.round(l.y * 1000);
    h = Math.imul(h ^ a, 16777619) >>> 0;
    h = Math.imul(h ^ b, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic pseudo-random in [0,1) from a seed + salt. */
function rand(seed: number, salt: number): number {
  let t = (seed + salt * 0x9e3779b9) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// --- feature extraction -----------------------------------------------------

interface PalmFeatures {
  seed: number;
  center: Point; // palm centroid (viewBox space)
  palmWidth: number;
  palmHeight: number;
  handSpan: number;
  thumbSpread: number; // 0..1-ish, normalized
  fingerArch: number; // curvature of the knuckle line
  middleAlign: number; // how aligned wrist->middle is to vertical of palm
  indexRingRatio: number;
  toThumb: Point; // unit vector from palm center toward thumb side
  toWrist: Point; // unit vector from middle knuckles toward wrist
}

function extractFeatures(lms: Landmark[]): PalmFeatures {
  const p = lms.map(toViewBox); // 0..100 space
  const center = centroid([
    p[WRIST],
    p[INDEX_MCP],
    p[MIDDLE_MCP],
    p[RING_MCP],
    p[PINKY_MCP],
  ]);

  const palmWidth = dist(p[INDEX_MCP], p[PINKY_MCP]);
  const palmHeight = dist(p[WRIST], p[MIDDLE_MCP]);
  const handSpan = dist(p[WRIST], p[MIDDLE_TIP]) || 1;

  // Thumb spread: distance of thumb tip from the index MCP, normalized by palm.
  const thumbSpread = dist(p[THUMB_TIP], p[INDEX_MCP]) / (palmWidth || 1);

  // Finger arch: how much the knuckle line bows. Compare middle MCP to the
  // chord between index and pinky MCP.
  const knuckleChordMid = lerp(p[INDEX_MCP], p[PINKY_MCP], 0.5);
  const fingerArch = dist(p[MIDDLE_MCP], knuckleChordMid) / (palmWidth || 1);

  // Middle-finger alignment with the palm vertical axis.
  const vAxis = normalize(sub(p[MIDDLE_MCP], p[WRIST]));
  const mDir = normalize(sub(p[MIDDLE_TIP], p[MIDDLE_MCP]));
  const middleAlign = vAxis.x * mDir.x + vAxis.y * mDir.y; // ~1 = straight

  const indexLen = dist(p[INDEX_MCP], p[INDEX_TIP]);
  const ringLen = dist(p[RING_MCP], lms.length > 16 ? p[16] : p[RING_MCP]);
  const indexRingRatio = indexLen / (ringLen || 1);

  // Orientation-independent direction vectors (works for L/R hands & mirroring).
  const toThumb = normalize(sub(p[THUMB_CMC], center));
  const toWrist = normalize(sub(p[WRIST], p[MIDDLE_MCP]));

  return {
    seed: hashLandmarks(lms),
    center,
    palmWidth,
    palmHeight,
    handSpan,
    thumbSpread,
    fingerArch,
    middleAlign,
    indexRingRatio,
    toThumb,
    toWrist,
  };
}

// --- line geometry ----------------------------------------------------------

function buildLifePoints(lms: Landmark[], f: PalmFeatures): Point[] {
  const p = lms.map(toViewBox);
  // Origin in the web between thumb and index.
  const start = lerp(p[INDEX_MCP], p[THUMB_MCP], 0.45);
  // Ends near the wrist on the thumb side.
  const end = lerp(p[WRIST], p[THUMB_CMC], 0.55);
  // Bow outward around the thumb base (toward the thumb side).
  const bow = (0.35 + f.thumbSpread * 0.25) * f.palmWidth * 0.6;
  return arc(start, end, f.toThumb, bow, 8);
}

function buildHeartPoints(lms: Landmark[], f: PalmFeatures): Point[] {
  const p = lms.map(toViewBox);
  const down = scale(f.toWrist, f.palmHeight * 0.16);
  // From under the pinky to under the index/middle, high on the palm.
  const start = add(p[PINKY_MCP], down);
  const end = add(lerp(p[INDEX_MCP], p[MIDDLE_MCP], 0.35), down);
  const bow = (0.12 + f.fingerArch * 0.5) * f.palmWidth * 0.5;
  // Heart line bows upward (toward fingers) when curved/romantic.
  const upward = scale(f.toWrist, -1);
  return arc(start, end, upward, bow, 7);
}

function buildHeadPoints(lms: Landmark[], f: PalmFeatures): Point[] {
  const p = lms.map(toViewBox);
  // Shares origin region with the life line, runs across toward pinky side.
  const start = lerp(p[INDEX_MCP], p[THUMB_MCP], 0.5);
  const startLow = add(start, scale(f.toWrist, f.palmHeight * 0.14));
  const end = add(p[PINKY_MCP], scale(f.toWrist, f.palmHeight * 0.42));
  const bow = (0.06 + (1 - f.middleAlign) * 0.4) * f.palmWidth * 0.5;
  return arc(startLow, end, f.toWrist, bow, 7);
}

function buildFatePoints(lms: Landmark[], f: PalmFeatures): Point[] {
  const p = lms.map(toViewBox);
  const start = lerp(p[WRIST], p[MIDDLE_MCP], 0.08);
  const end = lerp(p[WRIST], p[MIDDLE_MCP], 0.86);
  // Slight horizontal drift for realism.
  const drift = scale(perp(f.toWrist), f.palmWidth * 0.04);
  return arc(add(start, scale(drift, -1)), end, drift, f.palmWidth * 0.05, 6);
}

// --- pattern classification -------------------------------------------------

interface Classified {
  pattern: string;
  patternKey: string;
  confidence: number;
  summary: string;
  interpretation: string[];
}

function bucket(value: number, low: number, high: number): "low" | "mid" | "high" {
  if (value < low) return "low";
  if (value > high) return "high";
  return "mid";
}

function classifyLife(f: PalmFeatures, points: Point[]): Classified {
  const length = polylineLength(points) / (f.handSpan || 1);
  const lengthClass = bucket(length, 0.85, 1.15); // short / stable / long
  const depthClass = bucket(f.thumbSpread, 0.95, 1.25); // faint / med / deep
  // "Broken" is not geometrically determinable from landmarks alone; derive
  // from a stable per-hand signal so a minority of hands show it.
  const broken = rand(f.seed, 11) < 0.18;

  const depthWord = depthClass === "high" ? "Deep" : depthClass === "low" ? "Faint" : "Moderate";
  const lengthWord = lengthClass === "high" ? "Long" : lengthClass === "low" ? "Short" : "Balanced";
  const pattern = broken ? `${depthWord} & Broken` : `${depthWord} & ${lengthWord}`;
  const patternKey = `life-${depthClass}-${lengthClass}-${broken ? "broken" : "whole"}`;

  const interp: string[] = [];
  if (depthClass === "high")
    interp.push("A deep life line points to strong vitality — you recover quickly from setbacks and maintain steady personal energy.");
  else if (depthClass === "low")
    interp.push("A finer life line suggests you pace your energy carefully and value rest, recovery, and a measured lifestyle.");
  else
    interp.push("A balanced life line reflects dependable energy — you sustain effort without burning out.");

  if (lengthClass === "high")
    interp.push("Its length indicates a stable, long-arc life path with enduring routines and relationships.");
  else if (lengthClass === "low")
    interp.push("Its shorter reach hints at a life shaped by intensity and focused chapters rather than long plateaus.");

  if (broken)
    interp.push("A break along the line marks a meaningful turning point — a major life change that redirects your path for the better.");

  const summary = broken
    ? "Resilient energy, with a defining life pivot ahead or behind you."
    : depthClass === "high"
    ? "Resilient and energetic — you bounce back from challenges."
    : "Steady, self-aware energy that you manage well.";

  const confidence = clampConf(72 + (f.thumbSpread - 1) * 22 + jitter(f.seed, 1));
  return { pattern, patternKey, confidence, summary, interpretation: interp };
}

function classifyHeart(f: PalmFeatures, points: Point[]): Classified {
  const curve = f.fingerArch; // higher arch -> more curved heart line
  const curveClass = bucket(curve, 0.05, 0.12); // straight / mid / curved
  const branches = rand(f.seed, 23) < 0.33;

  const curveWord = curveClass === "high" ? "Curved" : curveClass === "low" ? "Straight" : "Gently Curved";
  const pattern = branches ? `${curveWord} with Branches` : curveWord;
  const patternKey = `heart-${curveClass}-${branches ? "branched" : "single"}`;

  const interp: string[] = [];
  if (curveClass === "high")
    interp.push("A curved heart line reveals a warm, romantic nature — you lead with feeling and express affection openly.");
  else if (curveClass === "low")
    interp.push("A straight heart line shows a logical approach to love — you value clarity, loyalty, and steady commitment over drama.");
  else
    interp.push("A gently curved heart line balances warmth with composure — affectionate, yet grounded in how you love.");

  if (branches)
    interp.push("Branching reflects emotional complexity: you hold space for many people and feel things on more than one level.");

  const summary =
    curveClass === "high"
      ? "Romantic and emotionally expressive."
      : curveClass === "low"
      ? "Loyal and level-headed in love."
      : "Warm but grounded in matters of the heart.";

  const confidence = clampConf(74 + curve * 80 + jitter(f.seed, 2));
  return { pattern, patternKey, confidence, summary, interpretation: interp };
}

function classifyHead(f: PalmFeatures, points: Point[]): Classified {
  const length = polylineLength(points) / (f.palmWidth || 1);
  const lengthClass = bucket(length, 1.0, 1.35);
  const straightness = f.middleAlign; // ~1 straight, lower = curved
  const curveClass = straightness > 0.9 ? "straight" : "curved";

  const lengthWord = lengthClass === "high" ? "Long" : lengthClass === "low" ? "Short" : "Medium";
  const curveWord = curveClass === "straight" ? "Straight" : "Curved";
  const pattern = `${lengthWord} & ${curveWord}`;
  const patternKey = `head-${lengthClass}-${curveClass}`;

  const interp: string[] = [];
  if (lengthClass === "high")
    interp.push("A long head line marks an analytical mind — you think things through thoroughly before you act.");
  else if (lengthClass === "low")
    interp.push("A shorter head line favors decisiveness — you trust your instincts and act without overthinking.");
  else
    interp.push("A medium head line blends reflection with action — you weigh options, then commit.");

  if (curveClass === "curved")
    interp.push("Its curve signals creative thinking — you approach problems imaginatively and connect ideas others miss.");
  else
    interp.push("Its straight run signals a practical mindset — you prefer concrete, results-driven reasoning.");

  const summary =
    curveClass === "curved" ? "Creative, big-picture thinker." : "Practical, structured thinker.";

  const confidence = clampConf(70 + length * 12 + jitter(f.seed, 3));
  return { pattern, patternKey, confidence, summary, interpretation: interp };
}

function classifyFate(f: PalmFeatures, points: Point[]): Classified {
  // Depth proxy: alignment of the middle finger with the palm axis.
  const depth = f.middleAlign;
  const depthClass = depth > 0.93 ? "deep" : depth > 0.82 ? "moderate" : "faint";
  const broken = rand(f.seed, 41) < 0.25;

  const depthWord = depthClass === "deep" ? "Deep" : depthClass === "faint" ? "Faint" : "Moderate";
  const pattern = broken ? `${depthWord} & Broken` : depthWord;
  const patternKey = `fate-${depthClass}-${broken ? "broken" : "whole"}`;

  const interp: string[] = [];
  if (depthClass === "deep")
    interp.push("A deep fate line indicates strong career focus — your direction is clear and you pursue it with determination.");
  else if (depthClass === "faint")
    interp.push("A faint fate line points to a flexible career path — you adapt, explore, and let opportunities shape your route.");
  else
    interp.push("A moderate fate line suggests steady progress with room to pivot when the right opening appears.");

  if (broken)
    interp.push("A break marks career shifts — expect (or recognize) a turning point where you change course and grow.");

  const summary =
    depthClass === "deep"
      ? "Focused, driven career trajectory."
      : depthClass === "faint"
      ? "Adaptable, opportunity-led career."
      : "Steady career with a key pivot.";

  const confidence = clampConf(68 + depth * 18 + jitter(f.seed, 4));
  return { pattern, patternKey, confidence, summary, interpretation: interp };
}

function jitter(seed: number, salt: number): number {
  return (rand(seed, salt * 7) - 0.5) * 8; // +/-4
}

function clampConf(n: number): number {
  return Math.round(Math.max(56, Math.min(96, n)));
}

// --- premium report ---------------------------------------------------------

function buildReport(lines: Record<LineKey, PalmLine>, f: PalmFeatures): PremiumReport {
  const fate = lines.fate;
  const head = lines.head;
  const heart = lines.heart;
  const seed = f.seed;

  const careerEnvs = pickN(
    ["Entrepreneurship", "Technology", "Strategic roles", "Creative professions", "Leadership", "Research", "Independent ventures"],
    seed,
    3
  );
  const decade = 25 + Math.floor(rand(seed, 5) * 12); // late 20s–30s turning point

  return {
    destiny: {
      title: "Full Destiny Report",
      body: [
        `Your palm tells the story of a ${head.summary.toLowerCase().replace(/\.$/, "")} guided by ${heart.summary.toLowerCase().replace(/\.$/, "")}`,
        `The interplay of your head and heart lines suggests you make decisions that honor both logic and feeling — a rare balance that serves you in moments that matter most.`,
        `A defining chapter opens around age ${decade}, when the threads of your fate line converge. Lean into it; it sets the tone for the decade that follows.`,
      ],
    },
    career: {
      title: "Career Tendency Report",
      body: [
        `Your fate line suggests ${fate.summary.toLowerCase().replace(/\.$/, "")}, with momentum building rather than arriving all at once.`,
        `You may experience a key turning point in your late ${Math.floor(decade / 10) * 10 === 20 ? "20s" : "20s–30s"} — a project, role, or risk that redefines what you do.`,
        `Best-suited environments: ${careerEnvs.join(", ")}.`,
      ],
    },
    love: {
      title: "Love & Relationship Report",
      body: [
        `In love, your heart line marks you as ${heart.summary.toLowerCase().replace(/\.$/, "")}.`,
        `You connect most deeply with partners who respect both your independence and your need for genuine emotional honesty.`,
        `Your strongest relationships are built slowly and intentionally — depth over speed, trust over intensity.`,
      ],
    },
  };
}

function pickN<T>(arr: T[], seed: number, n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand(seed, 100 + i) * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// --- public API -------------------------------------------------------------

const BUILDERS: Record<LineKey, (lms: Landmark[], f: PalmFeatures) => Point[]> = {
  life: buildLifePoints,
  heart: buildHeartPoints,
  head: buildHeadPoints,
  fate: buildFatePoints,
};

const CLASSIFIERS: Record<LineKey, (f: PalmFeatures, pts: Point[]) => Classified> = {
  life: classifyLife,
  heart: classifyHeart,
  head: classifyHead,
  fate: classifyFate,
};

/**
 * Run the full analysis on detected landmarks. Always returns ALL four lines
 * and the premium report. Gating (free vs premium) is applied separately by
 * `gateResult` so premium text never reaches the client until unlocked.
 */
export function analyzePalm(
  landmarks: Landmark[],
  handedness: "Left" | "Right" | "Unknown",
  id: string,
  createdAt: string
): { full: AnalysisResult; report: PremiumReport } {
  const f = extractFeatures(landmarks);
  const lineMap = {} as Record<LineKey, PalmLine>;

  for (const key of LINE_ORDER) {
    const pts = BUILDERS[key](landmarks, f);
    const c = CLASSIFIERS[key](f, pts);
    const meta = LINE_META[key];
    lineMap[key] = {
      key,
      label: meta.label,
      color: meta.color,
      tier: meta.tier,
      path: smoothPath(pts),
      points: pts,
      pattern: c.pattern,
      patternKey: c.patternKey,
      confidence: c.confidence,
      summary: c.summary,
      interpretation: c.interpretation,
    };
  }

  const report = buildReport(lineMap, f);

  const full: AnalysisResult = {
    id,
    createdAt,
    handedness,
    lines: LINE_ORDER.map((k) => lineMap[k]),
    unlocked: true,
    report,
  };

  return { full, report };
}

/**
 * Produce the client-facing result. When `unlocked` is false, premium lines
 * are reduced to title-only previews and the report is stripped.
 */
export function gateResult(full: AnalysisResult, unlocked: boolean): AnalysisResult {
  if (unlocked) return { ...full, unlocked: true };

  const freeLines = full.lines.filter((l) => l.tier === "free");
  const lockedPreviews = full.lines
    .filter((l) => l.tier === "premium")
    .map((l) => ({ key: l.key, label: l.label, color: l.color }));

  return {
    id: full.id,
    createdAt: full.createdAt,
    handedness: full.handedness,
    lines: freeLines,
    unlocked: false,
    lockedPreviews,
  };
}
