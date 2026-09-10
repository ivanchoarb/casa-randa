"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * True once the ref'd element has scrolled into view; stays true after
 * (the observer disconnects on first intersection — this is a one-shot
 * reveal trigger, not a continuous visibility tracker).
 */
export function useInView<T extends HTMLElement>(threshold = 0.35): { ref: RefObject<T | null>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
