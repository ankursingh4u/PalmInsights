import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import type { AnalysisResult } from "@/lib/types";
import {
  LINE_META,
  LINE_ORDER,
  gateResult,
  applyVisionReading,
  applyLineGeometry,
} from "@/lib/palmistry";
import { analyzePalmImage, detectLineGeometry } from "@/lib/ai/palmVision";
import { aiEnabled } from "@/lib/config";
import { store } from "@/lib/store";
import { getOwnerKey, getSessionUserId } from "@/lib/auth";
import { verifyProToken } from "@/lib/token";
import { track } from "@/lib/analytics";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60; // AI vision + geometry can exceed the 10s default

// Free users get this many readings total; Pro is unlimited.
const FREE_READINGS = Number(process.env.FREE_READINGS || 1);

// The native app has no MediaPipe landmarks, so this endpoint reads the palm
// from the IMAGE alone: the AI both gatekeeps (is it a real palm?) and reads the
// lines, and traces the overlay geometry. Mirrors /api/analyze's AI path but
// without the landmark requirement. The website's /api/analyze is unchanged.

const BodySchema = z.object({
  image: z.string().startsWith("data:image/").max(8_000_000),
  handedness: z.enum(["Left", "Right", "Unknown"]).default("Unknown"),
  personName: z.string().trim().max(40).optional(),
  proToken: z.string().optional(),
});

/** Build a reading skeleton (4 lines, no geometry) the AI content fills in. */
function baseResult(
  id: string,
  createdAt: string,
  handedness: "Left" | "Right" | "Unknown"
): AnalysisResult {
  return {
    id,
    createdAt,
    handedness,
    unlocked: true,
    lines: LINE_ORDER.map((key) => ({
      key,
      label: LINE_META[key].label,
      color: LINE_META[key].color,
      tier: LINE_META[key].tier,
      path: "",
      points: [],
      pattern: "",
      patternKey: key,
      confidence: 60,
      summary: "",
      interpretation: [],
    })),
  };
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "analyze", 30, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A palm photo is required." }, { status: 400 });
  }
  const { image, handedness, personName, proToken } = parsed.data;

  if (!aiEnabled) {
    return NextResponse.json(
      { error: "Palm reading is temporarily unavailable." },
      { status: 503 }
    );
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const userId = getSessionUserId();
  const ownerKey = getOwnerKey();

  // Free users get FREE_READINGS total; Pro (coupon or subscription) is unlimited.
  if (!verifyProToken(proToken, ownerKey)) {
    const used = await store.countScansByOwner(ownerKey);
    if (used >= FREE_READINGS) {
      return NextResponse.json({
        requiresPro: true,
        message: "You've used your free reading. Go Pro for unlimited readings + astrologer chat.",
      });
    }
  }
  const name = userId ? personName || undefined : undefined;

  // Read the free lines + trace their geometry in parallel.
  const [vision, geo] = await Promise.all([
    analyzePalmImage(image, { tier: "free", lines: ["life", "heart"] }),
    detectLineGeometry(image),
  ]);

  if (!vision) {
    return NextResponse.json(
      { error: "Our palm reader is busy right now. Please try again in a moment." },
      { status: 503 }
    );
  }
  if (!vision.isPalm || vision.lines.length === 0) {
    return NextResponse.json({
      notPalm: true,
      message:
        vision.reason ||
        "We couldn't find a clear palm in that photo. Hold your open hand up, palm facing the camera, in good light, and try again.",
    });
  }

  let full = applyVisionReading(baseResult(id, createdAt, handedness), vision);
  if (geo) full = applyLineGeometry(full, geo);
  await store.saveScan({ id, ownerKey, result: full, paid: false, image, personName: name, createdAt });
  await track("scan_created", { ownerKey, scanId: id });

  return NextResponse.json({ scanId: id, result: gateResult(full, false) });
}
