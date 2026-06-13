import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import {
  verifyPassword,
  setSession,
  getAnonId,
  toPublic,
  isAdminEmail,
} from "@/lib/auth";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "auth", 10, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const user = await store.getUserByEmail(email);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  // Claim any scans created while anonymous on this device.
  const anonId = getAnonId();
  if (anonId) await store.reassignOwner(anonId, user.id);

  setSession(user.id);
  return NextResponse.json({ user: toPublic(user), isAdmin: isAdminEmail(email) });
}
