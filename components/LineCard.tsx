"use client";

import type { LineKey, PalmLine } from "@/lib/types";
import { useCountUp } from "@/lib/useCountUp";
import { useTilt } from "@/lib/useTilt";

interface Props {
  line: PalmLine;
  selected: boolean;
  visible: boolean;
  index?: number;
  onSelect: (key: LineKey) => void;
  onToggleVisible: (key: LineKey) => void;
}

export function LineCard({
  line,
  selected,
  visible,
  index = 0,
  onSelect,
  onToggleVisible,
}: Props) {
  const conf = useCountUp(line.confidence, 1000, 250 + index * 120);
  const tilt = useTilt(4);

  return (
    <div
      className="animate-fade-up scroll-mt-4"
      style={{ animationDelay: `${index * 80}ms` }}
      id={`line-${line.key}`}
    >
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`card cursor-pointer ${
        selected ? "ring-2 ring-offset-2 ring-offset-ink" : "hover:border-white/20"
      }`}
      style={{
        ...tilt.style,
        ...(selected ? { ["--tw-ring-color" as string]: line.color } : {}),
      }}
      onClick={() => onSelect(line.key)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: line.color }}
          />
          <h3 className="text-lg font-semibold">{line.label}</h3>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible(line.key);
          }}
          className="chip shrink-0 hover:bg-white/20"
          aria-pressed={visible}
          title="Toggle overlay"
        >
          {visible ? "👁 On" : "🚫 Off"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="chip font-semibold"
          style={{ backgroundColor: `${line.color}26`, color: line.color }}
        >
          {line.pattern}
        </span>
        <span className="text-sm text-white/60">{line.summary}</span>
      </div>

      {/* Confidence bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>Confidence</span>
          <span className="font-semibold tabular-nums text-white/80">{conf}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${conf}%`,
              backgroundColor: line.color,
              boxShadow: `0 0 8px ${line.color}`,
            }}
          />
        </div>
      </div>

      {/* Interpretation — always show first bullet; expand on select */}
      <ul className="mt-4 space-y-2 text-sm text-white/75">
        {(selected ? line.interpretation : line.interpretation.slice(0, 1)).map(
          (t, i) => (
            <li key={i} className="flex gap-2">
              <span style={{ color: line.color }}>•</span>
              <span>{t}</span>
            </li>
          )
        )}
      </ul>
      {!selected && line.interpretation.length > 1 && (
        <p className="mt-2 text-xs text-cosmic-300">Tap to read more →</p>
      )}
    </div>
    </div>
  );
}

export function LockedLineCard({
  label,
  color,
  onUnlock,
}: {
  label: string;
  color: string;
  onUnlock: () => void;
}) {
  return (
    <div className="card relative overflow-hidden">
      <div className="flex items-center gap-2.5">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-lg font-semibold">{label}</h3>
        <span className="chip ml-auto">🔒 Premium</span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-1/2 rounded bg-white/10" />
        <div className="h-3 w-2/3 rounded bg-white/10" />
      </div>
      <button onClick={onUnlock} className="btn-ghost mt-4 w-full">
        Unlock to reveal
      </button>
    </div>
  );
}
