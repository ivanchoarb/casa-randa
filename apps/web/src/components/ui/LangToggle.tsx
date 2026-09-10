"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LangToggle() {
  const { lang, setLang } = useLanguage();

  const btn = (active: boolean) =>
    `px-2 py-1 font-[var(--font-display)] text-xs font-semibold tracking-wide ${
      active ? "bg-[var(--on-dark)] text-[var(--night)]" : "text-[var(--on-dark-2)]"
    }`;

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className="flex overflow-hidden rounded-[2px] border border-[var(--on-dark-2)]/40"
    >
      <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")} className={btn(lang === "es")}>
        ES
      </button>
      <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")} className={btn(lang === "en")}>
        EN
      </button>
    </div>
  );
}
