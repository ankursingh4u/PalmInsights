import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import {
  verifyPassword,
  setSession,
  issueSessionToken,
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

  // Only block on unconfirmed email when verification is explicitly required.
  if (user.verified === false && process.env.REQUIRE_EMAIL_VERIFY === "true") {
    return NextResponse.json(
      { error: "Please confirm your email first — check your inbox for the confirmation link." },
      { status: 403 }
    );
  }

  // Claim any scans created while anonymous on this device.
  const anonId = getAnonId();
  if (anonId) await store.reassignOwner(anonId, user.id);

  setSession(user.id);
  // token: for the native app (bearer auth). The website ignores it and uses
  // the httpOnly cookie set above.
  return NextResponse.json({
    user: toPublic(user),
    isAdmin: isAdminEmail(email),
    token: issueSessionToken(user.id),
  });
}
