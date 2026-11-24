import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { config, emailEnabled } from "@/lib/config";
import { store } from "@/lib/store";
import { dailyGuidance } from "@/lib/ai/horoscope";
import { sendEmail, renderDailyEmail } from "@/lib/email";
import type { DailyGuidance } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Used only when AI generation fails for a given recipient (e.g. a transient
// provider outage or rate limit). A POOL, not one fixed object — a single
// static fallback meant every recipient who hit it, on every day it was hit,
// saw the exact same canned message. Picking by a hash of (email, date) keeps
// it varied across people and across days for the same person.
const FALLBACK_POOL: DailyGuidance[] = [
  {
    horoscope:
      "Today your resilient energy is on full display — a great day to act on something you've been quietly planning. Trust the instinct your head and heart agree on.",
    wearColor: "Emerald green",
    outfit: "something simple with one bold accent",
    goodFor: ["Starting something new", "An honest conversation", "Creative work"],
    avoid: ["Overthinking small choices"],
    luckyTime: "Afternoon (2–5 PM)",
    mood: "Magnetic",
  },
  {
    horoscope:
      "A quieter, steadier energy today — the kind that gets real things finished instead of chased. Let one small win build momentum for the rest of the week.",
    wearColor: "Deep navy",
    outfit: "clean lines, one comfortable layer",
    goodFor: ["Finishing an old task", "Budgeting or planning", "A walk outdoors"],
    avoid: ["Taking on new commitments"],
    luckyTime: "Morning (8–11 AM)",
    mood: "Grounded",
  },
  {
    horoscope:
      "Your curiosity is wide open today — conversations and small discoveries land differently. Follow the thread that actually interests you, not the one you think you should.",
    wearColor: "Warm amber",
    outfit: "something a little bolder than usual",
    goodFor: ["Meeting someone new", "Learning something", "Spontaneous plans"],
    avoid: ["Rigid schedules"],
    luckyTime: "Evening (6–9 PM)",
    mood: "Curious",
  },
  {
    horoscope:
      "A good day to protect your energy — say no to what drains you so there's more left for what matters. Rest is productive too.",
    wearColor: "Soft lavender",
    outfit: "whatever feels the most comfortable",
    goodFor: ["Rest", "Reconnecting with a close friend", "Journaling"],
    avoid: ["Overcommitting your time"],
    luckyTime: "Late morning (10 AM–12 PM)",
    mood: "Calm",
  },
];

function fallbackFor(email: string, dateStr: string): DailyGuidance {
  const h = crypto.createHash("sha256").update(`${email}:${dateStr}`).digest();
  return FALLBACK_POOL[h[0] % FALLBACK_POOL.length];
}

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
    const g = (scan && (await dailyGuidance(scan.result, date))) || fallbackFor(r.email, date);
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
  let g: DailyGuidance = fallbackFor(to, date);
  if (body?.scanId) {
    const scan = await store.getScan(body.scanId);
    if (scan) g = (await dailyGuidance(scan.result, date)) || fallbackFor(to, date);
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
