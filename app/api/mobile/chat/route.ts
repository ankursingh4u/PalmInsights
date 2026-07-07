import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { askAstrologer } from "@/lib/ai/astrologer";
import { getOwnerKey } from "@/lib/auth";
import { verifyProToken } from "@/lib/token";
import { track } from "@/lib/analytics";
import { enforceRateLimit, enforceOwnerDaily } from "@/lib/ratelimit";

export const runtime = "nodejs";

const CHAT_DAILY_LIMIT = Number(process.env.PRO_CHAT_DAILY || 20);

const BodySchema = z.object({
  scanId: z.string().min(1),
  proToken: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(24),
});

// "Ask the Astrologer" — Pro-only (astrologer chat is a paid feature). Requires
// a valid Pro token (from the launch coupon or the $9/30-day subscription) and
// is capped per day to protect the AI budget.
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "mobilechat", 30, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error?.issues?.[0]?.message || "Invalid request" },
      { status: 400 }
    );
  }
  const { scanId, proToken, messages } = parsed.data;
  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "Last message must be from the user" }, { status: 400 });
  }

  // Pro gate: only paying/coupon users can talk to the astrologer.
  const ownerKey = getOwnerKey();
  if (!verifyProToken(proToken, ownerKey)) {
    return NextResponse.json({ requiresPro: true }, { status: 402 });
  }

  const capped = enforceOwnerDaily(ownerKey, "chat", CHAT_DAILY_LIMIT);
  if (capped) return capped;

  const record = await store.getScan(scanId);
  if (!record) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  const reply = await askAstrologer(record.result, messages);
  if (!reply) {
    return NextResponse.json(
      { error: "The astrologer is resting. Please try again in a moment." },
      { status: 503 }
    );
  }

  await track("astrologer_question", { ownerKey, scanId });
  return NextResponse.json({ reply });
}
