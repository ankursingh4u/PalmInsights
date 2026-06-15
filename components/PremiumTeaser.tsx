"use client";

// Blurred preview of the premium topics — shows users exactly what they're
// missing (Money / Marriage / Children …) to drive the $5 unlock.

const TOPICS = [
  {
    icon: "💰",
    title: "Money & Wealth",
    teaser:
      "Your hand points to wealth that is built rather than handed to you — and your prosperity peaks around your mid-thirties when you back your own judgment and let your skills compound into real security.",
  },
  {
    icon: "💍",
    title: "Marriage & Partnership",
    teaser:
      "A lasting bond is written into your palm: it deepens with time rather than burning fast. A defining partnership solidifies in your late twenties with someone who feels like a best friend and a teammate at once.",
  },
  {
    icon: "👶",
    title: "Family & Children",
    teaser:
      "Your lines reveal a warm, protective family nature — the kind of home people feel safe in. The way you nurture is encouraging rather than controlling, and children play a joyful role in your story.",
  },
  {
    icon: "🌌",
    title: "Your Destiny + Lucky Highlights",
    teaser:
      "Discover your palm personality type and your lucky number, color and day — plus the full destiny and career arc the threads of your fate line are quietly weaving toward.",
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
