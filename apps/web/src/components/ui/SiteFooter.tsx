"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";

// No production subdomain is decided yet for apps/intranet (see
// docs/arquitectura-migracion.md) — set NEXT_PUBLIC_INTRANET_URL once one
// is, this falls back to the eventual randahome.com subdomain in the
// meantime and to the local dev app's own port while developing. Port
// 3002, not 3001 — that's what apps/intranet actually runs on in dev
// (see .claude/launch.json's "intranet-dev" entry), 3001 was never
// where it ran.
const INTRANET_URL =
  process.env.NEXT_PUBLIC_INTRANET_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3002" : "https://intranet.randahome.com");

export function SiteFooter() {
  const { lang } = useLanguage();

  return (
    <footer className="bg-[var(--night-2)] pt-13 pb-8 text-[var(--on-dark)]">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-8 sm:gap-11">
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-wide text-[var(--on-dark-2)]">
              {lang === "es" ? "La casa" : "The house"}
            </h4>
            <p className="mt-3 max-w-[30ch] text-sm text-[var(--on-dark-2)]">
              Calle Hecker 5624
              <br />
              Diablo Heights, Ancón
              <br />
              Ciudad de Panamá
            </p>
          </div>
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-wide text-[var(--on-dark-2)]">
              {lang === "es" ? "Reservas" : "Bookings"}
            </h4>
            <p className="mt-3 max-w-[30ch] text-sm text-[var(--on-dark-2)]">
              <a
                href="mailto:booking@randahome.com"
                className="text-[var(--on-dark)] transition-colors duration-200 hover:text-[var(--lamp-fill)]"
              >
                booking@randahome.com
              </a>
            </p>
            <p className="mt-1 max-w-[30ch] text-sm text-[var(--on-dark-2)]">
              <a
                href="https://wa.me/573157621593"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--on-dark)] transition-colors duration-200 hover:text-[var(--lamp-fill)]"
              >
                WhatsApp
              </a>
              {lang === "es" ? ", de 7 a. m. a 10 p. m. hora de Panamá" : ", 7 a.m. to 10 p.m. Panama time"}
            </p>
          </div>
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-wide text-[var(--on-dark-2)]">
              {lang === "es" ? "Registro" : "Registration"}
            </h4>
            <p className="mt-3 max-w-[30ch] text-sm tabular-nums text-[var(--on-dark-2)]">HAES 4182283</p>
            <p className="mt-1 max-w-[30ch] text-sm text-[var(--on-dark-2)]">
              {lang === "es" ? "Entrada de 3 a 9 p. m. Salida hasta las 12 m." : "Check-in 3–9 p.m. · Check-out by noon"}
            </p>
          </div>
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-wide text-[var(--on-dark-2)]">
              {lang === "es" ? "Síganos" : "Follow"}
            </h4>
            <p className="mt-3 max-w-[30ch] text-sm text-[var(--on-dark-2)]">
              <a href="#" className="text-[var(--on-dark)] transition-colors duration-200 hover:text-[var(--lamp-fill)]">
                @casaranda_panama
              </a>
            </p>
          </div>
        </Reveal>

        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-4 border-t border-[var(--on-dark-2)]/25 pt-4 text-sm text-[var(--on-dark-2)]">
          <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span>© 2026 Casa Randa</span>
            <a
              href={INTRANET_URL}
              className="text-[var(--on-dark-2)] underline decoration-[var(--on-dark-2)]/40 underline-offset-2 transition-colors duration-200 hover:text-[var(--on-dark)]"
            >
              {lang === "es" ? "Intranet" : "Staff intranet"}
            </a>
          </span>
          <span>
            {lang === "es"
              ? "Prototipo — la reserva directa es por solicitud y cotización"
              : "Prototype — direct booking is by request and quote"}
          </span>
        </div>
      </div>
    </footer>
  );
}
