"use client";

import { useRef, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";

/**
 * A CTA link that leans gently toward the cursor on hover, springs back
 * on release, and compresses slightly under a press — the primary
 * buttons' signature interaction. No-ops on touch/coarse-pointer devices
 * and under prefers-reduced-motion.
 */
export function MagneticLink({ className = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const ref = useRef<HTMLAnchorElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false);

  function canMove() {
    return (
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function apply(el: HTMLAnchorElement, scale: number) {
    el.style.transform = `translate(${offset.current.x}px, ${offset.current.y}px) scale(${scale})`;
  }

  function handleMove(event: MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el || !canMove()) return;
    const rect = el.getBoundingClientRect();
    offset.current = { x: (event.clientX - rect.left - rect.width / 2) * 0.25, y: (event.clientY - rect.top - rect.height / 2) * 0.3 };
    el.style.transition = "transform 0.15s ease-out";
    apply(el, pressed ? 0.96 : 1);
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    setPressed(false);
    offset.current = { x: 0, y: 0 };
    el.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
    el.style.transform = "translate(0, 0) scale(1)";
  }

  function handleDown() {
    const el = ref.current;
    if (!el) return;
    setPressed(true);
    el.style.transition = "transform 0.12s ease-out";
    apply(el, 0.96);
  }

  function handleUp() {
    const el = ref.current;
    if (!el) return;
    setPressed(false);
    el.style.transition = "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)";
    apply(el, 1);
  }

  return (
    <a
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}
