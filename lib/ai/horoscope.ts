import Anthropic from "@anthropic-ai/sdk";
import { config, aiEnabled } from "../config";
import { forGemini } from "./geminiSchema";
import type { AnalysisResult, DailyGuidance } from "../types";

// Rich daily lifestyle guidance derived from a palm reading: a short horoscope
// plus what to wear (lucky color/outfit), what's good for you today, what to
// avoid, your lucky time, and a one-word mood. Text-only (no image) so it's
// extremely cheap to generate, and seeded by the date so it changes daily.
//
// Same multi-provider fallback chain as lib/ai/palmVision.ts: try whichever
// providers are actually configured, cheapest/fastest first, so a reading
// still gets personalized daily guidance even when only one provider's key
// (e.g. only ANTHROPIC_API_KEY, no OPENAI_API_KEY) is set.

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

const SYSTEM =
  "You are a palmist writing a personal DAILY lifestyle guide for an entertainment app. Given a person's palm reading and today's date, produce upbeat, specific, second-person guidance that feels tailored to THEIR lines and unique to this date: a short horoscope, a lucky color to wear with a fun outfit tip, what today is good for, what to avoid, a lucky time window, and a one-word mood. Keep it lighthearted and confident. Output ONLY the JSON.";

function userPrompt(lines: string, dateStr: string): string {
  return `Date: ${dateStr}. Their palm lines: ${lines}. Write today's personalized daily guidance.`;
}

function parse(raw: string): DailyGuidance {
  let text = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start > 0 || end < text.length - 1) text = text.slice(start, end + 1);
  return JSON.parse(text) as DailyGuidance;
}

interface Attempt {
  provider: "gemini" | "openai" | "anthropic";
  model: string;
}

function chain(): Attempt[] {
  const a = config.ai;
  const all: Attempt[] = [
    { provider: "gemini", model: a.geminiCheap },
    { provider: "openai", model: a.openaiCheap },
    { provider: "anthropic", model: a.anthropicCheap },
  ];
  return all.filter(
    (x) =>
      (x.provider === "anthropic" && a.anthropicKey) ||
      (x.provider === "openai" && a.openaiKey) ||
      (x.provider === "gemini" && a.geminiKey)
  );
}

let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: config.ai.anthropicKey });
  return _anthropic;
}

async function callOpenAI(model: string, lines: string, dateStr: string): Promise<DailyGuidance> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.ai.openaiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0,
      response_format: { type: "json_schema", json_schema: { name: "daily", strict: true, schema: SCHEMA } },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt(lines, dateStr) },
      ],
    }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return parse(d.choices?.[0]?.message?.content ?? "");
}

async function callAnthropic(model: string, lines: string, dateStr: string): Promise<DailyGuidance> {
  const res = await anthropic().messages.create({
    model,
    max_tokens: 500,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: userPrompt(lines, dateStr) }],
  } as Anthropic.Messages.MessageCreateParamsNonStreaming);
  const block = res.content.find((b) => b.type === "text");
  return parse(block && "text" in block ? block.text : "");
}

async function callGemini(model: string, lines: string, dateStr: string): Promise<DailyGuidance> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.ai.geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: userPrompt(lines, dateStr) }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: forGemini(SCHEMA), maxOutputTokens: 500 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ?? "";
  return parse(text);
}

async function callOne(a: Attempt, lines: string, dateStr: string): Promise<DailyGuidance> {
  if (a.provider === "anthropic") return callAnthropic(a.model, lines, dateStr);
  if (a.provider === "openai") return callOpenAI(a.model, lines, dateStr);
  return callGemini(a.model, lines, dateStr);
}

export async function dailyGuidance(
  result: AnalysisResult,
  dateStr: string
): Promise<DailyGuidance | null> {
  if (!aiEnabled) return null;

  const lines = result.lines
    .map((l) => `${l.label}: ${l.pattern} — ${l.summary}`)
    .join("; ");

  let lastErr: unknown = null;
  for (const a of chain()) {
    try {
      return await callOne(a, lines, dateStr);
    } catch (err) {
      lastErr = err;
      // try next provider
    }
  }
  if (lastErr) console.error("[horoscope] all providers failed:", (lastErr as Error).message);
  return null;
}
