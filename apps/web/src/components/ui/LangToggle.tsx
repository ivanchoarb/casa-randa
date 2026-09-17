"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LangToggle() {
  const { lang, setLang } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  // On "/" and "/en" (the only page with a real per-language route, see
  // app/en/page.tsx) toggling also navigates so the URL and the visible
  // language never disagree — good for SEO and for anyone sharing the
  // link. Everywhere else this is unchanged: a client-only content swap,
  // no route change.
  const choose = (next: "es" | "en") => {
    setLang(next);
    if (pathname === "/" && next === "en") router.push("/en");
    else if (pathname === "/en" && next === "es") router.push("/");
  };

  const btn = (active: boolean) =>
    `relative z-10 flex-1 px-2 py-1 font-[var(--font-display)] text-xs font-semibold tracking-wide transition-colors duration-300 ${
      active ? "text-[var(--night)]" : "text-[var(--on-dark-2)] hover:text-[var(--on-dark)]"
    }`;

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className="relative flex overflow-hidden rounded-[2px] border border-[var(--on-dark-2)]/40"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/2 bg-[var(--on-dark)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: lang === "en" ? "translateX(100%)" : "translateX(0%)" }}
      />
      <button type="button" aria-pressed={lang === "es"} onClick={() => choose("es")} className={btn(lang === "es")}>
        ES
      </button>
      <button type="button" aria-pressed={lang === "en"} onClick={() => choose("en")} className={btn(lang === "en")}>
        EN
      </button>
    </div>
  );
}
