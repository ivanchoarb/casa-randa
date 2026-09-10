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
}: {
  children: ReactNode;
  className?: string;
  scale?: boolean;
  delayMs?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);

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
