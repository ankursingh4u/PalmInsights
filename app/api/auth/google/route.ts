import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import {
  setSession,
  issueSessionToken,
  getAnonId,
  toPublic,
  isAdminEmail,
} from "@/lib/auth";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Must match the Android OAuth client's web client id in lib/google.ts on the
// app side — Google issues ID tokens audienced to the WEB client even for
// native sign-in, so this is the correct value to check here.
const GOOGLE_WEB_CLIENT_ID =
  "330242041192-h4ui503vdqdbrls30lqennt2lhceq3vi.apps.googleusercontent.com";

const BodySchema = z.object({ idToken: z.string().min(10) });

interface TokenInfo {
  email?: string;
  email_verified?: string | boolean;
  aud?: string;
}

/**
 * Sign-in / sign-up via a Google ID token minted on-device (native app only —
 * the website still uses email/password). No password is ever set for these
 * accounts; verifyPassword against an empty hash simply fails harmlessly.
 */
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "auth", 10, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing Google token." }, { status: 400 });
  }

  const info: TokenInfo | null = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(parsed.data.idToken)}`
  )
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  if (!info?.email || info.aud !== GOOGLE_WEB_CLIENT_ID) {
    return NextResponse.json({ error: "Invalid Google sign-in." }, { status: 401 });
  }
  if (info.email_verified === false || info.email_verified === "false") {
    return NextResponse.json({ error: "That Google account's email isn't verified." }, { status: 403 });
  }

  const email = info.email.trim().toLowerCase();
  let user = await store.getUserByEmail(email);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email,
      passwordHash: "",
      verified: true,
      createdAt: new Date().toISOString(),
    };
    await store.createUser(user);
  }

  // Claim any scans created while anonymous on this device (website parity).
  const anonId = getAnonId();
  if (anonId) await store.reassignOwner(anonId, user.id);

  setSession(user.id);
  const token = issueSessionToken(user.id);
  return NextResponse.json({ user: toPublic(user), isAdmin: isAdminEmail(email), token });
}
