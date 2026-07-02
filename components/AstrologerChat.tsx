"use client";

import { useEffect, useRef, useState } from "react";
import { askAstrologer } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

interface Props {
  scanId: string;
  token: string;
}

const SUGGESTIONS = [
  "Will I be rich? 💰",
  "When will I find love?",
  "What should I focus on this year?",
  "Is my luck about to change?",
  "Should I take a big risk right now?",
];

const GREETING =
  "I've studied your palm ✨ Ask me anything — your career, money, love, luck, or a decision on your mind. What do you want to know?";

export function AstrologerChat({ scanId, token }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setError(null);
    setInput("");

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setBusy(true);
    try {
      const { reply } = await askAstrologer(scanId, token, next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError((e as Error).message);
      // Roll back the unanswered question so the user can retry cleanly.
      setMessages(messages);
      setInput(question);
    } finally {
      setBusy(false);
    }
  }

  const showSuggestions = messages.length === 0;

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔮</span>
        <h3 className="text-lg font-semibold">Ask the Astrologer</h3>
        <span className="chip ml-auto bg-cosmic-500/20 text-cosmic-200">Live</span>
      </div>
      <p className="mt-1 text-sm text-white/60">
        Chat with Aria about your reading — she remembers every line of your palm.
      </p>

      <div
        ref={scrollRef}
        className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4"
      >
        {/* Astrologer greeting */}
        <div className="flex gap-2">
          <span className="text-lg">🔮</span>
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-sm text-white/85">
            {GREETING}
          </div>
        </div>

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-cosmic-500/30 px-3.5 py-2.5 text-sm text-white">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2">
              <span className="text-lg">🔮</span>
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-sm text-white/85">
                {m.content}
              </div>
            </div>
          )
        )}

        {busy && (
          <div className="flex gap-2">
            <span className="text-lg">🔮</span>
            <div className="rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" />
              </span>
            </div>
          </div>
        )}
      </div>

      {showSuggestions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="chip hover:bg-cosmic-500/20"
              disabled={busy}
              onClick={() => void send(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your question…"
          maxLength={2000}
          disabled={busy}
          className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cosmic-400"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary">
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
