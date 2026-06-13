import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { verifyUnlockToken } from "@/lib/token";
import {
  compatibilityFromBirthdate,
  compatibilityFromPalms,
} from "@/lib/compatibility";
import { track } from "@/lib/analytics";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    scanId: z.string().min(1),
    token: z.string().min(1),
    partnerScanId: z.string().min(1).optional(),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .optional(),
  })
  .refine((d) => d.partnerScanId || d.birthdate, {
    message: "Provide a partner palm or a birth date",
  });

/** Premium love-compatibility. Gated behind a valid unlock token. */
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "compatibility", 30, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error?.issues?.[0]?.message || "Invalid request" },
      { status: 400 }
    );
  }
  const { scanId, token, partnerScanId, birthdate } = parsed.data;

  const record = await store.getScan(scanId);
  if (!record) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }
  if (!record.paid || !verifyUnlockToken(token, scanId)) {
    return NextResponse.json({ error: "Premium feature locked" }, { status: 403 });
  }

  const result = partnerScanId
    ? compatibilityFromPalms(scanId, partnerScanId)
    : compatibilityFromBirthdate(scanId, birthdate!);

  await track("compatibility_run", { ownerKey: record.ownerKey, scanId });

  return NextResponse.json({ result });
}
