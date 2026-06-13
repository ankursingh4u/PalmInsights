import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { gateResult } from "@/lib/palmistry";

export const runtime = "nodejs";

/** Public read-only fetch of the free portion of a scan (for share links). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const record = await store.getScan(params.id);
  if (!record) {
    return NextResponse.json({ error: "Reading not found or expired" }, { status: 404 });
  }
  return NextResponse.json({ result: gateResult(record.result, false) });
}
