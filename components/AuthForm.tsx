"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, signup } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/scan";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const res = await signup(email, password);
        if (res.needsVerify) {
          setSentTo(res.email || email); // show "check your email"
          setBusy(false);
          return;
        }
      } else {
        await login(email, password);
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";

  // After signup with email verification — confirmation screen.
  if (sentTo) {
    return (
      <div className="card mx-auto mt-8 max-w-md space-y-3 text-center">
        <div className="text-4xl">📩</div>
        <h1 className="font-display text-2xl font-semibold">Confirm your email</h1>
        <p className="text-sm text-white/70">
          We sent a confirmation link to <strong className="text-white">{sentTo}</strong>.
          Tap it to activate your account and start reading palms for everyone.
        </p>
        <p className="text-xs text-white/40">
          Don&apos;t see it? Check spam, or wait a minute and refresh your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-8 max-w-md space-y-4">
      <h1 className="font-display text-2xl font-semibold">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="text-sm text-white/60">
        {isSignup
          ? "Save your readings and revisit them anytime."
          : "Log in to access your saved readings."}
      </p>

      <div>
        <label className="text-xs text-white/60">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cosmic-400"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="text-xs text-white/60">Password</label>
        <input
          type="password"
          required
          minLength={isSignup ? 8 : undefined}
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cosmic-400"
          placeholder={isSignup ? "At least 8 characters" : "Your password"}
        />
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "…" : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-white/60">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-cosmic-300 hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-cosmic-300 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
