"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import type { Producto } from "@/lib/tienda";

export function Extras({ productos }: { productos: Producto[] }) {
  const { lang, money } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
        <Reveal>
          <h2 className="text-fluid-h2-sm font-[var(--font-display)] font-bold">
            {lang === "es" ? "Llegue a una casa ya surtida" : "Arrive to a house already stocked"}
          </h2>
          <p className="mt-3 text-[var(--ink-2)]">
            {lang === "es"
              ? "Elija el vino, el café y el desayuno antes de viajar y estarán en la cocina al llegar. La guía de Panamá que escribimos nosotros, con qué hacer, dónde comer y cómo llegar, va incluida con la reserva."
              : "Pick the wine, the coffee and the breakfast before you travel and it will be waiting in the kitchen. Our Panama guide — what to do, where to eat, how to get there — comes with the booking."}
          </p>
        </Reveal>
        <Reveal delayMs={120} className="flex flex-wrap gap-3">
          <Link
            href="/tienda"
            className="btn-sweep inline-flex items-center justify-center rounded-[1px] border border-[var(--ink)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold"
          >
            {lang === "es" ? "Ver la tienda" : "Open the shop"}
          </Link>
          <Link
            href="/que-hacer-en-panama"
            className="btn-sweep inline-flex items-center justify-center rounded-[1px] border border-[var(--ink)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold"
          >
            {lang === "es" ? "Ver la guía de Panamá" : "Open the Panama guide"}
          </Link>
        </Reveal>
      </div>

      {productos.length > 0 && (
        <Reveal delayMs={180} className="mt-10 grid gap-4 sm:grid-cols-3">
          {productos.map((p) => (
            <Link
              key={p.id}
              href="/tienda"
              className="group flex items-center gap-3 border border-[var(--ink)]/10 bg-[var(--panel)] p-3 transition-colors hover:border-[var(--caoba)]/40"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-[var(--ink)]/5">
                {p.imagen_url && (
                  <Image src={p.imagen_url} alt={p.nombre} fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-[var(--font-display)] text-sm font-semibold">{p.nombre}</p>
                <p className="text-sm text-[var(--caoba)]">{money(p.precio)}</p>
              </div>
            </Link>
          ))}
        </Reveal>
      )}
    </div>
  );
}
