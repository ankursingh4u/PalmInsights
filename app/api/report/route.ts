import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { verifyUnlockToken } from "@/lib/token";
import { gateResult, applyVisionReading } from "@/lib/palmistry";
import { analyzePalmImage } from "@/lib/ai/palmVision";

export const runtime = "nodejs";

const BodySchema = z.object({
  scanId: z.string().min(1),
  token: z.string().min(1),
});

/** Returns the FULL premium result if the scan is paid and the token valid. */
export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "scanId and token required" }, { status: 400 });
  }
  const { scanId, token } = parsed.data;

  const record = await store.getScan(scanId);
  if (!record) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (!record.paid || !verifyUnlockToken(token, scanId)) {
    return NextResponse.json({ error: "Not unlocked" }, { status: 403 });
  }

  // Upgrade the paid reading with the MOST CAPABLE model ("full potential"),
  // re-reading the real image for Head + Fate + the full report. Computed once
  // and cached on the record (head line marked "head-ai" once enhanced).
  const head = record.result.lines.find((l) => l.key === "head");
  const alreadyEnhanced = head?.patternKey === "head-ai";
  if (record.image && !alreadyEnhanced) {
    const vision = await analyzePalmImage(record.image, {
      tier: "paid",
      lines: ["life", "heart", "head", "fate"],
      report: true,
    });
    if (vision?.lines?.length) {
      const enhanced = applyVisionReading(record.result, vision);
      record.result = enhanced;
      await store.saveScan(record); // cache so we don't re-call the model
    }
  }

  return NextResponse.json({ result: gateResult(record.result, true) });
}
