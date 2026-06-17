import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { setSession, getAnonId } from "@/lib/auth";
import { config } from "@/lib/config";

export const runtime = "nodejs";

/**
 * Email-confirmation link target. Verifies the token, signs the user in, and
 * redirects into the app. Invalid/expired tokens go to login with a notice.
 */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const user = token ? await store.getUserByVerifyToken(token) : null;

  if (!user) {
    return NextResponse.redirect(`${config.baseUrl}/login?verify=invalid`);
  }

  await store.setVerified(user.id);

  // Claim scans created while anonymous on this device, then sign in.
  const anonId = getAnonId();
  if (anonId) await store.reassignOwner(anonId, user.id);
  setSession(user.id);

  return NextResponse.redirect(`${config.baseUrl}/scan?welcome=1`);
}
