// Shared domain types for PalmInsight.

export type LineKey = "life" | "heart" | "head" | "fate";
export type Tier = "free" | "premium";

/** A normalized 2D point in [0,1] image space (MediaPipe convention). */
export interface Point {
  x: number;
  y: number;
}

/** A single MediaPipe hand landmark. */
export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

/** One detected palm line with its geometry and interpretation. */
export interface PalmLine {
  key: LineKey;
  label: string;
  color: string;
  tier: Tier;
  /** SVG path string in a 0..100 viewBox coordinate space. */
  path: string;
  /** Polyline points (0..100 space) — used for hit-testing / share rendering. */
  points: Point[];
  /** Human-readable detected pattern, e.g. "Long & Deep". */
  pattern: string;
  /** Stable machine key for the pattern. */
  patternKey: string;
  /** 0..100 confidence. */
  confidence: number;
  /** Short headline interpretation (1 line). */
  summary: string;
  /** Full interpretation bullets. */
  interpretation: string[];
}

/** Premium narrative sections (destiny / love / career). */
export interface ReportSection {
  title: string;
  body: string[];
}

export interface PremiumReport {
  destiny: ReportSection;
  career: ReportSection;
  love: ReportSection;
}

/** Result of an analysis. Premium lines/report are present only when unlocked. */
export interface AnalysisResult {
  id: string;
  createdAt: string;
  handedness: "Left" | "Right" | "Unknown";
  /** Free lines are always present; premium lines included only when unlocked. */
  lines: PalmLine[];
  /** True when premium content is included. */
  unlocked: boolean;
  /** Present only when unlocked. */
  report?: PremiumReport;
  /** Locked premium line previews (titles only) when not unlocked. */
  lockedPreviews?: { key: LineKey; label: string; color: string }[];
}

export interface CompatibilityResult {
  score: number;
  summary: string;
  strengths: string[];
  challenges: string[];
  advice: string[];
}

// --- accounts / persistence -------------------------------------------------

/** A registered user (Users table). */
export interface User {
  id: string;
  email: string;
  passwordHash: string; // scrypt: salt:hash
  createdAt: string;
}

/** Public-safe view of a user. */
export interface UserPublic {
  id: string;
  email: string;
  createdAt: string;
}

/** A payment record (Payments table). */
export interface Payment {
  id: string;
  scanId: string;
  ownerKey: string;
  amountCents: number;
  currency: string;
  provider: "polar" | "mock";
  status: "paid";
  createdAt: string;
}

/** Analytics event for conversion tracking. */
export type AnalyticsEventName =
  | "scan_created"
  | "paywall_viewed"
  | "checkout_started"
  | "premium_unlocked"
  | "compatibility_run"
  | "share_created";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  ownerKey?: string;
  scanId?: string;
  createdAt: string;
}

/** Aggregated metrics for the admin dashboard. */
export interface AnalyticsSummary {
  users: number;
  scans: number;
  paidScans: number;
  conversionRate: number; // % of scans that converted to paid
  revenueCents: number;
  currency: string;
  events: Record<string, number>;
  recentScans: ScanSummary[];
}

/** Lightweight scan summary for history/dashboard lists. */
export interface ScanSummary {
  id: string;
  createdAt: string;
  handedness: string;
  paid: boolean;
  topLine?: { label: string; pattern: string; color: string };
  hasImage: boolean;
}
