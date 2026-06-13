import crypto from "crypto";
import { config } from "./config";
import { store } from "./store";
import { track } from "./analytics";
import type { Payment } from "./types";

/**
 * Marks a scan as paid, records a Payment row, and tracks the unlock event.
 * Idempotent enough for the demo store (re-recording on webhook+confirm is
 * acceptable; swap for an upsert keyed on the Polar checkout id in prod).
 */
export async function recordPaidUnlock(
  scanId: string,
  ownerKey: string,
  provider: Payment["provider"]
): Promise<void> {
  await store.setPaid(scanId);
  await store.recordPayment({
    id: crypto.randomUUID(),
    scanId,
    ownerKey,
    amountCents: config.premiumPriceCents,
    currency: config.premiumCurrency,
    provider,
    status: "paid",
    createdAt: new Date().toISOString(),
  });
  await track("premium_unlocked", { ownerKey, scanId });
}
