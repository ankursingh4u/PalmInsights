import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { verifyUnlockToken } from "@/lib/token";
import { gateResult } from "@/lib/palmistry";

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

  return NextResponse.json({ result: gateResult(record.result, true) });
}
