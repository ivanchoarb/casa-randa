"use client";

import { useEffect, useRef, useState } from "react";
import { COMMON_EN, COMMON_ES } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";

// ── spring physics ────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const springOf = (tune: number) => ({
  k: 0.08 + (tune / 100) * 0.16,
  d: 0.62 + (tune / 100) * 0.2,
});

function useSpring(target: number, tune = 50, instant = false) {
  const [at, setAt] = useState(target);
  const cur = useRef(target);
  const vel = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    if (instant) {
      cur.current = target;
      vel.current = 0;
      setAt(target);
      return;
    }
    const { k, d } = springOf(tune);
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      vel.current += (target - cur.current) * k * dt;
      vel.current *= Math.pow(d, dt);
      cur.current += vel.current * dt;
      if (Math.abs(target - cur.current) < 0.02 && Math.abs(vel.current) < 0.02) {
        cur.current = target;
        vel.current = 0;
        setAt(target);
        raf.current = 0;
        return;
      }
      setAt(cur.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [target, tune, instant]);

  return at;
}

const lift = (open: number) => 0.4 + (clamp(open, 0, 100) / 100) * 2.8;
const fall = (d: number, reach: number) => {
  const s = 0.35 + (clamp(reach, 0, 100) / 100) * 0.9;
  return Math.exp(-((d / s) ** 2));
};

const GALLERY_H = 400;
const RMAX = 12;

const GALLERY_PHOTOS = [
  { src: "/images/cocina-comedor.jpg",      alt: "Cocina abierta al comedor con pisos de caoba" },
  { src: "/images/patio-cubierto.jpg",       alt: "Patio cubierto iluminado de noche" },
  { src: "/images/habitacion-1-king.jpg",    alt: "Habitación con cama king y baño privado" },
  { src: "/images/habitacion-individuales.jpg", alt: "Habitación con dos camas individuales" },
  { src: "/images/balcon-hamaca.jpg",        alt: "Balcón de madera con hamaca" },
];

function GalleryAccordion() {
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  const still =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
    ro.observe(el);
    setW(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const gap = 8;
  const k = lift(50);
  const want = (i: number) =>
    hovered === null ? 0 : fall(Math.abs(i - hovered), 35) * 100;

  const a0 = useSpring(want(0), 10, still);
  const a1 = useSpring(want(1), 10, still);
  const a2 = useSpring(want(2), 10, still);
  const a3 = useSpring(want(3), 10, still);
  const a4 = useSpring(want(4), 10, still);
  const swell = [a0, a1, a2, a3, a4];

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="acc"
        style={{ width: w, height: GALLERY_H, gap, borderRadius: Math.min(RMAX, gap) }}
        onPointerOut={(e) => {
          const to = e.relatedTarget as Node | null;
          if (!to || !e.currentTarget.contains(to)) setHovered(null);
        }}
        onPointerCancel={() => setHovered(null)}
      >
        {GALLERY_PHOTOS.map((photo, i) => (
          <div
            key={photo.src}
            className="acc-cell"
            style={{
              flexGrow: 1 + k * (swell[i] / 100),
              borderRadius: Math.min(RMAX, gap),
            }}
            onPointerEnter={() => { if (hovered !== i) setHovered(i); }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.src} alt={photo.alt} draggable={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── section ───────────────────────────────────────────────────────────────────
export function House() {
  const { lang } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="grid gap-5 sm:grid-cols-2 sm:items-end">
        <h2 className="text-fluid-h2 font-[family-name:var(--font-display)] font-bold">
          {lang === "es" ? "Aquí nadie comparte nada" : "Nobody shares anything"}
        </h2>
        <p className="text-[var(--ink-2)]">
          {lang === "es"
            ? "Seis habitaciones, todas con baño propio. La casa completa es de ustedes — nadie más se hospeda aquí."
            : "Six bedrooms, each with its own bathroom. The whole house is yours — no other guests."}
        </p>
      </Reveal>

      <Reveal className="mt-4" delayMs={100}>
        <p className="text-sm text-[var(--ink-2)]">
          {lang === "es"
            ? "Capacidad cómoda para 14 personas; los huéspedes 15 y 16 duermen en camas adicionales, con un cargo de 40 USD por persona y noche."
            : "Comfortable for 14; guests 15 and 16 sleep on extra beds, at $40 per person per night."}
        </p>
      </Reveal>

      <Reveal className="mt-12" threshold={0.05}>
        <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--caoba)]">
          {lang === "es" ? "De su grupo y de nadie más" : "Your group only"}
        </h3>
        <ul className="mt-5 grid grid-cols-1 gap-x-16 border-t border-[var(--ink)]/8 sm:grid-cols-2">
          {(lang === "es" ? COMMON_ES : COMMON_EN).map((item, i) => (
            <li
              key={item}
              className="amenity-item flex items-start gap-3 border-b border-[var(--ink)]/8 py-4"
              style={{ "--stagger": i } as React.CSSProperties}
            >
              <span
                className="mt-[0.45em] h-1.5 w-1.5 flex-none rounded-full bg-[var(--caoba)]"
                aria-hidden
              />
              <span className="text-[var(--ink)]">{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-13" threshold={0.05}>
        <GalleryAccordion />
      </Reveal>
    </div>
  );
}
