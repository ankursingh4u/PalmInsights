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

const STEPS = [
  { n: "1", title: "Capture your palm", body: "Snap a photo or upload one. Open hand, good lighting." },
  { n: "2", title: "AI detects your lines", body: "We find your hand and map your four major palm lines." },
  { n: "3", title: "Read your story", body: "Tap any line for an instant, personalized interpretation." },
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
      <section className="relative grid place-items-center py-12 text-center sm:py-16">
        <PalmArt className="animate-float mb-2 h-44 w-44 sm:h-52 sm:w-52" />
        <span className="chip mb-6 animate-fade-up bg-cosmic-500/15 text-cosmic-200">
          ✨ AI-powered palmistry
        </span>
        <h1 className="animate-fade-up font-display text-4xl font-bold leading-tight sm:text-6xl">
          Scan Your Palm.
          <br />
          <span className="bg-gradient-to-r from-cosmic-300 via-cosmic-400 to-blue-300 bg-clip-text text-transparent">
            Discover Your Story.
          </span>
        </h1>
        <p className="mt-6 max-w-xl animate-fade-up text-lg text-white/70">
          Upload a photo of your hand and watch AI highlight your palm lines,
          then reveal what they say about your life, love, mind and destiny.
        </p>
        <div className="mt-9 flex animate-fade-up flex-col items-center gap-3 sm:flex-row">
          <Link href="/scan" className="btn-primary text-lg">
            ✋ Scan Palm — Free
          </Link>
          <span className="text-sm text-white/50">
            No sign-up · Instant results
          </span>
        </div>
      </section>

      {/* Lines preview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LINES.map((l) => (
          <div key={l.name} className="card animate-fade-up">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${l.color}`}>{l.name}</h3>
              <span className="chip">
                {l.free ? "Free" : `${priceLabel()} Premium`}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/60">{l.desc}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="py-20">
        <h2 className="text-center font-display text-3xl font-semibold">
          How it works
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-cosmic-500/20 font-display text-lg font-bold text-cosmic-200">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium teaser */}
      <section className="card premium-surface relative overflow-hidden p-8 text-center sm:p-12">
        <h2 className="font-display text-3xl font-semibold">
          Unlock your Deep Report
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-white/70">
          Reveal your Head & Fate lines, a full destiny report, love
          compatibility, and a career tendency analysis — all for {priceLabel()}.
        </p>
        <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm text-white/80">
          {[
            "Head & Fate line analysis",
            "Full destiny report",
            "Love compatibility (two palms or birth date)",
            "Career tendency report",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-cosmic-300">✦</span> {f}
            </li>
          ))}
        </ul>
        <Link href="/scan" className="btn-primary mt-8">
          Start your reading
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
