import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
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
 * Run the native Google Play subscription purchase (react-native-iap v15),
 * verify it on the server, store the returned Pro token, and acknowledge it.
 * Resolves with the Pro token on success; throws a friendly error otherwise.
 */
export async function subscribePro(): Promise<string> {
  await initConnection();
  let updSub: any = null;
  let errSub: any = null;
  try {
    const products = (await (fetchProducts as any)({ skus: [SUB_SKU], type: "subs" })) as any[];
    if (!products || products.length === 0) {
      throw new Error("Pro isn't available in the store yet — please try again soon.");
    }
    const product: any = products[0];
    const offerToken =
      product?.subscriptionOfferDetailsAndroid?.[0]?.offerToken ??
      product?.subscriptionOfferDetails?.[0]?.offerToken;

    const purchase = await new Promise<any>((resolve, reject) => {
      updSub = purchaseUpdatedListener((p: any) => {
        const ids: string[] = p?.ids ?? (p?.productId ? [p.productId] : []);
        if (ids.includes(SUB_SKU)) resolve(p);
      });
      errSub = purchaseErrorListener((e: any) =>
        reject(new Error(e?.message || "Purchase was cancelled."))
      );
      (requestPurchase as any)({
        request: {
          google: {
            skus: [SUB_SKU],
            ...(offerToken ? { subscriptionOffers: [{ sku: SUB_SKU, offerToken }] } : {}),
          },
          apple: { sku: SUB_SKU },
        },
        type: "subs",
      }).catch((e: any) => reject(e instanceof Error ? e : new Error(String(e))));
    });

    const purchaseToken: string | undefined =
      purchase?.purchaseToken ?? purchase?.purchaseTokenAndroid;
    if (!purchaseToken) throw new Error("Couldn't read the purchase. Please try again.");

    const { proToken } = await api.subscribe(SUB_SKU, purchaseToken);
    await setProToken(proToken);
    await (finishTransaction as any)({ purchase, isConsumable: false }).catch(() => {});
    return proToken;
  } finally {
    updSub?.remove?.();
    errSub?.remove?.();
    await endConnection().catch(() => {});
  }
}
