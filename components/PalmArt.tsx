"use client";

// A stylized, glowing open-hand illustration with animated palm lines.
// Used on the landing hero and the capture screen. Pure SVG — crisp at any size.

const LINES = [
  // key, color, path (within the palm), draw delay
  { c: "#3b82f6", d: "M78 158 C 105 150, 136 152, 162 150", delay: 0 }, // heart
  { c: "#eab308", d: "M80 176 C 106 186, 136 188, 160 181", delay: 0.5 }, // head
  { c: "#ef4444", d: "M96 150 C 78 166, 70 198, 88 236", delay: 1.0 }, // life
  { c: "#22c55e", d: "M112 246 C 110 214, 110 184, 110 150", delay: 1.5 }, // fate
];

const SPARKLES = [
  { x: 30, y: 60, r: 2, d: 0 },
  { x: 188, y: 90, r: 2.5, d: 0.8 },
  { x: 200, y: 200, r: 2, d: 1.6 },
  { x: 18, y: 200, r: 1.6, d: 1.2 },
  { x: 110, y: 22, r: 2, d: 0.4 },
];

export function PalmArt({
  className = "",
  loop = true,
}: {
  className?: string;
  loop?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 220 280"
      className={className}
      role="img"
      aria-label="Glowing open palm with highlighted palm lines"
    >
      <defs>
        <linearGradient id="handSolid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="handEdge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="lineGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* halo */}
      <ellipse cx="110" cy="150" rx="92" ry="104" fill="url(#handSolid)" opacity="0.10" filter="url(#softGlow)" />

      {/* hand silhouette (group opacity avoids overlap seams) */}
      <g filter="url(#softGlow)">
        <g fill="url(#handSolid)" opacity="0.22">
          {/* palm */}
          <rect x="52" y="140" width="116" height="116" rx="48" />
          {/* fingers */}
          <rect x="63" y="70" width="22" height="92" rx="11" />
          <rect x="92" y="50" width="23" height="112" rx="11.5" />
          <rect x="121" y="62" width="22" height="100" rx="11" />
          <rect x="149" y="92" width="20" height="72" rx="10" />
          {/* thumb */}
          <rect x="20" y="150" width="22" height="80" rx="11" transform="rotate(-38 31 190)" />
        </g>
        {/* edge highlight */}
        <g fill="none" stroke="url(#handEdge)" strokeWidth="1.5" opacity="0.5">
          <rect x="52" y="140" width="116" height="116" rx="48" />
          <rect x="92" y="50" width="23" height="112" rx="11.5" />
        </g>
      </g>

      {/* palm lines */}
      <g filter="url(#lineGlow)" strokeLinecap="round" fill="none" strokeWidth="3.2">
        {LINES.map((l, i) => (
          <path
            key={i}
            d={l.d}
            stroke={l.c}
            pathLength={100}
            style={{
              strokeDasharray: 100,
              strokeDashoffset: 100,
              animation: loop
                ? `draw-loop 5s ease-in-out ${l.delay}s infinite`
                : `draw-on 1.1s ease-out ${l.delay * 0.3}s forwards`,
            }}
          />
        ))}
      </g>

      {/* sparkles */}
      <g fill="#e9d5ff">
        {SPARKLES.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            style={{ animation: `twinkle 3.5s ease-in-out ${s.d}s infinite` }}
          />
        ))}
      </g>
    </svg>
  );
}
