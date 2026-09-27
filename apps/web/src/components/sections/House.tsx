"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { COMMON_EN, COMMON_ES } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";

// One simple line-icon per COMMON_ES/COMMON_EN entry, same index order —
// gives the amenities list a visual anchor per row instead of nine stacked
// sentences of plain text. Hand-picked to match each fact, not decorative.
const AMENITY_ICONS: ReactNode[] = [
  // Cocina (estufa)
  <path key="cocina" d="M4 10a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9ZM9 5v4M15 5v4M9 15h.01M15 15h.01" />,
  // Sala principal (sofá)
  <path key="sala" d="M4 18v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M3 18h18M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />,
  // Segunda sala (sillón con brazos)
  <path key="segunda-sala" d="M7 19v-7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v7M5 19h14M5 13H3v4h2M21 13h-2v4h2" />,
  // Comedor (mesa)
  <path key="comedor" d="M3 8h18M6 8v11M18 8v11" />,
  // Balcón con hamaca
  <path key="balcon" d="M3 9c3 3 15 3 18 0M3 9v10M21 9v10M7 14c2-1 8-1 10 0" />,
  // Patio / BBQ (parrilla)
  <path key="patio" d="M5 13a7 7 0 0 1 14 0v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1ZM9 21l1-5M15 21l-1-5" />,
  // Lavandería
  <path key="lavanderia" d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM7 6h.01" />,
  // Estacionamiento
  <path key="parking" d="M5 21V3h6a4 4 0 0 1 0 8H5" />,
  // Internet
  <path key="wifi" d="M3 8.5a13 13 0 0 1 18 0M6.5 12a8 8 0 0 1 11 0M10 15.5a3 3 0 0 1 4 0M12 19h.01" />,
];

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
            ? "Seis habitaciones, todas con baño propio. La casa completa es de ustedes — nadie más se hospeda aquí."
            : "Six bedrooms, each with its own bathroom. The whole house is yours — no other guests."}
        </p>
      </Reveal>

      <Reveal className="mt-4" delayMs={100}>
        <p className="text-sm text-[var(--ink-2)]">
          {lang === "es"
            ? "Capacidad cómoda para 14 personas; los huéspedes 15 y 16 duermen en camas adicionales, con un cargo de 40 USD por persona y noche."
            : "Comfortable for 14; guests 15 and 16 sleep on extra beds, at $40 per person per night."}
        </p>
      </Reveal>

      <Reveal className="mt-12">
        <h3 className="font-[var(--font-display)] text-lg font-semibold">
          {lang === "es" ? "De su grupo y de nadie más" : "Shared by your group only"}
        </h3>
        <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
          {(lang === "es" ? COMMON_ES : COMMON_EN).map((item, i) => (
            <li key={item} className="flex items-start gap-3">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-6 w-6 flex-none text-[var(--caoba)]"
                aria-hidden
              >
                {AMENITY_ICONS[i]}
              </svg>
              <span className="text-sm text-[var(--ink-2)]">{item}</span>
            </li>
          ))}
        </ul>
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
