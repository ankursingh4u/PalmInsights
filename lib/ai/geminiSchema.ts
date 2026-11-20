// Gemini's structured-output schema (a restricted OpenAPI subset) rejects any
// "additionalProperties" key with a 400 — unlike OpenAI/Anthropic's json_schema
// format, which uses it. Strip it recursively before sending a schema to Gemini.
export function forGemini(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(forGemini);
  if (schema && typeof schema === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema)) {
      if (key === "additionalProperties") continue;
      out[key] = forGemini(value);
    }
    return out;
  }
  return schema;
}
