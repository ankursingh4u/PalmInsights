import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { analyzePalm, gateResult, applyVisionReading, applyLineGeometry, deriveLuckyHighlights } from "@/lib/palmistry";
import { analyzePalmImage, detectLineGeometry } from "@/lib/ai/palmVision";
import { detectLinesCV, cvFactsPrompt, cvToGeometry } from "@/lib/ai/lineDetector";
import { aiEnabled } from "@/lib/config";
import { store } from "@/lib/store";
import { getOwnerKey, getSessionUserId } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { enforceRateLimit, clientIp } from "@/lib/ratelimit";
import { issueUnlockToken } from "@/lib/token";

// Anonymous (not signed-in) visitors get this many free readings before they
// must sign up to read for more people.
const ANON_FREE_READINGS = 1;

// Paid-tier (best accuracy) palm reads per owner per day; beyond this, scans
// fall back to the free Gemini tier instead of being blocked or charged more.
// Temporarily raised for testing — revisit before real launch.
const PAID_SCANS_PER_DAY = 20;

export const runtime = "nodejs";

const LandmarkSchema = z.object({
  x: z.number().min(-0.5).max(1.5),
  y: z.number().min(-0.5).max(1.5),
  z: z.number().optional(),
});

// The native app has no on-device hand-landmark detector (that's a browser-side
// MediaPipe step on the website) — it sends only the image. These placeholder
// points just keep the landmark-geometry math from crashing on empty input;
// the AI vision trace (detectLineGeometry) overwrites them with real traced
// points whenever it succeeds, so they're a silent fallback, never the norm.
const MOBILE_FALLBACK_LANDMARKS = [
  { x: 0.5, y: 0.9 }, { x: 0.42, y: 0.82 }, { x: 0.35, y: 0.72 }, { x: 0.3, y: 0.62 }, { x: 0.27, y: 0.52 },
  { x: 0.42, y: 0.55 }, { x: 0.42, y: 0.4 }, { x: 0.42, y: 0.28 }, { x: 0.42, y: 0.18 },
  { x: 0.5, y: 0.52 }, { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.22 }, { x: 0.5, y: 0.1 },
  { x: 0.58, y: 0.54 }, { x: 0.58, y: 0.38 }, { x: 0.58, y: 0.25 }, { x: 0.58, y: 0.14 },
  { x: 0.66, y: 0.58 }, { x: 0.66, y: 0.46 }, { x: 0.66, y: 0.36 }, { x: 0.66, y: 0.28 },
];

