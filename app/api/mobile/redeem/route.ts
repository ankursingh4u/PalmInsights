import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerKey } from "@/lib/auth";
import { issueProToken } from "@/lib/token";
import { store } from "@/lib/store";
import { track } from "@/lib/analytics";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Launch coupon → free Pro for the first N users. No DB schema change: we count
// redemptions from the existing analytics event log. Configure via env:
//   LAUNCH_COUPON (default "PALMPRO")  — the code testers enter
//   LAUNCH_COUPON_LIMIT (default 100)  — how many free Pro grants
const COUPON = (process.env.LAUNCH_COUPON || "PALMPRO").trim().toUpperCase();
const LIMIT = Number(process.env.LAUNCH_COUPON_LIMIT || 100);

const BodySchema = z.object({ code: z.string().min(1).max(40) });

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "redeem", 10, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a code." }, { status: 400 });
  }
  if (parsed.data.code.trim().toUpperCase() !== COUPON) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }

  const ownerKey = getOwnerKey();

  // Enforce the first-N-users cap from the event log.
  const events = await store.getEvents();
  const redeemed = events.filter((e) => e.name === "coupon_redeemed");
  const already = redeemed.some((e) => e.ownerKey === ownerKey);
  if (!already && redeemed.length >= LIMIT) {
    return NextResponse.json(
      { error: "This launch code has reached its limit. 🙏" },
      { status: 410 }
    );
  }

  if (!already) await track("coupon_redeemed", { ownerKey });
  return NextResponse.json({ pro: true, proToken: issueProToken(ownerKey) });
}
