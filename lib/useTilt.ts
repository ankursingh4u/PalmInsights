"use client";

import { useRef } from "react";

/**
 * Subtle 3D hover tilt for cards. Pointer-tracking only (no effect on touch),
 * and a no-op for users who prefer reduced motion.
 */
export function useTilt(max = 5) {
  const ref = useRef<HTMLDivElement>(null);

  function reduced() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  }

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || reduced()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
  }

  function onMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  const style: React.CSSProperties = {
    transform:
      "perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
    transition: "transform 0.18s ease-out",
    transformStyle: "preserve-3d",
  };

  return { ref, onMouseMove, onMouseLeave, style };
}
