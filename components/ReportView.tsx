"use client";

import type { PremiumReport, ReportSection } from "@/lib/types";

type SectionKey = "destiny" | "career" | "wealth" | "love" | "marriage" | "children";

const SECTIONS: { key: SectionKey; icon: string }[] = [
  { key: "destiny", icon: "🌌" },
  { key: "career", icon: "💼" },
  { key: "wealth", icon: "💰" },
  { key: "love", icon: "💗" },
  { key: "marriage", icon: "💍" },
  { key: "children", icon: "👶" },
];

export function ReportView({ report }: { report: PremiumReport }) {
  const h = report.highlights;
  return (
    <div className="space-y-4">
      {/* Shareable highlights strip */}
      {h && (
        <div className="card premium-surface animate-fade-up p-5 text-center">
          {h.archetype && (
            <>
              <span className="chip bg-cosmic-500/20 text-cosmic-200">Your palm type</span>
              <h3 className="mt-2 font-display text-2xl font-semibold">{h.archetype}</h3>
            </>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <Highlight label="Lucky #" value={h.luckyNumber} />
            <Highlight label="Color" value={h.luckyColor} />
            <Highlight label="Day" value={h.luckyDay} />
          </div>
        </div>
      )}

      {SECTIONS.map(({ key, icon }, i) => {
        const s = report[key] as ReportSection | undefined;
        if (!s) return null;
        return (
          <div
            key={key}
            className="card animate-fade-up"
            style={{ animationDelay: `${(i + 1) * 80}ms` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <h3 className="text-lg font-semibold">{s.title}</h3>
            </div>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/80">
              {s.body.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 py-3">
      <div className="text-xs uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-1 font-semibold text-white">{value || "—"}</div>
    </div>
  );
}
