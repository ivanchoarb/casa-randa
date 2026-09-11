"use client";

import { DIST } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { HIGHLIGHTS } from "./content";

function distanceFor(distKey: string) {
  return DIST.find((d) => d.es === distKey)?.km;
}

export function GuideSections() {
  const { lang } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {HIGHLIGHTS.map((h) => {
          const km = distanceFor(h.distKey);
          return (
            <div key={h.es} className="border-t-2 border-[var(--caoba)] pt-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-[var(--font-display)] text-lg font-semibold">{lang === "es" ? h.es : h.en}</h3>
                {km !== undefined && (
                  <span className="font-[var(--font-display)] text-sm font-semibold tabular-nums text-[var(--caoba)]">
                    {km.toString().replace(".", lang === "es" ? "," : ".")} km
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--ink-2)]">{lang === "es" ? h.descEs : h.descEn}</p>
            </div>
          );
        })}
      </Reveal>

      <Reveal delayMs={100} className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="font-[var(--font-display)] text-2xl font-bold">
            {lang === "es" ? "Cómo llegar" : "Getting here"}
          </h2>
          <p className="mt-3 text-[var(--ink-2)]">
            {lang === "es"
              ? "El Aeropuerto de Albrook, para vuelos domésticos y algunas rutas regionales, está a 1,3 km de la casa. El Aeropuerto Internacional de Tocumen, donde llegan la mayoría de los vuelos internacionales, está a 23,1 km, entre 30 y 50 minutos según el tráfico."
              : "Albrook airport, for domestic flights and a few regional routes, is 1.3 km from the house. Tocumen International Airport, where most international flights land, is 23.1 km away — 30 to 50 minutes depending on traffic."}
          </p>
          <p className="mt-3 text-[var(--ink-2)]">
            {lang === "es"
              ? "Dentro de la ciudad, las aplicaciones de transporte funcionan bien y son la forma más simple de moverse: no hace falta alquilar un carro para este itinerario."
              : "Ride-hailing apps work well within the city and are the simplest way to get around — no need to rent a car for this itinerary."}
          </p>
        </div>
        <div>
          <h2 className="font-[var(--font-display)] text-2xl font-bold">
            {lang === "es" ? "Dónde comer" : "Where to eat"}
          </h2>
          <p className="mt-3 text-[var(--ink-2)]">
            {lang === "es"
              ? "Panamá cambia rápido: preferimos no imprimir aquí una lista de restaurantes que se desactualice. Al confirmar la reserva le compartimos, por WhatsApp, las recomendaciones vigentes cerca de la casa y de cada punto de esta guía, según lo que busque su grupo."
              : "Panama changes fast, so we'd rather not print a restaurant list here that goes stale. Once your booking is confirmed, we share current recommendations over WhatsApp — near the house and near each stop on this guide — based on what your group is looking for."}
          </p>
        </div>
      </Reveal>

      <Reveal delayMs={150} className="mt-16 border-t border-[var(--ink)]/10 pt-10 text-center">
        <p className="mx-auto max-w-xl text-[var(--ink-2)]">
          {lang === "es"
            ? "Esta es la versión corta. La guía completa, con horarios y la reserva de las esclusas si aplica, va incluida cuando confirma sus fechas."
            : "This is the short version. The full guide — with hours, and the locks viewing schedule if it applies — comes with your confirmed booking."}
        </p>
        <MagneticLink
          href="/#reservar"
          className="mt-5 inline-flex items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[#f0ce86]"
        >
          {lang === "es" ? "Ver fechas y cotizar" : "Check dates and get a quote"}
        </MagneticLink>
      </Reveal>
    </div>
  );
}
