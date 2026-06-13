import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUserId, toPublic, isAdminEmail } from "@/lib/auth";

export const runtime = "nodejs";

/** Returns the current signed-in user (or null) + their scan count. */
export async function GET() {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ user: null });

  const user = await store.getUserById(userId);
  if (!user) return NextResponse.json({ user: null });

  const scans = await store.listScansByOwner(userId);
  return NextResponse.json({
    user: toPublic(user),
    isAdmin: isAdminEmail(user.email),
    scanCount: scans.length,
  });
}
