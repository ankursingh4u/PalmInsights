import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { getOwnerKey } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Only client-reportable events are accepted here.
const BodySchema = z.object({
  name: z.enum(["paywall_viewed", "share_created"]),
  scanId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "event", 60, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await track(parsed.data.name, { ownerKey: getOwnerKey(), scanId: parsed.data.scanId });
  return NextResponse.json({ ok: true });
}
