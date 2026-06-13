import type { Landmark, Point } from "./types";

// ---------------------------------------------------------------------------
// Small 2D vector / curve helpers used by the palm-line geometry builder.
// All functions operate on {x,y} points. Inputs may be normalized [0,1]
// (MediaPipe) or 0..100 (viewBox) — the helpers are scale-agnostic.
// ---------------------------------------------------------------------------

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(a: Point, s: number): Point {
  return { x: a.x * s, y: a.y * s };
}

export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function len(a: Point): number {
  return Math.hypot(a.x, a.y);
}

export function normalize(a: Point): Point {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l };
}

/** Perpendicular (rotated 90deg) of a vector. */
export function perp(a: Point): Point {
  return { x: -a.y, y: a.x };
}

export function centroid(points: Point[]): Point {
  const s = points.reduce((acc, p) => add(acc, p), { x: 0, y: 0 });
  return scale(s, 1 / Math.max(points.length, 1));
}

/** Total length of a polyline. */
export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}

/** Convert a normalized landmark to a 0..100 viewBox point. */
export function toViewBox(l: Landmark): Point {
  return { x: l.x * 100, y: l.y * 100 };
}

/**
 * Build a smooth SVG path string through the given points using a
 * Catmull-Rom spline converted to cubic beziers. Produces natural,
 * hand-drawn-looking palm lines.
 */
export function smoothPath(points: Point[], tension = 0.5): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${fmt(points[0])}`;
  if (points.length === 2) return `M ${fmt(points[0])} L ${fmt(points[1])}`;

  const p = points;
  let d = `M ${fmt(p[0])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;

    const c1 = {
      x: p1.x + ((p2.x - p0.x) / 6) * tension * 2,
      y: p1.y + ((p2.y - p0.y) / 6) * tension * 2,
    };
    const c2 = {
      x: p2.x - ((p3.x - p1.x) / 6) * tension * 2,
      y: p2.y - ((p3.y - p1.y) / 6) * tension * 2,
    };
    d += ` C ${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return d;
}

function fmt(p: Point): string {
  return `${round(p.x)} ${round(p.y)}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Sample N points along a quadratic-ish arc from `start` to `end`, bowed
 * toward `bowDir` by `bow` units at the midpoint. Returns evenly spaced points.
 */
export function arc(start: Point, end: Point, bowDir: Point, bow: number, n = 7): Point[] {
  const out: Point[] = [];
  const dir = normalize(bowDir);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const base = lerp(start, end, t);
    // Parabolic weighting — 0 at ends, 1 at middle.
    const w = 4 * t * (1 - t);
    out.push({ x: base.x + dir.x * bow * w, y: base.y + dir.y * bow * w });
  }
  return out;
}
