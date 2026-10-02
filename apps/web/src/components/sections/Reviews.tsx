"use client";

import { SCORES } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useInView } from "@/lib/useInView";
import { useCountUp } from "@/lib/useCountUp";
import { Reveal } from "@/components/ui/Reveal";

interface Testimonial {
  name: string;
  place: string;
  rating: number;
  es: string;
  en: string;
}

// Citas reales de Airbnb, traducidas/recortadas para la tarjeta — no se
// inventa contenido, solo se acorta. Actualizar a mano cuando Ivan mande
// capturas nuevas (ver docs/coordinacion-agentes.md).
const TESTIMONIALS: Testimonial[] = [
  {
    name: "Nestor",
    place: "Waldwick, Nueva Jersey",
    rating: 5,
    es: "Diana fue muy amable, servicial y fácil de tratar. El alojamiento estaba limpio, cómodo, y me sentí como en casa. Sin duda me hospedaría aquí de nuevo.",
    en: "Diana was very kind, helpful and easy to deal with. The place was clean, comfortable, and I felt right at home. I'd definitely stay here again.",
  },
  {
    name: "Tonisha",
    place: "Bloomfield, Connecticut",
    rating: 4,
    es: "La casa era preciosa, espaciosa y cómoda, y la zona tranquila y apacible. La anfitriona fue extremadamente complaciente y fácil de contactar durante toda la estadía. Cada habitación tenía baño privado.",
    en: "The house was beautiful, spacious and comfortable, and the area was quiet and peaceful. The host was extremely accommodating and easy to reach throughout our stay. Every room had its own bathroom.",
  },
  {
    name: "Naia",
    place: "España",
    rating: 5,
    es: "Fue increíble venir a compartir en esta casa. La pasamos increíble y pudimos disfrutar y descansar cómodamente. ¡100/100, volveremos el próximo año si nos lo permiten!",
    en: "It was amazing to come share this house. We had an incredible time and could enjoy and rest comfortably. 100/100, we'll be back next year if they let us!",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-hidden="true" className="font-[family-name:var(--font-display)] text-sm tracking-wide">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-[var(--lamp-fill)]" : "text-[var(--on-dark-2)]/30"}>
          ★
        </span>
      ))}
    </div>
  );
}

export function Reviews() {
  const { lang, t } = useLanguage();
  const { ref: barsRef, inView: filled } = useInView<HTMLDivElement>(0.35);
  const score = useCountUp(4.89, filled, 1300);

  return (
    <div className="bg-[var(--night)] text-[var(--on-dark)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="grid gap-5 sm:grid-cols-2 sm:items-end">
          <h2 className="text-fluid-h2 font-[family-name:var(--font-display)] font-bold">
            {lang === "es" ? "Lo que dijeron diecinueve grupos" : "What nineteen groups said"}
          </h2>
          <p className="text-[var(--on-dark-2)]">
            {lang === "es"
              ? "Calificaciones de Airbnb, donde Diana es Superanfitriona hace tres años. Marquelda recibe en la puerta."
              : "Ratings from Airbnb, where Diana has been a Superhost for three years. Marquelda meets guests at the door."}
          </p>
        </Reveal>

        <div className="mt-10 flex flex-wrap items-end gap-10 sm:gap-13">
          <div className="font-[family-name:var(--font-display)] text-7xl leading-none font-bold tabular-nums text-[var(--lamp-fill)] sm:text-8xl">
            {score.toFixed(2).replace(".", lang === "es" ? "," : ".")}
            <small className="mt-3 block font-[family-name:var(--font-display)] text-sm font-medium tracking-wide text-[var(--on-dark-2)]">
              {lang === "es" ? "19 reseñas en Airbnb" : "19 reviews on Airbnb"}
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
                <span className="text-right font-[family-name:var(--font-display)] tabular-nums">
                  {s.v.toFixed(1).replace(".", lang === "es" ? "," : ".")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <div key={item.name} className="rounded-[1px] border border-[var(--on-dark-2)]/20 bg-[var(--night-2)] p-5">
              <Stars rating={item.rating} />
              <p className="mt-3 text-sm leading-relaxed text-[var(--on-dark-2)]">
                {lang === "es" ? item.es : item.en}
              </p>
              <p className="mt-4 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--on-dark)]">
                {item.name}
                <span className="font-normal text-[var(--on-dark-2)]"> · {item.place}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
