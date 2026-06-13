"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { generateShareCard } from "@/lib/shareCard";
import { trackEvent } from "@/lib/api";

interface Props {
  result: AnalysisResult;
  shareUrl: string;
  scanId?: string;
}

export function SharePanel({ result, shareUrl, scanId }: Props) {
  const [card, setCard] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function makeCard() {
    setBusy(true);
    try {
      const dataUrl = await generateShareCard(result, shareUrl);
      setCard(dataUrl);
      trackEvent("share_created", scanId);
    } finally {
      setBusy(false);
    }
  }

  async function dataUrlToFile(dataUrl: string): Promise<File> {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], "palm-reading.png", { type: "image/png" });
  }

  async function shareCard() {
    if (!card) return;
    try {
      const file = await dataUrlToFile(card);
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My PalmInsight reading",
          text: "AI says my palm shows... 🔮",
        });
        return;
      }
    } catch {
      /* fall through to download */
    }
    downloadCard();
  }

  function downloadCard() {
    if (!card) return;
    const a = document.createElement("a");
    a.href = card;
    a.download = "palm-reading.png";
    a.click();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <span className="text-xl">📲</span>
        <h3 className="text-lg font-semibold">Share your reading</h3>
      </div>
      <p className="mt-1 text-sm text-white/60">
        Generate an Instagram-story card or copy a link to your reading.
      </p>

      {!card ? (
        <button onClick={makeCard} disabled={busy} className="btn-primary mt-4 w-full sm:w-auto">
          {busy ? "Creating card…" : "✨ Create share card"}
        </button>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card}
            alt="Share card preview"
            className="mx-auto w-40 rounded-xl border border-white/10 shadow-lg"
          />
          <div className="flex flex-col justify-center gap-3">
            <button onClick={shareCard} className="btn-primary">
              📤 Share / Save card
            </button>
            <button onClick={downloadCard} className="btn-ghost">
              ⬇️ Download
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 truncate rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/80"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button onClick={copyLink} className="btn-ghost">
          {copied ? "✓ Copied" : "🔗 Copy link"}
        </button>
      </div>
    </div>
  );
}
