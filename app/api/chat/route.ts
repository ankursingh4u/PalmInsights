import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { verifyUnlockToken } from "@/lib/token";
import { askAstrologer } from "@/lib/ai/astrologer";
import { track } from "@/lib/analytics";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const BodySchema = z.object({
  scanId: z.string().min(1),
  token: z.string().min(1),
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

/**
 * "Ask the Astrologer" — a paid, conversational follow-up grounded in the
 * user's own reading. Gated behind a valid unlock token, exactly like the
 * premium report and compatibility features.
 */
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "chat", 20, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error?.issues?.[0]?.message || "Invalid request" },
      { status: 400 }
    );
  }
  const { scanId, token, messages } = parsed.data;

  // The last turn must be the user's question.
  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "Last message must be from the user" }, { status: 400 });
  }

  const record = await store.getScan(scanId);
  if (!record) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }
  if (!record.paid || !verifyUnlockToken(token, scanId)) {
    return NextResponse.json({ error: "Premium feature locked" }, { status: 403 });
  }

  const reply = await askAstrologer(record.result, messages);
  if (!reply) {
    return NextResponse.json(
      { error: "The astrologer is resting. Please try again in a moment." },
      { status: 503 }
    );
  }

  await track("astrologer_question", { ownerKey: record.ownerKey, scanId });

  return NextResponse.json({ reply });
}
