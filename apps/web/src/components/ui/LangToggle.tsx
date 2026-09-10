"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang" role="group" aria-label="Idioma / Language">
      <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>
        ES
      </button>
      <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
        EN
      </button>
    </div>
  );
}
