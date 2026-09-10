"use client";

import Image from "next/image";
import { COMMON_EN, COMMON_ES, NOT_EN, NOT_ES } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { RoomsTable } from "@/components/sections/RoomsTable";
import { Reveal } from "@/components/ui/Reveal";

const GALLERY = [
  {
    src: "/images/cocina-comedor.jpg",
    alt: "Cocina abierta al comedor con pisos de caoba",
    caption: { es: "Cocina abierta al comedor", en: "Kitchen open to the dining room" },
    span: "col-span-12 aspect-[16/11] sm:col-span-7 sm:aspect-[16/10]",
  },
  {
    src: "/images/patio-cubierto.jpg",
    alt: "Patio cubierto iluminado de noche con mesa para el grupo",
    caption: { es: "Patio cubierto y área de BBQ", en: "Covered patio and barbecue" },
    span: "col-span-12 aspect-[16/11] sm:col-span-5 sm:aspect-[16/13]",
  },
  {
    src: "/images/habitacion-1-king.jpg",
    alt: "Habitación con cama king, baño privado y escritorio",
    caption: { es: "Habitación 1, cama king", en: "Room 1, king bed" },
    span: "col-span-6 aspect-square sm:col-span-4 sm:aspect-[4/3]",
  },
  {
    src: "/images/habitacion-individuales.jpg",
    alt: "Habitación con dos camas individuales",
    caption: { es: "Habitaciones de individuales", en: "Twin rooms" },
    span: "col-span-6 aspect-square sm:col-span-4 sm:aspect-[4/3]",
  },
  {
    src: "/images/balcon-hamaca.jpg",
    alt: "Balcón de madera con hamaca y sillas",
    caption: { es: "Balcón con hamaca", en: "Balcony with hammock" },
    span: "col-span-12 aspect-[4/3] sm:col-span-4",
  },
] as const;

export function House() {
  const { lang, t } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="grid gap-5 sm:grid-cols-2 sm:items-end">
        <h2 className="text-fluid-h2 font-[var(--font-display)] font-bold">
          {lang === "es" ? "Aquí nadie comparte nada" : "Nobody shares anything"}
        </h2>
        <p className="text-[var(--ink-2)]">
          {lang === "es"
            ? "Doce camas en seis habitaciones, cada una con baño propio, aire acondicionado, ventilador de techo, TV, minibar y escritorio con silla de oficina. La casa entera es suya: no hay otros huéspedes."
            : "Twelve beds across six rooms, each with its own bathroom, air conditioning, ceiling fan, TV, minibar and a desk with an office chair. The whole house is yours: there are no other guests."}
        </p>
      </Reveal>

      <Reveal className="mt-10" delayMs={100}>
        <RoomsTable />
      </Reveal>

      <Reveal className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-12">
        <div>
          <h3 className="font-[var(--font-display)] text-lg font-semibold">
            {lang === "es" ? "De su grupo y de nadie más" : "Shared by your group only"}
          </h3>
          <ul className="mt-3">
            {(lang === "es" ? COMMON_ES : COMMON_EN).map((item) => (
              <li key={item} className="border-b border-[var(--ink)]/10 py-2 first:border-t">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-[var(--font-display)] text-lg font-semibold">
            {lang === "es" ? "Lo que la casa no tiene" : "What the house does not have"}
          </h3>
          <ul className="mt-3">
            {(lang === "es" ? NOT_ES : NOT_EN).map((item) => (
              <li key={item} className="border-b border-[var(--ink)]/10 py-2 first:border-t">
                <span className="mr-2 text-[var(--caoba)]">—</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[var(--ink-2)]">
            {lang === "es"
              ? "Mejor saberlo antes de reservar que al llegar."
              : "Better to know before you book than after you arrive."}
          </p>
        </div>
      </Reveal>

      <Reveal scale className="mt-13 grid grid-cols-12 gap-2.5">
        {GALLERY.map((photo) => (
          <figure key={photo.src} className={`gallery-photo relative m-0 overflow-hidden bg-[var(--ink)]/5 ${photo.span}`}>
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pt-6 pb-2 font-[var(--font-display)] text-xs tracking-wide text-[var(--on-dark)]">
              {t(photo.caption)}
            </figcaption>
          </figure>
        ))}
      </Reveal>
    </div>
  );
}
