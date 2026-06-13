import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { config, polarEnabled, priceLabel } from "@/lib/config";
import { getPolar } from "@/lib/polar";
import { store } from "@/lib/store";
import { issueUnlockToken } from "@/lib/token";
import { track } from "@/lib/analytics";
import { recordPaidUnlock } from "@/lib/payments";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const BodySchema = z.object({ scanId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "checkout", 20, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "scanId required" }, { status: 400 });
  }
  const { scanId } = parsed.data;

  const record = await store.getScan(scanId);
  if (!record) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (record.paid) {
    return NextResponse.json({ mock: false, alreadyPaid: true, token: issueUnlockToken(scanId) });
  }

  await track("checkout_started", { ownerKey: record.ownerKey, scanId });

  // ---- Mock mode (no Polar keys): grant unlock immediately. --------------
  if (!polarEnabled) {
    await recordPaidUnlock(scanId, record.ownerKey, "mock");
    return NextResponse.json({
      mock: true,
      token: issueUnlockToken(scanId),
      message: `Mock checkout: ${priceLabel()} payment simulated (no Polar keys configured).`,
    });
  }

  // ---- Real Polar Checkout ----------------------------------------------
  const polar = getPolar();
  if (!polar) return NextResponse.json({ error: "Payments unavailable" }, { status: 500 });

  try {
    const checkout = await polar.checkouts.create({
      products: [config.polar.productId],
      // Polar substitutes {CHECKOUT_ID} into the success URL on redirect.
      successUrl: `${config.baseUrl}/scan?scanId=${scanId}&checkout_id={CHECKOUT_ID}`,
      metadata: { scanId },
    });
    return NextResponse.json({ mock: false, url: checkout.url });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not start checkout", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
