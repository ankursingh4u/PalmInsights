"use client";

import type { LineKey, PalmLine } from "@/lib/types";

interface Props {
  imageUrl: string;
  lines: PalmLine[];
  visible: Set<LineKey>;
  selected: LineKey | null;
  onSelect: (key: LineKey) => void;
}

/**
 * Displays the palm photo with interactive, colored SVG line overlays.
 * The SVG uses a 0..100 viewBox stretched (preserveAspectRatio="none") to
 * exactly cover the image, matching MediaPipe's normalized landmark space.
 */
export function PalmOverlay({ imageUrl, lines, visible, selected, onSelect }: Props) {
  return (
    <div className="relative mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Your palm"
        className="block w-full select-none"
        draggable={false}
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {lines.map((line, i) => {
          if (!visible.has(line.key)) return null;
          const isSel = selected === line.key;
          const dim = selected !== null && !isSel;
          return (
            <g
              key={line.key}
              style={{ color: line.color, cursor: "pointer" }}
              onClick={() => onSelect(line.key)}
              opacity={dim ? 0.35 : 1}
            >
              {/* wide invisible hit area */}
              <path
                d={line.path}
                fill="none"
                stroke="transparent"
                strokeWidth={6}
                strokeLinecap="round"
              />
              {/* visible glowing stroke — draws itself on, staggered */}
              <path
                d={line.path}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pathLength={100}
                className="line-glow draw-on"
                style={{
                  strokeWidth: isSel ? 3 : 2,
                  animationDelay: `${0.15 + i * 0.28}s`,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
