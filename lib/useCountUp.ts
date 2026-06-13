"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animate a number from 0 to `target` once on mount (or when target changes).
 * Uses an ease-out curve and respects prefers-reduced-motion.
 */
export function useCountUp(target: number, durationMs = 1100, delayMs = 0): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }

    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const elapsed = t - start;
      if (elapsed < delayMs) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, (elapsed - delayMs) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, durationMs, delayMs]);

  return value;
}
