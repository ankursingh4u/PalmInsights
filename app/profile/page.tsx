"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AuthMenu } from "@/components/AuthMenu";
import { SiteFooter } from "@/components/SiteFooter";
import { me, logout } from "@/lib/api";
import type { UserPublic } from "@/lib/types";

function Row({
  href,
  onClick,
  icon,
  label,
  sub,
  danger,
}: {
  href?: string;
  onClick?: () => void;
  icon: string;
  label: string;
  sub?: string;
  danger?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-lg">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-semibold ${danger ? "text-red-300" : ""}`}>{label}</div>
        {sub && <div className="truncate text-xs text-white/45">{sub}</div>}
      </div>
      {!onClick && <span className="text-white/30" aria-hidden>›</span>}
    </div>
  );
  const cls =
    "block w-full text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]";
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    me()
      .then((r) => {
        setUser(r.user);
        setIsAdmin(Boolean(r.isAdmin));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function handleLogout() {
    await logout().catch(() => {});
    setUser(null);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-10">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <AuthMenu />
      </header>

      {/* Identity */}
      <section className="card premium-surface flex items-center gap-4 p-5">
        <span
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cosmic-400 to-cosmic-700 font-display text-2xl font-bold uppercase shadow-lg shadow-cosmic-900/40"
          aria-hidden
        >
          {user ? user.email[0] : "🔮"}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">
            {user ? "Welcome back" : "Guest reader"}
          </h1>
          <p className="truncate text-sm text-white/60">
            {user ? user.email : "Sign in to save your readings forever"}
          </p>
        </div>
      </section>

      {!user && loaded && (
        <div className="mt-4 flex gap-3">
          <Link href="/login" className="btn-ghost flex-1 justify-center">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary flex-1 justify-center py-3">
            Create account
          </Link>
        </div>
      )}

      {/* Actions */}
      <h2 className="mt-7 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
        Your palm
      </h2>
      <div className="card mt-2 divide-y divide-white/[0.06] overflow-hidden p-0">
        <Row href="/scan" icon="✋" label="New palm scan" sub="Read your lines in seconds" />
        <Row href="/readings" icon="🔮" label="My readings" sub="People you've read" />
        <Row
          href="/scan"
          icon="✦"
          label="Unlock Deep Report"
          sub="Money, luck, love, career + Ask the Astrologer"
        />
      </div>

      {isAdmin && (
        <>
          <h2 className="mt-7 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
            Admin
          </h2>
          <div className="card mt-2 overflow-hidden p-0">
            <Row href="/admin" icon="📊" label="Dashboard" sub="Stats & revenue" />
          </div>
        </>
      )}

      {/* About */}
      <h2 className="mt-7 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
        About
      </h2>
      <div className="card mt-2 divide-y divide-white/[0.06] overflow-hidden p-0">
        <Row href="/privacy" icon="🔒" label="Privacy" sub="How your data is handled" />
        {user && <Row onClick={handleLogout} icon="↩︎" label="Log out" danger />}
      </div>

      <p className="mt-6 text-center text-xs text-white/35">
        PalmInsight · for entertainment &amp; self-reflection
        <br />
        Designed &amp; developed by{" "}
        <a
          href="https://ankursingh.site"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cosmic-300 hover:underline"
        >
          ankursingh.site
        </a>
      </p>

      <SiteFooter />
    </main>
  );
}
