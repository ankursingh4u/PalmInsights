"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { me, logout } from "@/lib/api";
import type { UserPublic } from "@/lib/types";

export function AuthMenu() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    router.refresh();
  }

  if (!loaded) return <div className="h-9 w-20" aria-hidden />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn-ghost py-2 text-sm">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="chip hover:bg-white/20"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-cosmic-500 text-[10px] font-bold uppercase">
          {user.email[0]}
        </span>
        <span className="hidden max-w-[120px] truncate sm:inline">{user.email}</span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-ink/95 shadow-xl backdrop-blur"
          role="menu"
        >
          <Link href="/readings" className="block px-4 py-2.5 text-sm hover:bg-white/10" onClick={() => setOpen(false)}>
            🔮 My Readings
          </Link>
          <Link href="/scan" className="block px-4 py-2.5 text-sm hover:bg-white/10" onClick={() => setOpen(false)}>
            ✋ New scan
          </Link>
          {isAdmin && (
            <Link href="/admin" className="block px-4 py-2.5 text-sm hover:bg-white/10" onClick={() => setOpen(false)}>
              📊 Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2.5 text-left text-sm text-red-300 hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
