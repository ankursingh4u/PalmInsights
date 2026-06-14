import { NextRequest, NextResponse } from "next/server";
import { config, emailEnabled } from "@/lib/config";
import { store } from "@/lib/store";
import { dailyGuidance } from "@/lib/ai/horoscope";
import { sendEmail, renderDailyEmail } from "@/lib/email";
import type { DailyGuidance } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SAMPLE: DailyGuidance = {
  horoscope:
    "Today your resilient energy is on full display — a great day to act on something you've been quietly planning. Trust the instinct your head and heart agree on.",
  wearColor: "Emerald green",
  outfit: "something simple with one bold accent",
  goodFor: ["Starting something new", "An honest conversation", "Creative work"],
  avoid: ["Overthinking small choices"],
  luckyTime: "Afternoon (2–5 PM)",
  mood: "Magnetic",
};

function authorized(req: NextRequest): boolean {
  if (!config.email.cronSecret) return true; // dev convenience when unset
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  return auth === `Bearer ${config.email.cronSecret}` || key === config.email.cronSecret;
}

const today = () => new Date().toISOString().slice(0, 10);
const cta = `${config.baseUrl}/scan`;

/** Daily cron: email today's guidance to every paid member. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!emailEnabled) return NextResponse.json({ error: "email not configured" }, { status: 503 });

  const recipients = await store.listDailyEmailRecipients();
  const date = today();
  let sent = 0;
  const errors: string[] = [];

  for (const r of recipients.slice(0, 500)) {
    const scan = await store.getScan(r.scanId);
    const g = (scan && (await dailyGuidance(scan.result, date))) || SAMPLE;
    const res = await sendEmail({
      to: r.email,
      subject: `🔮 Your palm guidance for today, ${date}`,
      html: renderDailyEmail(g, date, cta),
    });
    if (res.ok) sent++;
    else errors.push(`${r.email}: ${res.error}`);
  }

  return NextResponse.json({ ok: true, recipients: recipients.length, sent, errors: errors.slice(0, 5) });
}

/** Manual test: POST { to, scanId? } → send one sample/real daily email. */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!emailEnabled) return NextResponse.json({ error: "email not configured" }, { status: 503 });

  const body = await req.json().catch(() => null);
  const to = body?.to as string | undefined;
  if (!to) return NextResponse.json({ error: "to required" }, { status: 400 });

  const date = today();
  let g: DailyGuidance = SAMPLE;
  if (body?.scanId) {
    const scan = await store.getScan(body.scanId);
    if (scan) g = (await dailyGuidance(scan.result, date)) || SAMPLE;
  }
  const res = await sendEmail({
    to,
    subject: `🔮 Your palm guidance for today, ${date}`,
    html: renderDailyEmail(g, date, cta),
  });
  return res.ok
    ? NextResponse.json({ ok: true, to })
    : NextResponse.json({ ok: false, error: res.error }, { status: 502 });
}
