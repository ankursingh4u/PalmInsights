import { useEffect, useState } from "react";
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from "react-native-iap";
import { api, setProToken } from "./api";

// The Google Play subscription product id (create it in Play Console → Monetize
// → Subscriptions). Once it's Active + KYC clears + the GOOGLE_PLAY_SA env is
// set on the server, this flow works with no app change.
export const SUB_SKU = "pro_monthly";

/**
 * What we render until Play answers (and if it never does — Expo Go, no Play
 * Services, offline). Keep this in sync with the base plan price in Play
 * Console; everywhere else the real, region-correct price wins.
 */
export const FALLBACK_PRICE = "$99";
export const FALLBACK_PERIOD = "month";

export type ProPrice = { price: string; period: string };

const PERIODS: Record<string, string> = {
  P1W: "week",
  P1M: "month",
  P3M: "3 months",
  P6M: "6 months",
  P1Y: "year",
};

// Resolved once per app launch and shared by every screen that shows a price.
let cachedPrice: ProPrice | null = null;
let inflightPrice: Promise<ProPrice | null> | null = null;

async function fetchProPrice(): Promise<ProPrice | null> {
  try {
    await initConnection();
    const subs = (await getSubscriptions({ skus: [SUB_SKU] })) as any[];
    const sub: any = subs?.[0];
    // Last pricing phase is the recurring one — earlier phases are free trials
    // or intro offers, which aren't what we want on the upgrade card.
    const phases: any[] = sub?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList ?? [];
    const phase = phases[phases.length - 1];
    const price: string | undefined = phase?.formattedPrice || sub?.localizedPrice;
    if (!price) return null;
    return { price, period: PERIODS[phase?.billingPeriod] ?? FALLBACK_PERIOD };
  } catch {
    return null;
  }
  // Deliberately no endConnection() — subscribePro() owns the connection
  // lifecycle, and tearing it down here could kill a purchase mid-flight.
}

/**
 * The live Play Store price for Pro, localized to the user's region. Falls back
 * to FALLBACK_PRICE while loading or if the store can't be reached, so a price
 * change in Play Console needs no app update.
 */
export function useProPrice(): ProPrice {
  const [resolved, setResolved] = useState<ProPrice | null>(cachedPrice);

  useEffect(() => {
    if (cachedPrice) return;
    let alive = true;
    const p = (inflightPrice ??= fetchProPrice());
    p.then((r) => {
      inflightPrice = null;
      if (!r) return;
      cachedPrice = r;
      if (alive) setResolved(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  return resolved ?? { price: FALLBACK_PRICE, period: FALLBACK_PERIOD };
}

/**
 * Run the native Google Play subscription purchase, verify it on the server,
 * store the returned Pro token, and acknowledge the purchase.
 * Resolves with the Pro token on success; throws a friendly error otherwise.
 */
export async function subscribePro(): Promise<string> {
  await initConnection();
  let updSub: any = null;
  let errSub: any = null;
  try {
    const subs = (await getSubscriptions({ skus: [SUB_SKU] })) as any[];
    if (!subs || subs.length === 0) {
      throw new Error("Pro isn't available in the store yet — please try again soon.");
    }
    const sub: any = subs[0];
    const offerToken = sub?.subscriptionOfferDetails?.[0]?.offerToken;

    const purchase = await new Promise<any>((resolve, reject) => {
      updSub = purchaseUpdatedListener((p: any) => {
        if (p?.productId === SUB_SKU) resolve(p);
      });
      errSub = purchaseErrorListener((e: any) =>
        reject(new Error(e?.message || "Purchase was cancelled."))
      );
      requestSubscription({
        sku: SUB_SKU,
        ...(offerToken ? { subscriptionOffers: [{ sku: SUB_SKU, offerToken }] } : {}),
      } as any).catch((e: any) => reject(e instanceof Error ? e : new Error(String(e))));
    });

    const purchaseToken: string | undefined = purchase?.purchaseToken;
    if (!purchaseToken) throw new Error("Couldn't read the purchase. Please try again.");

    const { proToken } = await api.subscribe(SUB_SKU, purchaseToken);
    await setProToken(proToken);
    await finishTransaction({ purchase, isConsumable: false }).catch(() => {});
    return proToken;
  } finally {
    updSub?.remove?.();
    errSub?.remove?.();
    await endConnection().catch(() => {});
  }
}
