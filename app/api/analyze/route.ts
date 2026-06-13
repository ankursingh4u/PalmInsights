import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { analyzePalm, gateResult } from "@/lib/palmistry";
import { store } from "@/lib/store";
import { getOwnerKey } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { enforceRateLimit } from "@/lib/ratelimit";

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

  const { landmarks, handedness, image, saveImage } = parsed.data;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const ownerKey = getOwnerKey();

  const { full } = analyzePalm(landmarks, handedness, id, createdAt);

  await store.saveScan({
    id,
    ownerKey,
    result: full,
    paid: false,
    image: saveImage ? image : undefined,
    createdAt,
  });

  await track("scan_created", { ownerKey, scanId: id });

  const gated = gateResult(full, false);
  return NextResponse.json({ scanId: id, result: gated });
}