const BodySchema = z.object({
  landmarks: z.array(LandmarkSchema).length(21, "Expected 21 hand landmarks").optional(),
  handedness: z.enum(["Left", "Right", "Unknown"]).default("Unknown"),
  // Optional: store the palm image with the reading (opt-in consent).
  image: z.string().startsWith("data:image/").max(8_000_000).optional(),
  saveImage: z.boolean().optional(),
  // Whose palm this is (only used by signed-in users adding people).
  personName: z.string().trim().max(40).optional(),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "analyze", 30, 60_000);
  if (limited) return limited;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "No clear hand detected. Please retake with an open palm.",
        details: parsed.error.flatten(),
      },
      { status: 422 }
    );
  }

  const { handedness, image, personName } = parsed.data;
  let landmarks = parsed.data.landmarks;
  if (!landmarks) {
    if (!image) {
      return NextResponse.json({ error: "landmarks or image required" }, { status: 400 });
    }
    if (!aiEnabled) {
      return NextResponse.json({ error: "Landmarks required (no AI vision configured)." }, { status: 400 });
    }
    landmarks = MOBILE_FALLBACK_LANDMARKS;
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const userId = getSessionUserId(req);
  const ownerKey = getOwnerKey(req);

  // Anonymous visitors get one free reading. To read for another person they
  // must sign up — which is also how we keep each person's reading consistent.
  if (!userId) {
    const used = await store.countScansByOwner(ownerKey);
    if (used >= ANON_FREE_READINGS) {
      return NextResponse.json({
        requiresLogin: true,
        message: "You've used your free reading. Sign up free to read palms for more people and save them by name.",
      });
    }
  }
  // Only signed-in users name people; anonymous reading is just "You".
  const name = userId ? personName || undefined : undefined;

  // Landmark engine builds only the line GEOMETRY used to draw the overlay.
  const { full: geometry } = analyzePalm(landmarks, handedness, id, createdAt);

  // ---- AI-first path: the model decides if it's a real palm AND reads it. ---
  if (aiEnabled) {
    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }
    // Image scans always use the paid (best-accuracy) tier — capped at
    // PAID_SCANS_PER_DAY, no free-tier fallback. Once the cap is hit, scanning
    // is blocked for the rest of the day rather than silently degraded to a
    // cheaper model.
    const ip = clientIp(req);
    const [paidScansToday, paidScansTodayByIp] = await Promise.all([
      store.countPaidScansToday(ownerKey),
      store.countPaidScansTodayByIp(ip),
    ]);
    // Both the owner (account/anon-cookie) AND the client IP must be under
    // cap — the IP check is a backstop against bypassing the cookie cap by
    // clearing cookies / using incognito from the same network.
    const allowPaid = paidScansToday < PAID_SCANS_PER_DAY && paidScansTodayByIp < PAID_SCANS_PER_DAY;

    if (!allowPaid) {
      return NextResponse.json({
        limitReached: true,
        message: `You've used today's ${PAID_SCANS_PER_DAY} palm scans. Come back tomorrow for more.`,
      });
    }

    // Deterministic CV pass first (Heart/Head/Life trace + long/short fact) so
    // the LLM's narrative is grounded in the actual photo, not free-styled.
    const [cv, geo] = await Promise.all([detectLinesCV(image), detectLineGeometry(image)]);

    const analysis = await analyzePalmImage(image, {
      tier: "paid",
      lines: ["life", "heart", "head", "fate"],
      report: true,
      allowPaid,
      cvFacts: cvFactsPrompt(cv),
    });

    // AI unavailable (outage / no credit). Never fabricate a reading.
    if (!analysis) {
      return NextResponse.json(
        { error: "Our palm reader is busy right now. Please try again in a moment." },
        { status: 503 }
      );
    }
    const { vision, usedPaid } = analysis;

    // The AI judged this is not a readable palm — return its reason, no reading.
    if (!vision.isPalm || vision.lines.length === 0) {
      return NextResponse.json({
        notPalm: true,
        message:
          vision.reason ||
          "We couldn't find a clear palm in that photo. Hold your open hand up with your palm facing the camera, in good light, and try again.",
      });
    }

    let full = applyVisionReading(geometry, vision);
    if (geo) full = applyLineGeometry(full, geo); // exact AI-traced overlay (fate line)
    if (cv) full = applyLineGeometry(full, cvToGeometry(cv)); // deterministic CV overlay wins for heart/head/life
    full.aiTier = usedPaid ? "paid" : "free";
    // "Lucky" fields have no real signal to ground an LLM guess in, so at
    // temperature:0 the model just returns the same default for every photo
    // (observed: always "Thursday"/"7"). Derive them from who this reading
    // is for instead — stable per person, varies across different people.
    if (full.report) Object.assign(full.report.highlights, deriveLuckyHighlights(ownerKey, name));
    await store.saveScan({ id, ownerKey, result: full, paid: true, image, personName: name, createdAt });
    await track("scan_created", { ownerKey, scanId: id });
    if (usedPaid) await track("paid_scan_ip", { ownerKey: ip, scanId: id });
    return NextResponse.json({ scanId: id, result: gateResult(full, true), token: issueUnlockToken(id) });
  }

  // ---- No AI configured (local/dev demo): deterministic engine. ------------
  await store.saveScan({ id, ownerKey, result: geometry, paid: true, image, personName: name, createdAt });
  await track("scan_created", { ownerKey, scanId: id });
  return NextResponse.json({ scanId: id, result: gateResult(geometry, true), token: issueUnlockToken(id) });
}
