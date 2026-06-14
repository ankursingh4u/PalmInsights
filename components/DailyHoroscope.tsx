"use client";

import { useEffect, useState } from "react";
import { fetchHoroscope } from "@/lib/api";

export function DailyHoroscope({ scanId }: { scanId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    fetchHoroscope(scanId)
      .then((r) => {
        if (alive) setText(r.horoscope);
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
        <h3 className="text-lg font-semibold">Today&apos;s Palm Horoscope</h3>
        <span className="chip ml-auto text-xs">{today}</span>
      </div>
      {busy ? (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/10" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-white/85">{text}</p>
      )}
    </div>
  );
}
