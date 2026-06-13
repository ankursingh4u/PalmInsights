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

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 76px Georgia, serif";
  ctx.fillText("My Palm Reading", W / 2, 270);

  // Line cards.
  let y = 420;
  for (const line of result.lines.slice(0, 4)) {
    drawCard(ctx, W, y, line.label, line.pattern, line.summary, line.confidence, line.color);
    y += 300;
  }

  // Footer CTA.
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "500 38px Georgia, serif";
  ctx.fillText("Scan your palm at", W / 2, H - 170);
  ctx.fillStyle = "#a78bfa";
  ctx.font = "700 44px Georgia, serif";
  ctx.fillText(prettyUrl(shareUrl), W / 2, H - 110);

  return canvas.toDataURL("image/png");
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  y: number,
  title: string,
  pattern: string,
  summary: string,
  confidence: number,
  color: string
) {
  const x = 90;
  const w = W - 180;
  const h = 250;
  roundRect(ctx, x, y, w, h, 28);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Color dot + title.
  ctx.textAlign = "left";
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 50, y + 60, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 46px Georgia, serif";
  ctx.fillText(title, x + 90, y + 75);

  // Pattern + confidence.
  ctx.fillStyle = color;
  ctx.font = "600 34px Georgia, serif";
  ctx.fillText(pattern, x + 50, y + 135);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(`${confidence}%`, x + w - 50, y + 135);

  // Summary (wrapped).
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "400 32px Georgia, serif";
  wrapText(ctx, summary, x + 50, y + 190, w - 100, 40);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
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
