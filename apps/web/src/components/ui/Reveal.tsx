"use client";

import type { ReactNode } from "react";
import { useInView } from "@/lib/useInView";

/**
 * Wraps one content block (a heading+paragraph pair, a table, a gallery)
 * with a one-shot rise-and-fade (or scale-and-fade for photography) once
 * it scrolls into view. Deliberately block-level, not per-item — see the
 * .reveal / .reveal-scale rules in globals.css for why.
 */
export function Reveal({
  children,
  className = "",
  scale = false,
  delayMs = 0,
  threshold = 0.2,
}: {
  children: ReactNode;
  className?: string;
  scale?: boolean;
  delayMs?: number;
  /**
   * Fraction of the block's own height that must be on-screen at once to
   * trigger. The default (0.2) is fine for the short blocks Reveal usually
   * wraps, but breaks for a block that can grow arbitrarily tall (a
   * product grid, say) — past a certain height, no scroll position ever
   * shows 20% of it at once, so it never reveals at all. Pass a much
   * smaller value (e.g. 0.01) for anything whose height scales with a
   * list of unknown/growing length.
   */
  threshold?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(threshold);

  return (
    <div
      ref={ref}
      className={`${scale ? "reveal-scale" : "reveal"} ${inView ? "is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
