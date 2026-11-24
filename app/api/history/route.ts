import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getOwnerKey, getSessionUserId } from "@/lib/auth";

export const runtime = "nodejs";

/** Returns the current identity's saved readings (newest first). */
export async function GET(req: NextRequest) {
  const ownerKey = getOwnerKey(req);
  const scans = await store.listScansByOwner(ownerKey);
  return NextResponse.json({ scans, signedIn: Boolean(getSessionUserId(req)) });
}
