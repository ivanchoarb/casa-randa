"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import type { Producto } from "@/lib/tienda";

export function Extras({ productos }: { productos: Producto[] }) {
  const { lang, money } = useLanguage();
  const carruselRef = useRef<HTMLDivElement>(null);

  function desplazar(direccion: 1 | -1) {
    const el = carruselRef.current;
    if (!el) return;
    el.scrollBy({ left: direccion * (el.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
          <Reveal>
            <h2 className="text-fluid-h2-sm font-[family-name:var(--font-display)] font-bold">
              {lang === "es" ? "Llegue a una casa ya surtida" : "Arrive to a house already stocked"}
            </h2>
            <p className="mt-3 text-[var(--ink-2)]">
              {lang === "es"
                ? "Elija el vino, el café y el desayuno antes de viajar — estarán en la cocina al llegar. La guía de Panamá va incluida con la reserva."
                : "Pick the wine, coffee and breakfast before you travel — they'll be waiting in the kitchen. Our Panama guide comes with the booking."}
            </p>
          </Reveal>
          <Reveal delayMs={120} className="flex flex-wrap gap-3">
            <Link
              href="/tienda"
              className="btn-sweep inline-flex items-center justify-center rounded-full border border-[var(--ink)] px-5 py-2.5 font-[family-name:var(--font-display)] text-sm font-semibold"
            >
              {lang === "es" ? "Ver la tienda" : "Open the shop"}
            </Link>
            <Link
              href="/que-hacer-en-panama"
              className="btn-sweep inline-flex items-center justify-center rounded-full border border-[var(--ink)] px-5 py-2.5 font-[family-name:var(--font-display)] text-sm font-semibold"
            >
              {lang === "es" ? "Ver la guía de Panamá" : "Open the Panama guide"}
            </Link>
          </Reveal>
        </div>

        {productos.length > 0 && (
          <Reveal delayMs={180} className="relative mt-10">
            <div
              ref={carruselRef}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {productos.map((p) => (
                <Link
                  key={p.id}
                  href="/tienda"
                  className="group w-44 shrink-0 snap-start sm:w-52"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-white">
                    {p.imagen_url && (
                      <Image src={p.imagen_url} alt={p.nombre} fill sizes="208px" className="object-contain p-3" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 min-h-[2.5rem] font-[family-name:var(--font-display)] text-sm font-semibold">
                      {p.nombre}
                    </p>
                    <p className="mt-1 text-sm text-[var(--caoba)]">{money(p.precio)}</p>
                  </div>
                </Link>
              ))}
            </div>

            {productos.length > 2 && (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => desplazar(-1)}
                  aria-label={lang === "es" ? "Ver anteriores" : "See previous"}
                  className="flex h-9 w-9 items-center justify-center border border-[var(--ink)]/25 font-[family-name:var(--font-display)] transition-colors hover:border-[var(--caoba)]"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => desplazar(1)}
                  aria-label={lang === "es" ? "Ver siguientes" : "See next"}
                  className="flex h-9 w-9 items-center justify-center border border-[var(--ink)]/25 font-[family-name:var(--font-display)] transition-colors hover:border-[var(--caoba)]"
                >
                  ›
                </button>
              </div>
            )}
          </Reveal>
        )}
      </div>
    </div>
  );
}
