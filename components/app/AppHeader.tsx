"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/lib/api";
import type { UserPublic } from "@/lib/types";

// Slim native-style top bar shown only in app mode: brand on the left, a profile
// avatar in the top-right corner. Sits below the OS status bar (safe-area aware).

const TITLES: Record<string, string> = {
  "/": "PalmInsight",
  "/scan": "Scan Palm",
  "/readings": "My Readings",
  "/profile": "Profile",
};

export function AppHeader() {
  const pathname = usePathname() || "/";
  const [user, setUser] = useState<UserPublic | null>(null);

  useEffect(() => {
    me()
      .then((r) => setUser(r.user))
      .catch(() => {});
  }, [pathname]);

  const title =
    TITLES[pathname] ?? (pathname.startsWith("/result") ? "Your Reading" : "PalmInsight");

  return (
    <header className="app-header">
      <div className="flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cosmic-400 to-cosmic-700 text-lg shadow-md shadow-cosmic-900/50"
          aria-hidden
        >
          ✋
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">{title}</span>
      </div>

      <Link
        href="/profile"
        aria-label="Profile"
        className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-sm font-bold uppercase text-cosmic-100 transition active:scale-95"
      >
        {user ? (
          user.email[0]
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
            <circle cx="12" cy="8.5" r="3.3" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M5.5 19.5c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </Link>
    </header>
  );
}
