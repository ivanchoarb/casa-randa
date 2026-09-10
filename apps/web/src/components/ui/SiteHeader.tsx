"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/components/ui/LangToggle";
import { MagneticLink } from "@/components/ui/MagneticLink";

const NAV = [
  { href: "#casa", es: "La casa", en: "The house" },
  { href: "#reservar", es: "Reserva directa", en: "Direct booking" },
  { href: "#barrio", es: "Diablo Heights", en: "Diablo Heights" },
  { href: "#resenas", es: "Reseñas", en: "Reviews" },
];

export function SiteHeader() {
  const { lang } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--on-dark-2)]/25 bg-[var(--night)] text-[var(--on-dark)]">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <a
          href="#top"
          className="font-[var(--font-display)] text-sm font-bold tracking-[0.14em] whitespace-nowrap transition-[letter-spacing] duration-300 hover:tracking-[0.19em]"
        >
          CASA RANDA <span className="text-[var(--on-dark-2)] font-normal">PANAMÁ</span>
        </a>

        <nav className="ml-auto hidden gap-5 font-[var(--font-display)] text-sm md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="nav-link py-1.5">
              {lang === "es" ? item.es : item.en}
            </a>
          ))}
        </nav>

        <LangToggle />

        <MagneticLink
          href="#reservar"
          className="inline-flex items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-4 py-2 font-[var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[#f0ce86]"
        >
          {lang === "es" ? "Ver fechas" : "Check dates"}
        </MagneticLink>
      </div>
    </header>
  );
}
