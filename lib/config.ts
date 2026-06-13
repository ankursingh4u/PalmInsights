// Centralized runtime configuration + capability flags.

export const config = {
  baseUrl:
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",

  premiumPriceCents: Number(process.env.PREMIUM_PRICE_CENTS || 500),
  premiumCurrency: (process.env.PREMIUM_CURRENCY || "usd").toLowerCase(),

  polar: {
    accessToken: process.env.POLAR_ACCESS_TOKEN || "",
    productId: process.env.POLAR_PRODUCT_ID || "",
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET || "",
    // "sandbox" for test mode, "production" for live charges.
    server: (process.env.POLAR_SERVER || "sandbox") === "production"
      ? ("production" as const)
      : ("sandbox" as const),
  },

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
