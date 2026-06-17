import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { store } from "@/lib/store";
import {
  hashPassword,
  setSession,
  validateEmail,
  validatePassword,
  getAnonId,
  toPublic,
  isAdminEmail,
} from "@/lib/auth";
import { enforceRateLimit } from "@/lib/ratelimit";
import { config, emailEnabled } from "@/lib/config";
import { sendEmail, renderVerifyEmail } from "@/lib/email";
import type { User } from "@/lib/types";

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
  const password = parsed.data.password;

  if (!validateEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const pwErr = validatePassword(password);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

  const existing = await store.getUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try logging in." },
      { status: 409 }
    );
  }

  // When email delivery is configured, require email confirmation before the
  // account is active. Otherwise (dev/no email), sign in immediately.
  const requireVerify = emailEnabled;
  const verifyToken = requireVerify ? crypto.randomUUID().replace(/-/g, "") : null;

  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(password),
    verified: !requireVerify,
    verifyToken,
    createdAt: new Date().toISOString(),
  };
  await store.createUser(user);

  if (requireVerify && verifyToken) {
    const verifyUrl = `${config.baseUrl}/api/auth/verify?token=${verifyToken}`;
    const res = await sendEmail({
      to: email,
      subject: "Confirm your email — PalmInsight 🔮",
      html: renderVerifyEmail(verifyUrl),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Couldn't send the confirmation email. Please try again." },
        { status: 502 }
      );
    }
    // No session yet — they must confirm via the email link.
    return NextResponse.json({ needsVerify: true, email });
  }

  // No-email mode: claim anonymous scans and sign in right away.
  const anonId = getAnonId();
  if (anonId) await store.reassignOwner(anonId, user.id);
  setSession(user.id);
  return NextResponse.json({ user: toPublic(user), isAdmin: isAdminEmail(email) });
}
