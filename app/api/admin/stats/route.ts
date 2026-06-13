import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUserId, isAdminEmail } from "@/lib/auth";
import { buildSummary } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET() {
  const userId = getSessionUserId();
  const user = userId ? await store.getUserById(userId) : null;
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const summary = await buildSummary();
  return NextResponse.json({ summary });
}
