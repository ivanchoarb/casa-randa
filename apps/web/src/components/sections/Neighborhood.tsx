"use client";

import Image from "next/image";
import { DIST } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const MAX_KM = Math.max(...DIST.map((d) => d.km));

export function Neighborhood() {
  const { lang, t } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-11 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="font-[var(--font-display)] text-3xl font-bold sm:text-4xl">
            {lang === "es" ? "Diablo Heights, la antigua Zona del Canal" : "Diablo Heights, the old Canal Zone"}
          </h2>
          <p className="mt-4 text-[var(--ink-2)]">
            {lang === "es"
              ? "La casa es una de las quintas de madera que la administración del Canal levantó en las colinas sobre las esclusas: entablado verde, molduras blancas, pisos de caoba y ventanas que dan a los árboles. Es un barrio residencial, no una zona hotelera, y está entre el Canal y la ciudad vieja."
              : "The house is one of the wooden quarters the Canal administration built on the hills above the locks: sage siding, white trim, mahogany floors and windows that open onto the trees. It is a residential township, not a hotel strip — and it sits between the Canal and the old city."}
          </p>

          <ul className="mt-6 max-w-xl">
            {DIST.map((d) => (
              <li key={d.es} className="flex items-baseline gap-3 border-b border-[var(--ink)]/10 py-2.5">
                <span className="flex-1">{t(d)}</span>
                <span className="h-0.5 w-24 flex-none bg-[var(--ink)]/15">
                  <span
                    className="block h-full bg-[var(--caoba)]"
                    style={{ width: `${Math.max(4, Math.round(Math.sqrt(d.km / MAX_KM) * 100))}%` }}
                  />
                </span>
                <span className="font-[var(--font-display)] font-semibold tabular-nums text-[var(--caoba)]">
                  {d.km.toString().replace(".", lang === "es" ? "," : ".")} km
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[var(--ink-2)]">
            {lang === "es"
              ? "Distancias en línea recta desde la casa, en Calle Hecker 5624."
              : "Straight-line distances from the house at Calle Hecker 5624."}
          </p>
        </div>

        <figure className="relative m-0 aspect-[4/3] overflow-hidden">
          <Image
            src="/images/fachada-diablo-heights.jpg"
            alt="Fachada de madera de Casa Randa en Diablo Heights, con entablado verde y cerca de caoba"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="scroll-scale-img object-cover"
          />
        </figure>
      </div>
    </div>
  );
}
