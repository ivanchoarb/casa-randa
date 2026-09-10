"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LangToggle() {
  const { lang, setLang } = useLanguage();

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
      <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")} className={btn(lang === "es")}>
        ES
      </button>
      <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")} className={btn(lang === "en")}>
        EN
      </button>
    </div>
  );
}
