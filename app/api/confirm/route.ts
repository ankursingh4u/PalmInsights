import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { polarEnabled } from "@/lib/config";
import { getPolar } from "@/lib/polar";
import { store } from "@/lib/store";
import { issueUnlockToken } from "@/lib/token";
import { recordPaidUnlock } from "@/lib/payments";

export const runtime = "nodejs";

const BodySchema = z.object({
  scanId: z.string().min(1),
  checkoutId: z.string().optional(),
});

/**
 * Confirms payment after returning from Polar Checkout (success_url) and
 * issues an unlock token. Retrieves the Polar checkout directly so unlock works
 * even if the webhook hasn't landed yet.
 */
export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "scanId required" }, { status: 400 });
  }
  const { scanId, checkoutId } = parsed.data;

  const record = await store.getScan(scanId);
  if (!record) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (record.paid) {
    return NextResponse.json({ paid: true, token: issueUnlockToken(scanId) });
  }

  if (polarEnabled && checkoutId) {
    const polar = getPolar();
    try {
      const checkout = await polar!.checkouts.get({ id: checkoutId });
      // "succeeded" = fully processed; "confirmed" = payment captured, order
      // finalizing. Both mean the customer has paid — unlock either way.
      const paid =
        (checkout.status === "succeeded" || checkout.status === "confirmed") &&
        checkout.metadata?.scanId === scanId;
      if (paid) {
        await recordPaidUnlock(scanId, record.ownerKey, "polar");
        return NextResponse.json({ paid: true, token: issueUnlockToken(scanId) });
      }
      return NextResponse.json({ paid: false }, { status: 402 });
    } catch (err) {
      return NextResponse.json(
        { paid: false, error: (err as Error).message },
        { status: 402 }
      );
    }
  }

  return NextResponse.json({ paid: false }, { status: 402 });
}
