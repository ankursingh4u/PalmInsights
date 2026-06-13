import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";
import { store } from "@/lib/store";
import { gateResult } from "@/lib/palmistry";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const record = await store.getScan(params.id);
  const top = record?.result.lines[0];
  const desc = top
    ? `AI says my palm shows: ${top.summary}`
    : "AI-powered palm reading.";
  return {
    title: "A PalmInsight Reading",
    description: desc,
    openGraph: { title: "A PalmInsight Reading", description: desc },
  };
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const record = await store.getScan(params.id);
  if (!record) notFound();

  const result = gateResult(record.result, false);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-10">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <Link href="/scan" className="btn-ghost">
          Scan yours
        </Link>
      </header>

      <div className="card premium-surface text-center">
        <span className="chip bg-cosmic-500/20 text-cosmic-200">
          ✋ Shared palm reading
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold">
          {result.handedness} hand reading
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Here are the free highlights. Scan your own palm for a full reading.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {result.lines.map((line) => (
          <div key={line.key} className="card">
            <div className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              <h3 className="text-lg font-semibold">{line.label}</h3>
              <span
                className="chip ml-auto font-semibold"
                style={{ backgroundColor: `${line.color}26`, color: line.color }}
              >
                {line.pattern}
              </span>
            </div>
            <p className="mt-3 text-sm text-white/80">{line.summary}</p>
            <ul className="mt-2 space-y-1.5 text-sm text-white/70">
              {line.interpretation.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: line.color }}>•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-white/50">
              Confidence {line.confidence}%
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/scan" className="btn-primary">
          ✨ Scan your own palm — free
        </Link>
      </div>

      <SiteFooter />
    </main>
  );
}
