"use client";

import type { PremiumReport } from "@/lib/types";

const ICONS: Record<keyof PremiumReport, string> = {
  destiny: "🌌",
  career: "💼",
  love: "💗",
};

export function ReportView({ report }: { report: PremiumReport }) {
  const sections: (keyof PremiumReport)[] = ["destiny", "career", "love"];
  return (
    <div className="space-y-4">
      {sections.map((key, i) => {
        const s = report[key];
        return (
          <div
            key={key}
            className="card animate-fade-up"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{ICONS[key]}</span>
              <h3 className="text-lg font-semibold">{s.title}</h3>
            </div>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/80">
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
