"use client";

import { useState } from "react";
import { detectHand } from "@/lib/mediapipe";
import { analyze, fetchCompatibility } from "@/lib/api";
import type { CompatibilityResult } from "@/lib/types";
import { loadImage } from "@/lib/image";

interface Props {
  scanId: string;
  token: string;
}

type Mode = "birthdate" | "palm";

export function CompatibilityPanel({ scanId, token }: Props) {
  const [mode, setMode] = useState<Mode>("birthdate");
  const [birthdate, setBirthdate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  async function runBirthdate() {
    if (!birthdate) {
      setError("Enter a partner birth date.");
      return;
    }
    await run({ scanId, token, birthdate });
  }

  async function runPalm(file: File) {
    setBusy(true);
    setError(null);
    try {
      const img = await loadImage(URL.createObjectURL(file));
      const det = await detectHand(img);
      if (!det) {
        setError("No hand detected in the partner photo. Try another.");
        setBusy(false);
        return;
      }
      const { scanId: partnerScanId } = await analyze(det.landmarks, det.handedness);
      await run({ scanId, token, partnerScanId });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function run(args: {
    scanId: string;
    token: string;
    birthdate?: string;
    partnerScanId?: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const { result } = await fetchCompatibility(args);
      setResult(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <span className="text-xl">💞</span>
        <h3 className="text-lg font-semibold">Love Compatibility</h3>
      </div>
      <p className="mt-1 text-sm text-white/60">
        Compare with a partner using their palm photo or their birth date.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          className={`chip ${mode === "birthdate" ? "bg-cosmic-500/30 text-cosmic-100" : ""}`}
          onClick={() => setMode("birthdate")}
        >
          Birth date
        </button>
        <button
          className={`chip ${mode === "palm" ? "bg-cosmic-500/30 text-cosmic-100" : ""}`}
          onClick={() => setMode("palm")}
        >
          Partner&apos;s palm
        </button>
      </div>

      <div className="mt-4">
        {mode === "birthdate" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="date"
              value={birthdate}
              max="2025-12-31"
              onChange={(e) => setBirthdate(e.target.value)}
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cosmic-400"
            />
            <button onClick={runBirthdate} disabled={busy} className="btn-primary">
              {busy ? "…" : "Check match"}
            </button>
          </div>
        ) : (
          <label className="btn-ghost w-full cursor-pointer justify-center">
            {busy ? "Analyzing…" : "📷 Upload partner's palm"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void runPalm(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {result && (
        <div className="mt-5 animate-fade-up rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Compatibility Score</span>
            <span className="font-display text-3xl font-bold text-cosmic-200">
              {result.score}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-cosmic-400"
              style={{ width: `${result.score}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-white/80">{result.summary}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-green-300">
                Strengths
              </h4>
              <ul className="mt-1 space-y-1 text-sm text-white/75">
                {result.strengths.map((s) => (
                  <li key={s}>+ {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                Potential challenges
              </h4>
              <ul className="mt-1 space-y-1 text-sm text-white/75">
                {result.challenges.map((s) => (
                  <li key={s}>– {s}</li>
                ))}
              </ul>
            </div>
          </div>

          {result.advice.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-cosmic-300">
                Advice
              </h4>
              <ul className="mt-1 space-y-1 text-sm text-white/75">
                {result.advice.map((s) => (
                  <li key={s}>✦ {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
