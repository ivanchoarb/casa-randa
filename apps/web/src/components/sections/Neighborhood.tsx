"use client";

import Image from "next/image";
import { DIST } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useInView } from "@/lib/useInView";
import { Reveal } from "@/components/ui/Reveal";

const MAX_KM = Math.max(...DIST.map((d) => d.km));

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
    es: "El tratado Hay–Bunau–Varilla crea la Zona del Canal, una franja bajo administración estadounidense a ambos lados del cauce.",
    en: "The Hay–Bunau–Varilla Treaty creates the Canal Zone, a strip under U.S. administration on both sides of the channel.",
  },
  {
    yearEs: "1914",
    yearEn: "1914",
    es: "Se inaugura el Canal. Miles de familias llegan a operarlo y necesitan dónde vivir cerca de las esclusas.",
    en: "The Canal opens. Thousands of families arrive to run it and need housing near the locks.",
  },
  {
    yearEs: "1930–50",
    yearEn: "1930s–50s",
    es: "La Compañía del Canal construye barrios como Diablo Heights, Balboa y Ancón en las colinas cercanas: entablado de madera y ventanales pensados para el calor y las lluvias.",
    en: "The Canal Company builds townsites like Diablo Heights, Balboa and Ancón on the nearby hills: wood siding and big windows built for the heat and the rain.",
  },
  {
    yearEs: "1977",
    yearEn: "1977",
    es: "Los tratados Torrijos–Carter fijan la devolución del Canal a Panamá.",
    en: "The Torrijos–Carter Treaties set the Canal's return to Panama.",
  },
  {
    yearEs: "1999",
    yearEn: "1999",
    es: "Panamá toma control total del Canal. La antigua Zona, Diablo Heights incluido, se integra a la ciudad.",
    en: "Panama takes full control of the Canal. The old Zone, Diablo Heights included, becomes part of the city.",
  },
  {
    yearEs: "Hoy",
    yearEn: "Today",
    es: "El barrio es residencial y tranquilo; casas de la época, como esta, se conservan casi intactas.",
    en: "The neighborhood is quiet and residential; era houses like this one remain almost untouched.",
  },
] as const;

export function Neighborhood() {
  const { lang, t } = useLanguage();
  const { ref: historyRef, inView: historyVisible } = useInView<HTMLDivElement>(0.25);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-11 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <h2 className="text-fluid-h2 font-[var(--font-display)] font-bold">
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

      <div ref={historyRef} className="mt-16 border-t border-[var(--ink)]/10 pt-12">
        <Reveal>
          <p className="font-[var(--font-display)] text-xs font-semibold tracking-[0.14em] text-[var(--caoba)] uppercase">
            {lang === "es" ? "Un poco de historia" : "A little history"}
          </p>
          <h3 className="mt-2 font-[var(--font-display)] text-xl font-bold sm:text-2xl">
            {lang === "es" ? "De la Zona del Canal a un barrio de la ciudad" : "From the Canal Zone to a city neighborhood"}
          </h3>
        </Reveal>

        <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
          {HISTORY.map((h, i) => (
            <div key={h.yearEn}>
              <span className="block h-[3px] w-full bg-[var(--ink)]/10">
                <span
                  className={`score-bar-fill block h-full w-full bg-[var(--caoba)] ${historyVisible ? "is-filled" : ""}`}
                  style={{ transitionDelay: `${i * 90}ms` }}
                />
              </span>
              <b className="mt-3 block font-[var(--font-display)] text-xl font-bold tabular-nums text-[var(--caoba)] sm:text-2xl">
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
