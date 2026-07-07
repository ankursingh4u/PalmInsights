import { store } from "./store";

// Monthly (rolling 30-day) usage quotas for Pro, counted from the persistent
// event log so they can't be reset by reinstalling or clearing the app.
// Env-tunable so limits can change without a code deploy.
export const QUOTAS = {
  scan_created: Number(process.env.PRO_READINGS_MONTHLY || 20),
  astrologer_question: Number(process.env.PRO_CHAT_MONTHLY || 60),
  premium_unlocked: Number(process.env.PRO_REPORTS_MONTHLY || 10),
};

/** How many of `name` this owner has used in the last 30 days. */
export async function monthlyUsage(ownerKey: string, name: keyof typeof QUOTAS): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return store.countOwnerEventsSince(ownerKey, name, since);
}

/** True when the owner is at/over their monthly quota for `name`. */
export async function overQuota(ownerKey: string, name: keyof typeof QUOTAS): Promise<boolean> {
  return (await monthlyUsage(ownerKey, name)) >= QUOTAS[name];
}
