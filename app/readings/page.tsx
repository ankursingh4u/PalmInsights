"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthMenu } from "@/components/AuthMenu";
import { SiteFooter } from "@/components/SiteFooter";
import { history } from "@/lib/api";
import type { ScanSummary } from "@/lib/types";

export default function ReadingsPage() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    history()
      .then((r) => {
        setScans(r.scans);
        setSignedIn(r.signedIn);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-10">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <AuthMenu />
      </header>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">
          {signedIn ? "My People" : "My Readings"}
        </h1>
        <Link href="/scan" className="btn-primary py-2 text-sm">
          ＋ Read a person
        </Link>
      </div>

      {!signedIn && loaded && (
        <div className="card mt-4 border-cosmic-400/30 bg-cosmic-500/10 text-sm">
          You&apos;re viewing readings saved on this device.{" "}
          <Link href="/signup" className="text-cosmic-300 underline">
            Create an account
          </Link>{" "}
          to keep them forever and access them anywhere.
        </div>
      )}

      {loaded && scans.length === 0 && (
        <div className="card mt-6 py-12 text-center">
          <div className="text-4xl">🔮</div>
          <p className="mt-4 text-white/70">No readings yet.</p>
          <Link href="/scan" className="btn-primary mt-6">
            Scan your palm
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {scans.map((s) => (
          <Link
            key={s.id}
            href={`/result/${s.id}`}
            className="card flex items-center justify-between gap-4 transition hover:bg-white/[0.07]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cosmic-500/20 font-display text-lg font-semibold text-cosmic-100"
                aria-hidden
              >
                {(s.personName || "🔮").trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <span className="truncate font-semibold">
                  {s.personName || "My reading"}
                </span>
                <div className="mt-0.5 truncate text-xs text-white/50">
                  {s.topLine ? `${s.topLine.label}: ${s.topLine.pattern} · ` : ""}
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <span className={`chip shrink-0 ${s.paid ? "bg-cosmic-500/20 text-cosmic-200" : ""}`}>
              {s.paid ? "✦ Premium" : "Free"}
            </span>
          </Link>
        ))}
      </div>

      <SiteFooter />
    </main>
  );
}
