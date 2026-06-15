"use client";

import type { AnalysisResult } from "./types";

// ---------------------------------------------------------------------------
// Generates an Instagram-story-sized (1080x1920) share card on a canvas from
// a reading. The original palm photo is intentionally NOT included (privacy);
// instead we draw a stylized cosmic card with the headline interpretations.
// ---------------------------------------------------------------------------

export async function generateShareCard(
  result: AnalysisResult,
  shareUrl: string
): Promise<string> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#150a2e");
  bg.addColorStop(0.5, "#0b0614");
  bg.addColorStop(1, "#0a1330");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft glow.
  radial(ctx, W * 0.5, H * 0.12, 520, "rgba(139,92,246,0.35)");
  radial(ctx, W * 0.85, H * 0.9, 480, "rgba(59,130,246,0.22)");

  // Decorative stars.
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  const starSeed = result.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < 40; i++) {
    const x = ((starSeed * (i + 3) * 73) % W);
    const y = ((starSeed * (i + 7) * 131) % H);
    const r = ((i * 13) % 3) + 1;
    ctx.globalAlpha = 0.3 + ((i % 5) / 10);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Header.
  ctx.textAlign = "center";
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "600 40px Georgia, serif";
  ctx.fillText("✋ PALMINSIGHT", W / 2, 150);

  const h = result.report?.highlights;

  // Title — the catchy archetype if unlocked, else a generic headline.
  if (h?.archetype) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 40px Georgia, serif";
    ctx.fillText("My palm type is", W / 2, 256);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 84px Georgia, serif";
    ctx.fillText(h.archetype, W / 2, 350);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 80px Georgia, serif";
    ctx.fillText("My Palm Reading", W / 2, 320);
  }

  let y = h?.archetype ? 440 : 440;

  // Lucky highlights strip (premium).
  if (h) {
    const items: [string, string][] = [
      ["Lucky #", h.luckyNumber],
      ["Color", h.luckyColor],
      ["Day", h.luckyDay],
    ];
    const pad = 90;
    const gap = 24;
    const pw = (W - pad * 2 - gap * 2) / 3;
    items.forEach(([label, value], i) => {
      const px = pad + i * (pw + gap);
      roundRect(ctx, px, y, pw, 150, 24);
      ctx.fillStyle = "rgba(139,92,246,0.16)";
      ctx.fill();
      ctx.strokeStyle = "rgba(167,139,250,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "500 26px Georgia, serif";
      ctx.fillText(label.toUpperCase(), px + pw / 2, y + 52);
      ctx.fillStyle = "#e9d5ff";
      ctx.font = "700 40px Georgia, serif";
      const v = value.length > 11 ? value.slice(0, 10) + "…" : value;
      ctx.fillText(v, px + pw / 2, y + 112);
    });
    y += 210;
  }

  // Line cards — show every line we have, each with its interpretation.
  const lines = result.lines.slice(0, 4);
  const cardH = lines.length <= 2 ? 320 : 250;
  for (const line of lines) {
    drawCard(ctx, W, y, line, cardH);
    y += cardH + 26;
  }

  // For free readings, tease the premium topics so the card sells itself.
  if (!h) {
    roundRect(ctx, 90, y, W - 180, 150, 24);
    ctx.fillStyle = "rgba(139,92,246,0.16)";
    ctx.fill();
    ctx.strokeStyle = "rgba(167,139,250,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#e9d5ff";
    ctx.font = "700 38px Georgia, serif";
    ctx.fillText("🔒 Unlock the full reading", W / 2, y + 62);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "400 30px Georgia, serif";
    ctx.fillText("Money · Marriage · Children · Destiny", W / 2, y + 110);
    y += 200;
  }

  // Footer CTA.
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "500 40px Georgia, serif";
  ctx.fillText("✨ Scan your palm free at", W / 2, H - 170);
  ctx.fillStyle = "#a78bfa";
  ctx.font = "700 48px Georgia, serif";
  ctx.fillText(prettyUrl(shareUrl), W / 2, H - 100);

  return canvas.toDataURL("image/png");
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  y: number,
  line: { label: string; pattern: string; summary: string; confidence: number; color: string; interpretation: string[] },
  h: number
) {
  const x = 90;
  const w = W - 180;
  roundRect(ctx, x, y, w, h, 28);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Color dot + title.
  ctx.textAlign = "left";
  ctx.fillStyle = line.color;
  ctx.beginPath();
  ctx.arc(x + 50, y + 56, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 44px Georgia, serif";
  ctx.fillText(line.label, x + 90, y + 70);

  // Pattern + confidence.
  ctx.fillStyle = line.color;
  ctx.font = "600 32px Georgia, serif";
  ctx.fillText(line.pattern, x + 50, y + 126);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(`${line.confidence}%`, x + w - 50, y + 126);

  // Summary + first interpretation line (wrapped).
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 30px Georgia, serif";
  let yy = wrapText(ctx, line.summary, x + 50, y + 176, w - 100, 38);
  if (h > 290 && line.interpretation?.[0]) {
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "400 28px Georgia, serif";
    wrapText(ctx, line.interpretation[0], x + 50, yy + 44, w - 100, 36);
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, yy);
      line = word + " ";
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, yy);
  return yy;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function radial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname.length > 1 ? "/…" : "");
  } catch {
    return url;
  }
}
