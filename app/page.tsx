import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthMenu } from "@/components/AuthMenu";
import { PalmArt } from "@/components/PalmArt";
import { SiteFooter } from "@/components/SiteFooter";
import { priceLabel } from "@/lib/config";

const LINES = [
  { name: "Life Line", color: "text-life", desc: "Energy, resilience & vitality", free: true },
  { name: "Heart Line", color: "text-heart", desc: "Love & emotional nature", free: true },
  { name: "Head Line", color: "text-head", desc: "Thinking & decision style", free: false },
  { name: "Fate Line", color: "text-fate", desc: "Career & life direction", free: false },
];

// Everything the product does — shown up front so visitors instantly get it.
const FEATURES = [
  { icon: "🤚", title: "Real AI palm reading", body: "Our AI looks at your actual photo and reads your real lines — every palm is different." },
  { icon: "🧠", title: "Knows a real palm", body: "It verifies it's a genuine palm first, so you get a true reading, never a fake one." },
  { icon: "💰", title: "Money & Wealth", body: "Your earning style, financial outlook, and when prosperity peaks." },
  { icon: "💍", title: "Marriage & Partnership", body: "Partnership timing and what a lasting bond looks like for you." },
  { icon: "👶", title: "Family & Children", body: "Your nurturing style and what the lines hint about family." },
  { icon: "🌌", title: "Destiny & Career", body: "Your big-picture life story plus career strengths and turning points." },
  { icon: "💕", title: "You + Your Crush", body: "Scan two palms (or a birth date) for a love compatibility match score." },
  { icon: "🌙", title: "Daily palm guidance", body: "What to wear, your lucky time, what's good today — fresh every day." },
  { icon: "✦", title: "Your palm personality", body: "A catchy palm 'type' with your lucky number, color & day." },
  { icon: "📲", title: "Shareable story card", body: "A gorgeous card for Instagram & Snap — share your reading in a tap." },
  { icon: "🔒", title: "Private & secure", body: "Your hand is detected in your browser; readings stay yours." },
  { icon: "⚡", title: "Instant · no sign-up", body: "Get your free reading in seconds — no account needed." },
];

const REPORT = [
  { icon: "🌌", t: "Destiny" },
  { icon: "💼", t: "Career & Success" },
  { icon: "💰", t: "Money & Wealth" },
  { icon: "💗", t: "Love" },
  { icon: "💍", t: "Marriage" },
  { icon: "👶", t: "Family & Children" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-5">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/scan" className="btn-ghost py-2 text-sm">
            Scan Palm
          </Link>
          <AuthMenu />
        </div>
      </header>

      {/* Hero */}
      <section className="relative grid place-items-center py-10 text-center sm:py-14">
        <PalmArt className="animate-float mb-2 h-40 w-40 sm:h-52 sm:w-52" />
        <span className="chip mb-5 animate-fade-up bg-cosmic-500/15 text-cosmic-200">
          ✨ AI-powered palmistry
        </span>
        <h1 className="animate-fade-up font-display text-4xl font-bold leading-tight sm:text-6xl">
          Scan Your Palm.
          <br />
          <span className="animate-gradient bg-gradient-to-r from-cosmic-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
            Discover Your Story.
          </span>
        </h1>
        <p className="mt-6 max-w-xl animate-fade-up text-lg text-white/70">
          A real AI reads your actual palm and reveals your life, love, money,
          marriage, family and destiny — plus a daily guide and your lucky
          number, color &amp; day.
        </p>
        <div className="mt-9 flex animate-fade-up flex-col items-center gap-3 sm:flex-row">
          <Link href="/scan" className="btn-primary animate-glow text-lg">
            ✋ Scan Palm — Free
          </Link>
          <span className="text-sm text-white/50">No sign-up · Instant results</span>
        </div>
      </section>

      {/* Everything you get — the full feature showcase */}
      <section className="py-8">
        <div className="text-center">
          <span className="chip bg-cosmic-500/15 text-cosmic-200">Everything inside</span>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            One palm photo. This much insight.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            No login, no catch — start free and see your reading in seconds.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card hover-lift animate-fade-up"
              style={{ animationDelay: `${(i % 6) * 70}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="font-semibold">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The four lines */}
      <section className="py-10">
        <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">
          Your four palm lines, decoded
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LINES.map((l) => (
            <div key={l.name} className="card">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${l.color}`}>{l.name}</h3>
                <span className="chip">{l.free ? "Free" : "Premium"}</span>
              </div>
              <p className="mt-2 text-sm text-white/60">{l.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Deep Report */}
      <section className="card premium-surface relative overflow-hidden p-8 text-center sm:p-12">
        <span className="chip bg-cosmic-500/20 text-cosmic-200">✦ Deep Report · {priceLabel()}</span>
        <h2 className="mt-3 font-display text-3xl font-semibold">
          Unlock the full picture
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-white/70">
          Six personalized chapters read from your palm — money, marriage,
          children and more — plus your palm personality type and lucky
          highlights. One-time {priceLabel()}.
        </p>
        <div className="mx-auto mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {REPORT.map((r) => (
            <div key={r.t} className="hover-lift rounded-xl border border-white/10 bg-white/5 px-3 py-4">
              <div className="text-2xl">{r.icon}</div>
              <div className="mt-1 text-sm font-medium text-white/85">{r.t}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-white/70">
          <span className="chip">💕 Love compatibility</span>
          <span className="chip">🌙 Daily email guidance</span>
          <span className="chip">✦ Lucky number, color &amp; day</span>
        </div>
        <Link href="/scan" className="btn-primary mt-8">
          Start your free reading
        </Link>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          Your palm is waiting.
        </h2>
        <p className="mt-3 text-white/60">Free reading in seconds — no account, no card.</p>
        <Link href="/scan" className="btn-primary animate-glow mt-7 text-lg">
          ✋ Scan My Palm Free
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
