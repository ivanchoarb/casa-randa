"use client";

import Image from "next/image";
import { DIST } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Well-documented, uncontroversial Canal Zone milestones — deliberately
 * not pinning an exact founding year on Diablo Heights itself, since that
 * specific date isn't confidently sourced; framed instead around the
 * broader Canal Zone housing program it was part of.
 */
const HISTORY = [
  {
    yearEs: "1903",
    yearEn: "1903",
    es: "El tratado Hay–Bunau–Varilla crea la Zona del Canal.",
    en: "The Hay–Bunau–Varilla Treaty creates the Canal Zone.",
  },
  {
    yearEs: "1914",
    yearEn: "1914",
    es: "Se inaugura el Canal; llegan miles de familias a operarlo.",
    en: "The Canal opens; thousands of families arrive to run it.",
  },
  {
    yearEs: "1930–50",
    yearEn: "1930s–50s",
    es: "El Canal construye Diablo Heights y barrios vecinos: madera pensada para el clima.",
    en: "The Canal builds Diablo Heights and nearby townsites: wood built for the climate.",
  },
  {
    yearEs: "1977",
    yearEn: "1977",
    es: "Los tratados Torrijos–Carter fijan la devolución del Canal.",
    en: "The Torrijos–Carter Treaties set the Canal's return.",
  },
  {
    yearEs: "1999",
    yearEn: "1999",
    es: "Panamá toma control del Canal; Diablo Heights se integra a la ciudad.",
    en: "Panama takes control of the Canal; Diablo Heights becomes part of the city.",
  },
  {
    yearEs: "Hoy",
    yearEn: "Today",
    es: "Barrio residencial y tranquilo; la casa se conserva casi intacta.",
    en: "A quiet residential neighborhood; the house remains almost untouched.",
  },
] as const;

export function Neighborhood() {
  const { lang, t } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-11 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <h2 className="text-fluid-h2 font-[var(--font-display)] font-bold">
            {lang === "es" ? "Diablo Heights, la antigua Zona del Canal" : "Diablo Heights, the old Canal Zone"}
          </h2>
          <p className="mt-4 text-[var(--ink-2)]">
            {lang === "es"
              ? "Una de las quintas de madera que el Canal levantó sobre las esclusas: entablado verde, pisos de caoba. Un barrio residencial entre el Canal y la ciudad vieja."
              : "One of the wooden quarters the Canal built above the locks: sage siding, mahogany floors. A residential neighborhood between the Canal and the old city."}
          </p>

          <ul className="mt-6 max-w-xl">
            {DIST.map((d) => (
              <li key={d.es} className="flex items-baseline gap-3 border-b border-[var(--ink)]/10 py-2.5">
                <span className="flex-1">{t(d)}</span>
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
        </Reveal>

        <Reveal scale delayMs={150} className="relative aspect-[4/3] overflow-hidden">
          <Image
            src="/images/fachada-diablo-heights.jpg"
            alt="Fachada de madera de Casa Randa en Diablo Heights, con entablado verde y cerca de caoba"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="scroll-scale-img object-cover"
          />
        </Reveal>
      </div>

      <div className="mt-16 border-t border-[var(--ink)]/10 pt-12">
        <Reveal>
          <h3 className="font-[var(--font-display)] text-xl font-bold sm:text-2xl">
            {lang === "es" ? "De la Zona del Canal a un barrio de la ciudad" : "From the Canal Zone to a city neighborhood"}
          </h3>
        </Reveal>

        <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
          {HISTORY.map((h) => (
            <div key={h.yearEn} className="border-t-[3px] border-[var(--caoba)] pt-3">
              <b className="block font-[var(--font-display)] text-xl font-bold tabular-nums text-[var(--caoba)] sm:text-2xl">
                {lang === "es" ? h.yearEs : h.yearEn}
              </b>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{lang === "es" ? h.es : h.en}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
