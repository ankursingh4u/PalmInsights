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

  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await store.createUser(user);

  // Claim any scans created while anonymous.
  const anonId = getAnonId();
  if (anonId) await store.reassignOwner(anonId, user.id);

  setSession(user.id);
  return NextResponse.json({ user: toPublic(user), isAdmin: isAdminEmail(email) });
}
