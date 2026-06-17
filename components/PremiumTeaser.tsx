"use client";

// Blurred preview of the premium topics — shows users exactly what they're
// missing (Money / Luck / Love / Career …) to drive the $5 unlock.

const TOPICS = [
  {
    icon: "💰",
    title: "Money & Wealth",
    teaser:
      "Your hand points to a real financial glow-up — wealth you build by backing your own judgment, with gains that compound fast once you find your lane and your money era switches on.",
  },
  {
    icon: "🍀",
    title: "Luck & Fortune",
    teaser:
      "There's a genuine streak of luck written into your palm — the right opportunity tends to find you at the right moment. Your luckiest windows cluster around the seasons you take a small, bold bet.",
  },
  {
    icon: "💕",
    title: "Love & Dating",
    teaser:
      "Your magnetic season is near. You pull people in with genuine energy, and the strongest connection comes with someone who matches your honesty — less chasing, more clicking.",
  },
  {
    icon: "🌌",
    title: "Career, Destiny + Lucky Highlights",
    teaser:
      "Discover your palm personality type and your lucky number, color and day — plus the career glow-up and main-character era the threads of your fate line are quietly weaving toward.",
  },
];

export function PremiumTeaser({ onUnlock, busy }: { onUnlock: () => void; busy?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TOPICS.map((t) => (
        <button
          key={t.title}
          onClick={onUnlock}
          disabled={busy}
          className="card group relative cursor-pointer overflow-hidden text-left transition hover:border-cosmic-400/40 disabled:cursor-wait"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{t.icon}</span>
            <h3 className="font-semibold">{t.title}</h3>
            <span className="chip ml-auto bg-cosmic-500/20 text-cosmic-200">🔒</span>
          </div>

          {/* Real teaser text, blurred so it's enticing but unreadable */}
          <p className="mt-3 select-none text-sm leading-relaxed text-white/70 blur-[5px]">
            {t.teaser}
          </p>

          {/* Fade + reveal CTA on hover */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-ink/90 to-transparent pb-3">
            <span className="rounded-full bg-cosmic-500/30 px-3 py-1 text-xs font-medium text-cosmic-100 backdrop-blur transition group-hover:bg-cosmic-500/50">
              {busy ? "Preparing checkout…" : "Tap to unlock →"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
