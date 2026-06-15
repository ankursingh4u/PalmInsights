import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { analyzePalm, gateResult, applyVisionReading, applyLineGeometry } from "@/lib/palmistry";
import { analyzePalmImage, detectLineGeometry } from "@/lib/ai/palmVision";
import { aiEnabled } from "@/lib/config";
import { store } from "@/lib/store";
import { getOwnerKey, getSessionUserId } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { enforceRateLimit } from "@/lib/ratelimit";

// Anonymous (not signed-in) visitors get this many free readings before they
// must sign up to read for more people.
const ANON_FREE_READINGS = 1;

export const runtime = "nodejs";

const LandmarkSchema = z.object({
  x: z.number().min(-0.5).max(1.5),
  y: z.number().min(-0.5).max(1.5),
  z: z.number().optional(),
});

const BodySchema = z.object({
  landmarks: z.array(LandmarkSchema).length(21, "Expected 21 hand landmarks"),
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

  const { landmarks, handedness, image, personName } = parsed.data;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const userId = getSessionUserId();
  const ownerKey = getOwnerKey();

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
    // Read the lines + trace their exact geometry in parallel (faster).
    const [vision, geo] = await Promise.all([
      analyzePalmImage(image, { tier: "free", lines: ["life", "heart"] }),
      detectLineGeometry(image),
    ]);

    // AI unavailable (outage / no credit). Never fabricate a reading.
    if (!vision) {
      return NextResponse.json(
        { error: "Our palm reader is busy right now. Please try again in a moment." },
        { status: 503 }
      );
    }

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
    if (geo) full = applyLineGeometry(full, geo); // exact AI-traced overlay
    await store.saveScan({ id, ownerKey, result: full, paid: false, image, personName: name, createdAt });
    await track("scan_created", { ownerKey, scanId: id });
    return NextResponse.json({ scanId: id, result: gateResult(full, false) });
  }

  // ---- No AI configured (local/dev demo): deterministic engine. ------------
  await store.saveScan({ id, ownerKey, result: geometry, paid: false, image, personName: name, createdAt });
  await track("scan_created", { ownerKey, scanId: id });
  return NextResponse.json({ scanId: id, result: gateResult(geometry, false) });
}
