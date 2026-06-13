import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { config, polarEnabled } from "@/lib/config";
import { store } from "@/lib/store";
import { recordPaidUnlock } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Polar webhook — marks a scan as paid once the Deep Report is purchased.
 * Requires POLAR_WEBHOOK_SECRET. The /api/confirm route also retrieves the
 * checkout directly, so unlock works even before this fires.
 *
 * We act on `checkout.updated` (status → succeeded) and `order.paid`, both of
 * which carry the scanId we set in checkout metadata.
 */
export async function POST(req: NextRequest) {
  if (!polarEnabled || !config.polar.webhookSecret) {
    return NextResponse.json({ received: true, skipped: "not configured" });
  }

  const body = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = validateEvent(body, headers, config.polar.webhookSecret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    return NextResponse.json(
      { error: `Webhook error: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  // Narrow on event.type so TypeScript exposes the right `data` shape, then
  // pull the scanId we stored in checkout metadata.
  let scanId: unknown;
  if (event.type === "checkout.updated" && event.data.status === "succeeded") {
    scanId = event.data.metadata?.scanId;
  } else if (event.type === "order.paid") {
    scanId = event.data.metadata?.scanId;
  }

  if (typeof scanId === "string") {
    const record = await store.getScan(scanId);
    if (record && !record.paid) {
      await recordPaidUnlock(scanId, record.ownerKey, "polar");
    }
  }

  return NextResponse.json({ received: true });
}
