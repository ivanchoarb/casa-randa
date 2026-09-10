"use client";

import { useEffect, useState } from "react";

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Counts from 0 up to `target` once `start` is true, eased out over
 * `duration`ms. Callers pass a `start` that only ever goes false→true
 * once (e.g. useInView's one-shot `inView`), so this doesn't need its
 * own "already ran" guard — one would only reintroduce the classic bug
 * where React's dev-mode double-effect cancels the first run's rAF loop
 * and then skips starting a second one.
 */
export function useCountUp(target: number, start: boolean, duration = 1200): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startTime = performance.now();
    let raf: number;

    function tick(now: number) {
      const t = reducedMotion ? 1 : Math.min(1, (now - startTime) / duration);
      setValue(target * easeOutExpo(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);

  return value;
}
