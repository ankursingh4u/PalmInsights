// Shared shapes (subset of the backend's lib/types.ts) used by the app.

export type LineKey = "life" | "heart" | "head" | "fate";

export interface PalmLine {
  key: LineKey;
  label: string;
  color: string;
  tier: "free" | "premium";
  pattern: string;
  confidence: number;
  summary: string;
  interpretation: string[];
}

export interface ReportSection {
  title: string;
  body: string[];
}

export interface PremiumReport {
  highlights: { archetype: string; luckyNumber: string; luckyColor: string; luckyDay: string };
  destiny: ReportSection;
  career: ReportSection;
  wealth: ReportSection;
  luck: ReportSection;
  love: ReportSection;
  vibe: ReportSection;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  handedness: "Left" | "Right" | "Unknown";
  lines: PalmLine[];
  unlocked: boolean;
  report?: PremiumReport;
  lockedPreviews?: { key: LineKey; label: string; color: string }[];
}

export interface UserPublic {
  id: string;
  email: string;
  createdAt: string;
}

export interface ScanSummary {
  id: string;
  createdAt: string;
  handedness: "Left" | "Right" | "Unknown";
  paid: boolean;
  personName?: string;
  topLine?: { label: string; pattern: string; color: string };
  hasImage: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
