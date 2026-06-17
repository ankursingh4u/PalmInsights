"use client";

interface Props {
  priceLabel: string;
  busy: boolean;
  error?: string | null;
  onUnlock: () => void;
}

export function Paywall({ priceLabel, busy, error, onUnlock }: Props) {
  return (
    <div className="card premium-surface relative overflow-hidden p-7 text-center">
      <span className="chip mb-3 bg-cosmic-500/20 text-cosmic-200">
        ✦ Deep Report
      </span>
      <h3 className="font-display text-2xl font-semibold">
        Unlock your full reading
      </h3>
      <ul className="mx-auto mt-5 grid max-w-sm gap-2 text-left text-sm text-white/85">
        {[
          "Head & Fate lines — your mind & life direction",
          "💰 Money & Wealth glow-up",
          "🍀 Luck & Fortune — your lucky breaks",
          "💼 Career & Success report",
          "💕 Love & Dating + crush compatibility",
          "✨ Your energy, vibe & destiny",
          "✦ Your palm personality type + lucky number, color & day",
        ].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-cosmic-300">✓</span> {f}
          </li>
        ))}
      </ul>

      <button onClick={onUnlock} disabled={busy} className="btn-primary mt-6 w-full sm:w-auto">
        {busy ? "Processing…" : `Unlock for ${priceLabel}`}
      </button>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <p className="mt-3 text-xs text-white/40">
        One-time payment · Secure checkout
      </p>
    </div>
  );
}
