import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { dailyHoroscope } from "@/lib/ai/horoscope";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const BodySchema = z.object({ scanId: z.string().min(1) });

/** Returns a short daily palm horoscope for a scan (cheap, text-only AI). */
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "analyze", 30, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "scanId required" }, { status: 400 });
  }

  const record = await store.getScan(parsed.data.scanId);
  if (!record) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const horoscope = await dailyHoroscope(record.result, today);
  if (!horoscope) {
    return NextResponse.json({
      horoscope:
        "Your palm's energy is steady today — a good day to act on something you've been putting off. Trust the instinct your head and heart agree on.",
      date: today,
      fallback: true,
    });
  }
  return NextResponse.json({ horoscope, date: today });
}
