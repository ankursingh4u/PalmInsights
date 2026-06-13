"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthMenu } from "@/components/AuthMenu";
import { SiteFooter } from "@/components/SiteFooter";
import type { AnalyticsSummary } from "@/lib/types";

function formatMoney(cents: number, currency: string) {
  const amount = (cents / 100).toFixed(2);
  return currency === "usd" ? `$${amount}` : `${amount} ${currency.toUpperCase()}`;
}

const EVENT_LABELS: Record<string, string> = {
  scan_created: "Scans created",
  paywall_viewed: "Paywall views",
  checkout_started: "Checkouts started",
  premium_unlocked: "Premium unlocks",
  compatibility_run: "Compatibility checks",
  share_created: "Share cards made",
};

export default function AdminPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Access denied");
        setSummary(data.summary);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-5 pb-10">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <AuthMenu />
      </header>

      <h1 className="font-display text-3xl font-semibold">📊 Dashboard</h1>
      <p className="mt-1 text-sm text-white/60">
        Conversion target: 3–5% of users upgrade to the Deep Report.
      </p>

      {error && (
        <div className="card mt-6 border-red-400/30 bg-red-500/10 text-sm text-red-200">
          {error}{" "}
          <Link href="/login?next=/admin" className="underline">
            Log in as an admin
          </Link>{" "}
          (set <code className="text-white/80">ADMIN_EMAILS</code> in your env).
        </div>
      )}

      {summary && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Users" value={summary.users} />
            <Stat label="Palm scans" value={summary.scans} />
            <Stat
              label="Conversion"
              value={`${summary.conversionRate}%`}
              accent={
                summary.conversionRate >= 3 ? "text-green-300" : "text-amber-300"
              }
            />
            <Stat
              label="Revenue"
              value={formatMoney(summary.revenueCents, summary.currency)}
              accent="text-cosmic-200"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="font-semibold">Funnel</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {Object.keys(EVENT_LABELS).map((k) => (
                  <li key={k} className="flex items-center justify-between">
                    <span className="text-white/70">{EVENT_LABELS[k]}</span>
                    <span className="font-semibold">{summary.events[k] || 0}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2 className="font-semibold">Recent scans</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {summary.recentScans.length === 0 && (
                  <li className="text-white/50">No scans yet.</li>
                )}
                {summary.recentScans.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-white/70">
                      {s.topLine ? `${s.topLine.label}: ${s.topLine.pattern}` : s.id.slice(0, 8)}
                    </span>
                    <span className={`chip ${s.paid ? "bg-cosmic-500/20 text-cosmic-200" : ""}`}>
                      {s.paid ? "Premium" : "Free"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {!summary && !error && loaded && (
        <p className="mt-6 text-white/50">Loading…</p>
      )}

      <SiteFooter />
    </main>
  );
}

function Stat({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}
