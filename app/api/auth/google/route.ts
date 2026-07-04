import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { store } from "@/lib/store";
import { setSession, issueSessionToken, toPublic, isAdminEmail } from "@/lib/auth";
import type { User } from "@/lib/types";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// The app sends a Google ID token (from native "Sign in with Google"). We verify
// it with Google, then find-or-create the user (auto-verified — Google already
// verified the email) and return our own session token.
const WEB_CLIENT_ID =
  process.env.GOOGLE_WEB_CLIENT_ID ||
  "330242041192-h4ui503vdqdbrls30lqennt2lhceq3vi.apps.googleusercontent.com";

const BodySchema = z.object({ idToken: z.string().min(10) });

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "auth", 20, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing Google token." }, { status: 400 });
  }

  // Verify the token with Google (checks signature + expiry server-side).
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(parsed.data.idToken)}`
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Google sign-in failed." }, { status: 401 });
  }
  const info = (await res.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string | boolean;
  };

  if (info.aud !== WEB_CLIENT_ID) {
    return NextResponse.json({ error: "Invalid Google token." }, { status: 401 });
  }
  const email = info.email?.toLowerCase();
  const verified = info.email_verified === true || info.email_verified === "true";
  if (!email || !verified) {
    return NextResponse.json({ error: "Google account email not verified." }, { status: 401 });
  }

  let user = await store.getUserByEmail(email);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email,
      // Google users have no password; store an unusable placeholder.
      passwordHash: `google:${crypto.randomBytes(16).toString("hex")}`,
      verified: true,
      verifyToken: null,
      createdAt: new Date().toISOString(),
    } as User;
    await store.createUser(user);
  }

  setSession(user.id);
  return NextResponse.json({
    user: toPublic(user),
    isAdmin: isAdminEmail(email),
    token: issueSessionToken(user.id),
  });
}
