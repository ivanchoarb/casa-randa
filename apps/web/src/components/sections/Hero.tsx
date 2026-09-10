"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function Hero() {
  const { lang } = useLanguage();

  const heading =
    lang === "es"
      ? ["Seis habitaciones.", "Seis baños.", "Una sola llave."]
      : ["Six bedrooms.", "Six bathrooms.", "One key."];

  const sub =
    lang === "es"
      ? "Una casa de la antigua Zona del Canal en Diablo Heights, que se alquila entera y solo a su grupo. Catorce duermen cómodos, dieciséis como máximo."
      : "A former Canal Zone house in Diablo Heights, rented whole and only to your group. Fourteen sleep comfortably, sixteen at most.";

  const facts =
    lang === "es"
      ? [
          ["6", "habitaciones"],
          ["6", "baños privados"],
          ["12", "camas"],
          ["14", "huéspedes cómodos, 16 máximo"],
        ]
      : [
          ["6", "bedrooms"],
          ["6", "private bathrooms"],
          ["12", "beds"],
          ["14", "guests, 16 at most"],
        ];

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/sala-principal.jpg"
          alt="Sala principal de Casa Randa con ventanales de madera hacia el jardín"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[var(--night)]/60" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-28 text-[var(--panel)] sm:py-36">
        <h1 className="font-[var(--font-display)] text-4xl leading-tight font-semibold sm:text-6xl">
          {heading.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-xl text-lg opacity-90">{sub}</p>

        <ul className="mt-10 flex flex-wrap gap-8">
          {facts.map(([num, label]) => (
            <li key={label}>
              <b className="block text-3xl font-[var(--font-display)]">{num}</b>
              <span className="text-sm opacity-80">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
