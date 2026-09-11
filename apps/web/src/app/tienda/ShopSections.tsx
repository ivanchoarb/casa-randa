"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { PRODUCTS } from "./content";

export function ShopSections() {
  const { lang, t, money } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <div key={t(p.nombre)} className="border border-[var(--ink)]/10 bg-[var(--panel)] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-[var(--font-display)] text-base font-semibold">{t(p.nombre)}</h3>
              <span className="font-[var(--font-display)] font-semibold tabular-nums text-[var(--caoba)]">
                {money(p.precio)}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-2)]">{t(p.descripcion)}</p>
          </div>
        ))}
      </Reveal>

      <Reveal
        delayMs={100}
        className="mt-14 border-t-4 border-[var(--lamp-fill)] bg-[var(--night)] px-6 py-8 text-center text-[var(--on-dark)] sm:px-10"
      >
        <h2 className="font-[var(--font-display)] text-xl font-bold">
          {lang === "es" ? "La compra se habilita con reserva confirmada" : "Purchases open up once your booking is confirmed"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--on-dark-2)]">
          {lang === "es"
            ? "Así lo hacemos siempre: sin compras sueltas, todo pedido va ligado a una estadía. Cotice sus fechas y, una vez confirmada la reserva, le abrimos el pedido para que elija lo que quiere encontrar al llegar."
            : "That's how we run it: no standalone purchases — every order is tied to a stay. Get a quote for your dates, and once the booking is confirmed we'll open the order so you can pick what you want waiting for you."}
        </p>
        <MagneticLink
          href="/#reservar"
          className="mt-6 inline-flex items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[#f0ce86]"
        >
          {lang === "es" ? "Ver fechas y cotizar" : "Check dates and get a quote"}
        </MagneticLink>
      </Reveal>
    </div>
  );
}
