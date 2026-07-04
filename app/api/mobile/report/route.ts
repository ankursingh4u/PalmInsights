import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { gateResult, applyVisionReading } from "@/lib/palmistry";
import { analyzePalmImage } from "@/lib/ai/palmVision";
import { getOwnerKey } from "@/lib/auth";
import { verifyProToken } from "@/lib/token";
import { track } from "@/lib/analytics";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60; // full report = most-capable model, can be slow

const BodySchema = z.object({ scanId: z.string().min(1), proToken: z.string().optional() });

// The app's Deep Report. Upgrades the reading with the most capable model
// (all four lines + the 6-chapter premium report) and returns it. No unlock
// token for now (billing not live on sideloaded builds); gate this behind
// Google Play Billing once the app ships on the Play Store.
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "mobilereport", 15, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "scanId required" }, { status: 400 });
  }
  // Pro-gated: unlock with a valid Pro token (from the launch coupon, or from
  // billing once live). Free users get the paywall instead.
  if (!verifyProToken(parsed.data.proToken, getOwnerKey())) {
    return NextResponse.json({ requiresPro: true }, { status: 402 });
  }

  const record = await store.getScan(parsed.data.scanId);
  if (!record) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  // Compute once and cache on the record (head line marked "head-ai" once done).
  const head = record.result.lines.find((l) => l.key === "head");
  const alreadyEnhanced = head?.patternKey === "head-ai" && record.result.report;
  if (record.image && !alreadyEnhanced) {
    const vision = await analyzePalmImage(record.image, {
      tier: "paid",
      lines: ["life", "heart", "head", "fate"],
      report: true,
    });
    if (vision?.lines?.length) {
      record.result = applyVisionReading(record.result, vision);
      record.paid = true; // unlocked in-app (free for now)
      await store.saveScan(record);
    }
  }

  if (!record.result.report) {
    return NextResponse.json(
      { error: "The deep reading is busy. Please try again in a moment." },
      { status: 503 }
    );
  }

  await track("premium_unlocked", { ownerKey: record.ownerKey, scanId: record.id });
  return NextResponse.json({ result: gateResult(record.result, true) });
}
