import { useEffect, useState } from "react";
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from "react-native-iap";
import type { ProductSubscription, ProductSubscriptionAndroid, Purchase } from "react-native-iap";
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

// ProductSubscription is a platform union; this app only sells on Google Play,
// so narrow to the Android variant to reach the offer/pricing-phase fields.
async function fetchSub(): Promise<ProductSubscriptionAndroid | null> {
  const subs = (await fetchProducts({ skus: [SUB_SKU], type: "subs" })) as ProductSubscription[];
  const sub = (subs ?? []).find((s) => s.platform === "android");
  return (sub as ProductSubscriptionAndroid) ?? null;
}

// Resolved once per app launch and shared by every screen that shows a price.
let cachedPrice: ProPrice | null = null;
let inflightPrice: Promise<ProPrice | null> | null = null;

async function fetchProPrice(): Promise<ProPrice | null> {
  try {
    await initConnection();
    const sub = await fetchSub();
    // Last pricing phase is the recurring one — earlier phases are free trials
    // or intro offers, which aren't what we want on the upgrade card.
    const phases =
      sub?.subscriptionOffers?.[0]?.pricingPhasesAndroid?.pricingPhaseList ?? [];
    const phase = phases[phases.length - 1];
    const price = phase?.formattedPrice || sub?.displayPrice;
    if (!price) return null;
    return { price, period: PERIODS[phase?.billingPeriod ?? ""] ?? FALLBACK_PERIOD };
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
    const sub = await fetchSub();
    if (!sub) {
      throw new Error("Pro isn't available in the store yet — please try again soon.");
    }
    const offerToken = sub.subscriptionOffers?.[0]?.offerTokenAndroid;

    const purchase = await new Promise<Purchase>((resolve, reject) => {
      updSub = purchaseUpdatedListener((p: Purchase) => {
        if (p?.id === SUB_SKU) resolve(p);
      });
      errSub = purchaseErrorListener((e: any) =>
        reject(new Error(e?.message || "Purchase was cancelled."))
      );
      requestPurchase({
        type: "subs",
        request: {
          google: {
            skus: [SUB_SKU],
            ...(offerToken ? { subscriptionOffers: [{ sku: SUB_SKU, offerToken }] } : {}),
          },
        },
      }).catch((e: any) => reject(e instanceof Error ? e : new Error(String(e))));
    });

    const purchaseToken = purchase?.purchaseToken;
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
