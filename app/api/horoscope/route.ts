import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { dailyGuidance } from "@/lib/ai/horoscope";
import { enforceRateLimit } from "@/lib/ratelimit";
import type { DailyGuidance } from "@/lib/types";

export const runtime = "nodejs";

const BodySchema = z.object({ scanId: z.string().min(1) });

const FALLBACK: DailyGuidance = {
  horoscope:
    "Your palm's energy is steady today — a good day to act on something you've been putting off. Trust the instinct your head and heart agree on.",
  wearColor: "Deep blue",
  outfit: "something simple with one bold accent",
  goodFor: ["Starting something new", "An honest conversation"],
  avoid: ["Overthinking small choices"],
  luckyTime: "Late afternoon",
  mood: "Grounded",
};

/** Returns rich, personalized daily guidance for a scan (cheap, text-only AI). */
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
  const guidance = (await dailyGuidance(record.result, today)) ?? FALLBACK;
  return NextResponse.json({ guidance, date: today });
}
