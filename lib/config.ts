// Centralized runtime configuration + capability flags.

export const config = {
  baseUrl:
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",

  premiumPriceCents: Number(process.env.PREMIUM_PRICE_CENTS || 500),
  premiumCurrency: (process.env.PREMIUM_CURRENCY || "usd").toLowerCase(),

  // ONE switch controls everything:
  //   POLAR_LIVE=false (or unset) → TEST mode  (sandbox, fake cards, no real charges)
  //   POLAR_LIVE=true            → REAL mode   (production, real money)
  // The matching token/product/webhook are picked automatically per mode, so
  // you never have to swap individual values — just flip POLAR_LIVE.
  polar: (() => {
    const live = process.env.POLAR_LIVE === "true";
    const pick = (liveVal?: string, testVal?: string, legacy?: string) =>
      (live ? liveVal : testVal) || legacy || "";
    return {
      live,
      server: (live ? "production" : "sandbox") as "production" | "sandbox",
      accessToken: pick(
        process.env.POLAR_LIVE_ACCESS_TOKEN,
        process.env.POLAR_SANDBOX_ACCESS_TOKEN,
        process.env.POLAR_ACCESS_TOKEN
      ),
      productId: pick(
        process.env.POLAR_LIVE_PRODUCT_ID,
        process.env.POLAR_SANDBOX_PRODUCT_ID,
        process.env.POLAR_PRODUCT_ID
      ),
      webhookSecret: pick(
        process.env.POLAR_LIVE_WEBHOOK_SECRET,
        process.env.POLAR_SANDBOX_WEBHOOK_SECRET,
        process.env.POLAR_WEBHOOK_SECRET
      ),
    };
  })(),

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  unlockSecret: process.env.UNLOCK_TOKEN_SECRET || "dev-only-change-me",
};

/**
 * True when real Polar billing is configured (otherwise mock checkout).
 * Requires both an organization access token and the Deep Report product id.
 */
export const polarEnabled = Boolean(
  config.polar.accessToken && config.polar.productId
);

/** True when Supabase is configured (otherwise in-memory store). */
export const supabaseEnabled = Boolean(
  config.supabase.url && config.supabase.serviceRoleKey
);

export function priceLabel(): string {
  const amount = (config.premiumPriceCents / 100).toFixed(
    config.premiumPriceCents % 100 === 0 ? 0 : 2
  );
  const symbol = config.premiumCurrency === "usd" ? "$" : "";
  return `${symbol}${amount}`;
}
