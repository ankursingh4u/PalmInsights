import { config, aiEnabled } from "../config";
import type { AnalysisResult } from "../types";

// A short, daily "what your palm says today" reading. Text-only (no image),
// so it's extremely cheap — generated from the lines already read from the
// user's palm, seeded by the date so it changes each day.

export async function dailyHoroscope(
  result: AnalysisResult,
  dateStr: string
): Promise<string | null> {
  if (!aiEnabled) return null;
  const lines = result.lines
    .map((l) => `${l.label}: ${l.pattern} — ${l.summary}`)
    .join("; ");
  const sys =
    "You write a short daily palm horoscope for an entertainment app. Given a person's palm-line reading, write 2-3 warm, specific, second-person sentences about what today holds for them (energy, love, money, or a small piece of guidance). Make it feel personal to THEIR lines and unique to this date. No preamble, no headers — just the horoscope text.";
  const user = `Date: ${dateStr}. Their palm lines: ${lines}. Write today's palm horoscope.`;

  // Prefer OpenAI (typically funded here); fall back to others if present.
  try {
    if (config.ai.openaiKey) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.ai.openaiKey}` },
        body: JSON.stringify({
          model: config.ai.openaiCheap,
          max_tokens: 220,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    }
  } catch {
    /* fall through */
  }
  return null;
}
