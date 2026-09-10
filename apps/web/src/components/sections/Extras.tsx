"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function Extras() {
  const { lang } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
        <div>
          <h2 className="font-[var(--font-display)] text-2xl font-bold sm:text-3xl">
            {lang === "es" ? "Llegue a una casa ya surtida" : "Arrive to a house already stocked"}
          </h2>
          <p className="mt-3 text-[var(--ink-2)]">
            {lang === "es"
              ? "Elija el vino, el café y el desayuno antes de viajar y estarán en la cocina al llegar. La guía de Panamá que escribimos nosotros, con qué hacer, dónde comer y cómo llegar, va incluida con la reserva."
              : "Pick the wine, the coffee and the breakfast before you travel and it will be waiting in the kitchen. Our Panama guide — what to do, where to eat, how to get there — comes with the booking."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-[1px] border border-[var(--ink)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold hover:bg-[var(--ink)]/10"
          >
            {lang === "es" ? "Ver la tienda" : "Open the shop"}
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-[1px] border border-[var(--ink)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold hover:bg-[var(--ink)]/10"
          >
            {lang === "es" ? "Ver la guía de Panamá" : "Open the Panama guide"}
          </a>
        </div>
      </div>
    </div>
  );
}
