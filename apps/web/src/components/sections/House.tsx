"use client";

import { COMMON_EN, COMMON_ES } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import { LightboxGallery } from "@/components/ui/LightboxGallery";

const GALLERY_PHOTOS = [
  { src: "/images/cocina-comedor.jpg",         width: 980, height: 735, alt: "Cocina abierta al comedor con pisos de caoba" },
  { src: "/images/patio-cubierto.jpg",          width: 980, height: 735, alt: "Patio cubierto iluminado de noche" },
  { src: "/images/habitacion-1-king.jpg",       width: 980, height: 734, alt: "Habitación con cama king y baño privado" },
  { src: "/images/habitacion-individuales.jpg", width: 980, height: 735, alt: "Habitación con dos camas individuales" },
  { src: "/images/balcon-hamaca.jpg",           width: 980, height: 735, alt: "Balcón de madera con hamaca" },
  { src: "/images/sala-principal.jpg",          width: 980, height: 735, alt: "Sala principal" },
  { src: "/images/comedor.jpg",                 width: 980, height: 735, alt: "Comedor para 14 personas" },
];

// ── section ───────────────────────────────────────────────────────────────────
export function House() {
  const { lang } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="grid gap-5 sm:grid-cols-2 sm:items-end">
        <h2 className="text-fluid-h2 font-[family-name:var(--font-display)] font-bold">
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

      <Reveal className="mt-12" threshold={0.05}>
        <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--caoba)]">
          {lang === "es" ? "De su grupo y de nadie más" : "Your group only"}
        </h3>
        <ul className="mt-5 grid grid-cols-1 gap-x-16 border-t border-[var(--ink)]/8 sm:grid-cols-2">
          {(lang === "es" ? COMMON_ES : COMMON_EN).map((item, i) => (
            <li
              key={item}
              className="amenity-item flex items-start gap-3 border-b border-[var(--ink)]/8 py-4"
              style={{ "--stagger": i } as React.CSSProperties}
            >
              <span
                className="mt-[0.45em] h-1.5 w-1.5 flex-none rounded-full bg-[var(--caoba)]"
                aria-hidden
              />
              <span className="text-[var(--ink)]">{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-13" threshold={0.05}>
        <LightboxGallery
          images={GALLERY_PHOTOS}
          label="Fotos de la casa"
          minColumnWidth={200}
          gap={8}
        />
      </Reveal>
    </div>
  );
}
