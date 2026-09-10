"use client";

import { SCORES } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useInView } from "@/lib/useInView";
import { useCountUp } from "@/lib/useCountUp";
import { Reveal } from "@/components/ui/Reveal";

export function Reviews() {
  const { lang, t } = useLanguage();
  const { ref: barsRef, inView: filled } = useInView<HTMLDivElement>(0.35);
  const score = useCountUp(4.94, filled, 1300);

  return (
    <div className="bg-[var(--night)] text-[var(--on-dark)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="grid gap-5 sm:grid-cols-2 sm:items-end">
          <h2 className="text-fluid-h2 font-[var(--font-display)] font-bold">
            {lang === "es" ? "Lo que dijeron dieciséis grupos" : "What sixteen groups said"}
          </h2>
          <p className="text-[var(--on-dark-2)]">
            {lang === "es"
              ? "Calificaciones de Airbnb, donde Diana lleva tres años como Superanfitriona y el anuncio tiene el distintivo Favorito entre huéspedes. Marquelda recibe en la puerta; la cerradura inteligente es el respaldo para llegadas tardías."
              : "Ratings from Airbnb, where Diana has hosted for three years as a Superhost and the listing carries the Guest Favourite badge. Marquelda meets guests at the door; the smart lock is the backup for late arrivals."}
          </p>
        </Reveal>

        <div className="mt-10 flex flex-wrap items-end gap-10 sm:gap-13">
          <div className="font-[var(--font-display)] text-7xl leading-none font-bold tabular-nums text-[var(--lamp-fill)] sm:text-8xl">
            {score.toFixed(2).replace(".", lang === "es" ? "," : ".")}
            <small className="mt-3 block font-[var(--font-display)] text-sm font-medium tracking-wide text-[var(--on-dark-2)]">
              {lang === "es" ? "16 reseñas en Airbnb" : "16 reviews on Airbnb"}
            </small>
          </div>

          <div ref={barsRef} className="grid min-w-[260px] flex-1 gap-2">
            {SCORES.map((s, i) => (
              <div key={s.es} className="grid grid-cols-[9.5rem_1fr_2.4rem] items-center gap-3 text-sm">
                <b className="font-normal text-[var(--on-dark-2)]">{t(s)}</b>
                <span className="relative h-[5px] overflow-hidden bg-[var(--on-dark-2)]/25">
                  <span
                    className={`score-bar-fill absolute inset-y-0 left-0 ${s.v === 5 ? "bg-[var(--lamp-fill)]" : "bg-[var(--on-dark-2)]"} ${filled ? "is-filled" : ""}`}
                    style={{ width: `${((s.v - 4.5) / 0.5) * 100}%`, transitionDelay: `${i * 90}ms` }}
                  />
                </span>
                <span className="text-right font-[var(--font-display)] tabular-nums">
                  {s.v.toFixed(1).replace(".", lang === "es" ? "," : ".")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
