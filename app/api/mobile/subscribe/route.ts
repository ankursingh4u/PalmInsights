import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { JWT } from "google-auth-library";
import { getOwnerKey } from "@/lib/auth";
import { issueProToken } from "@/lib/token";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Verify a Google Play subscription purchase server-side, then issue a Pro token
// that expires when the subscription does. Configure once (no code change):
//   GOOGLE_PLAY_SA       = the service-account JSON (as a string) in Vercel env
//   GOOGLE_PLAY_PACKAGE  = live.bolddev.palminsight (default)
// Until GOOGLE_PLAY_SA is set this returns a friendly "not live yet" 503, so the
// app ships now and real billing switches on the moment you add the env var.
const PACKAGE = process.env.GOOGLE_PLAY_PACKAGE || "live.bolddev.palminsight";

const BodySchema = z.object({
  productId: z.string().min(1),
  purchaseToken: z.string().min(1),
});

const ACTIVE = new Set(["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"]);

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "subscribe", 20, 60_000);
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const saRaw = process.env.GOOGLE_PLAY_SA;
  if (!saRaw) {
    return NextResponse.json(
      { error: "Subscriptions aren't live yet. Please try again soon." },
      { status: 503 }
    );
  }

  let sa: { client_email: string; private_key: string };
  try {
    sa = JSON.parse(saRaw);
  } catch {
    return NextResponse.json({ error: "Billing misconfigured." }, { status: 500 });
  }

  try {
    const client = new JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    const { token: accessToken } = await client.getAccessToken();

    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE}/purchases/subscriptionsv2/tokens/${encodeURIComponent(parsed.data.purchaseToken)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      return NextResponse.json({ error: "Couldn't verify the purchase." }, { status: 400 });
    }
    const data = (await res.json()) as {
      subscriptionState?: string;
      lineItems?: { expiryTime?: string; productId?: string }[];
    };

    if (!data.subscriptionState || !ACTIVE.has(data.subscriptionState)) {
      return NextResponse.json({ active: false, error: "Subscription not active." }, { status: 402 });
    }

    const expiryIso = data.lineItems?.[0]?.expiryTime;
    const expiresAt = expiryIso ? Date.parse(expiryIso) : Date.now() + 30 * 24 * 60 * 60 * 1000;

    const ownerKey = getOwnerKey();
    return NextResponse.json({
      active: true,
      proToken: issueProToken(ownerKey, expiresAt),
      expiresAt,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
