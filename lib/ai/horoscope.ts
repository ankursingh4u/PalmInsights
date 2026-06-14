import { config, aiEnabled } from "../config";
import type { AnalysisResult, DailyGuidance } from "../types";

// Rich daily lifestyle guidance derived from a palm reading: a short horoscope
// plus what to wear (lucky color/outfit), what's good for you today, what to
// avoid, your lucky time, and a one-word mood. Text-only (no image) so it's
// extremely cheap to generate, and seeded by the date so it changes daily.

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    horoscope: { type: "string", description: "2-3 warm, specific second-person sentences about today" },
    wearColor: { type: "string", description: "a lucky color to wear today, e.g. 'Emerald green'" },
    outfit: { type: "string", description: "a short, fun style tip for today" },
    goodFor: { type: "array", items: { type: "string" }, description: "2-3 favorable activities today" },
    avoid: { type: "array", items: { type: "string" }, description: "1-2 things to avoid today" },
    luckyTime: { type: "string", description: "best time window today, e.g. 'Afternoon (2–5 PM)'" },
    mood: { type: "string", description: "one-word vibe for the day, e.g. 'Magnetic'" },
  },
  required: ["horoscope", "wearColor", "outfit", "goodFor", "avoid", "luckyTime", "mood"],
};

export async function dailyGuidance(
  result: AnalysisResult,
  dateStr: string
): Promise<DailyGuidance | null> {
  if (!aiEnabled || !config.ai.openaiKey) return null;

  const lines = result.lines
    .map((l) => `${l.label}: ${l.pattern} — ${l.summary}`)
    .join("; ");
  const sys =
    "You are a palmist writing a personal DAILY lifestyle guide for an entertainment app. Given a person's palm reading and today's date, produce upbeat, specific, second-person guidance that feels tailored to THEIR lines and unique to this date: a short horoscope, a lucky color to wear with a fun outfit tip, what today is good for, what to avoid, a lucky time window, and a one-word mood. Keep it lighthearted and confident. Output ONLY the JSON.";
  const user = `Date: ${dateStr}. Their palm lines: ${lines}. Write today's personalized daily guidance.`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.ai.openaiKey}` },
      body: JSON.stringify({
        model: config.ai.openaiCheap,
        max_tokens: 500,
        response_format: { type: "json_schema", json_schema: { name: "daily", strict: true, schema: SCHEMA } },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const text = d.choices?.[0]?.message?.content;
    if (!text) return null;
    return JSON.parse(text) as DailyGuidance;
  } catch {
    return null;
  }
}
