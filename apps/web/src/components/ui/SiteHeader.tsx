"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/components/ui/LangToggle";
import { MagneticLink } from "@/components/ui/MagneticLink";

// Anchors (href starting with "#") point at homepage sections and go
// through homeHref() below; a plain path is a real page and is used as-is.
const NAV = [
  { href: "#casa", es: "La casa", en: "The house" },
  { href: "#reservar", es: "Reserva directa", en: "Direct booking" },
  { href: "#barrio", es: "Diablo Heights", en: "Diablo Heights" },
  { href: "#resenas", es: "Reseñas", en: "Reviews" },
  {
    href: "/que-hacer-en-panama",
    es: "Qué hacer en Panamá",
    en: "What to do in Panama",
  },
  { href: "/tienda", es: "Tienda", en: "Shop" },
  { href: "/check-in", es: "Check-in", en: "Check-in" },
];

export function SiteHeader() {
  const { lang } = useLanguage();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  // "/" and "/en" are the same homepage sections in two languages (see
  // app/en/page.tsx) — both stay bare-anchor "home" pages.
  const isHome = pathname === "/" || pathname === "/en";
  // The nav is a set of in-page anchors on the homepage's sections. From
  // any other page, prefix with "/" so it navigates home first, then jumps
  // to the anchor — otherwise the link silently does nothing there.
  const homeHref = (hash: string) => (isHome ? hash : `/${hash}`);

  useEffect(() => {
    if (!menuOpen) return;

    const html = document.documentElement;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    const closeFromOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      )
        return;
      setMenuOpen(false);
    };

    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    desktopQuery.addEventListener("change", closeAtDesktop);

    return () => {
      html.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
      desktopQuery.removeEventListener("change", closeAtDesktop);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--on-dark-2)]/25 bg-[var(--night)] text-[var(--on-dark)]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 md:gap-4 md:px-6 md:py-4">
        <a
          href={homeHref("#top")}
          className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.14em] whitespace-nowrap transition-[letter-spacing] duration-300 hover:tracking-[0.19em]"
        >
          CASA RANDA{" "}
          <span className="hidden font-normal text-[var(--on-dark-2)] sm:inline">
            PANAMÁ
          </span>
        </a>

        <nav className="ml-auto hidden gap-5 font-[family-name:var(--font-display)] text-sm md:flex">
          {NAV.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.href}
                href={homeHref(item.href)}
                className="nav-link py-1.5"
              >
                {lang === "es" ? item.es : item.en}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link py-1.5"
              >
                {lang === "es" ? item.es : item.en}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0 md:gap-4">
          <LangToggle />

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={
              lang === "es"
                ? menuOpen
                  ? "Cerrar menú"
                  : "Abrir menú"
                : menuOpen
                  ? "Close menu"
                  : "Open menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-site-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[2px] border border-[var(--on-dark-2)]/40 text-[var(--on-dark)] md:hidden"
          >
            <span aria-hidden="true" className="flex w-4 flex-col gap-1">
              <span className="h-px w-full bg-[var(--on-dark)]" />
              <span className="h-px w-full bg-[var(--on-dark)]" />
              <span className="h-px w-full bg-[var(--on-dark)]" />
            </span>
          </button>

          <MagneticLink
            href={homeHref("#reservar")}
            className="inline-flex shrink-0 items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-3 py-2 font-[family-name:var(--font-display)] text-xs whitespace-nowrap sm:px-4 sm:text-sm font-semibold text-[#20140a] transition-colors hover:bg-[var(--lamp-fill-hover)]"
          >
            {lang === "es" ? "Ver fechas" : "Check dates"}
          </MagneticLink>
        </div>
      </div>

      <nav
        ref={mobileMenuRef}
        id="mobile-site-menu"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        className={`absolute inset-x-0 top-full border-b border-[var(--on-dark-2)]/25 bg-[var(--night)] px-4 py-3 font-[family-name:var(--font-display)] text-sm md:hidden ${
          menuOpen ? "visible" : "invisible pointer-events-none"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-col">
          {NAV.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.href}
                href={homeHref(item.href)}
                onClick={closeMenu}
                className="nav-link border-b border-[var(--on-dark-2)]/25 px-2 py-3 last:border-b-0"
              >
                {lang === "es" ? item.es : item.en}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="nav-link border-b border-[var(--on-dark-2)]/25 px-2 py-3 last:border-b-0"
              >
                {lang === "es" ? item.es : item.en}
              </Link>
            ),
          )}
        </div>
      </nav>
    </header>
  );
}
