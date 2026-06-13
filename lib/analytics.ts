import { store } from "./store";
import { config } from "./config";
import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsSummary,
} from "./types";

/** Fire-and-forget event recording (never throws into request paths). */
export async function track(
  name: AnalyticsEventName,
  opts: { ownerKey?: string; scanId?: string } = {}
): Promise<void> {
  const event: AnalyticsEvent = {
    name,
    ownerKey: opts.ownerKey,
    scanId: opts.scanId,
    createdAt: new Date().toISOString(),
  };
  try {
    await store.recordEvent(event);
  } catch {
    /* analytics must never break the main flow */
  }
}

/** Build the dashboard summary (users, scans, conversion, revenue). */
export async function buildSummary(): Promise<AnalyticsSummary> {
  const [users, events, payments, recent] = await Promise.all([
    store.countUsers(),
    store.getEvents(),
    store.getPayments(),
    store.recentScans(25),
  ]);

  const counts: Record<string, number> = {};
  for (const e of events) counts[e.name] = (counts[e.name] || 0) + 1;

  const scans = counts["scan_created"] || 0;
  const paidScans = counts["premium_unlocked"] || payments.length;
  const revenueCents = payments.reduce((s, p) => s + p.amountCents, 0);
  const conversionRate = scans > 0 ? (paidScans / scans) * 100 : 0;

  return {
    users,
    scans,
    paidScans,
    conversionRate: Math.round(conversionRate * 100) / 100,
    revenueCents,
    currency: config.premiumCurrency,
    events: counts,
    recentScans: recent,
  };
}
