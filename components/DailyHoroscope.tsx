"use client";

import { useEffect, useState } from "react";
import { fetchHoroscope } from "@/lib/api";
import type { DailyGuidance } from "@/lib/types";

export function DailyHoroscope({ scanId }: { scanId: string }) {
  const [g, setG] = useState<DailyGuidance | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    fetchHoroscope(scanId)
      .then((r) => {
        if (alive) setG(r.guidance);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [scanId]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="card animate-fade-up bg-gradient-to-br from-cosmic-500/10 to-transparent">
      <div className="flex items-center gap-2">
        <span className="text-xl">🌙</span>
        <h3 className="text-lg font-semibold">Your Day, by Your Palm</h3>
        <span className="chip ml-auto text-xs">{today}</span>
      </div>

      {busy || !g ? (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/10" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-14 animate-pulse rounded-xl bg-white/10" />
            <div className="h-14 animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-white/85">{g.horoscope}</p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile icon="👕" label="Wear" value={g.wearColor} />
            <Tile icon="⏰" label="Lucky time" value={g.luckyTime} />
            <Tile icon="✨" label="Mood" value={g.mood} />
            <Tile icon="🎯" label="Best for" value={g.goodFor[0] || "—"} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <List title="Good for you today" items={g.goodFor} sign="+" tone="text-green-300" />
            <List title="Better to avoid" items={g.avoid} sign="–" tone="text-amber-300" />
          </div>

          {g.outfit && (
            <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/75">
              <span className="text-cosmic-300">Style tip:</span> {g.outfit}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Tile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2.5 text-center">
      <div className="text-base">{icon}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-white">{value}</div>
    </div>
  );
}

function List({
  title,
  items,
  sign,
  tone,
}: {
  title: string;
  items: string[];
  sign: string;
  tone: string;
}) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className={`text-xs font-semibold uppercase tracking-wide ${tone}`}>{title}</h4>
      <ul className="mt-1 space-y-1 text-sm text-white/75">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className={tone}>{sign}</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
