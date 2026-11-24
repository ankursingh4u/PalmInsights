import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export const runtime = "nodejs";

// Temporary diagnostic route — never returns the key itself, only model ids.
// DELETE after use.
const DEBUG_TOKEN = "palm-diag-9f3a7c21-temp";

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (key !== DEBUG_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${config.ai.geminiKey}`
  );
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return NextResponse.json({ status: r.status, data }, { status: 502 });
  const models = (data.models || []).map((m: { name: string; supportedGenerationMethods?: string[] }) => ({
    name: m.name,
    methods: m.supportedGenerationMethods,
  }));
  return NextResponse.json({ models });
}
