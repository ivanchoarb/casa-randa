"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Bilingual } from "@casa-randa/data";

export type Lang = "es" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Pick the string for the current language out of a {es, en} pair. */
  t: (pair: Bilingual) => string;
  /** Format a USD amount using the current language's locale. */
  money: (n: number) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (pair) => (lang === "es" ? pair.es : pair.en),
      money: (n) =>
        `$${n.toLocaleString(lang === "es" ? "es-PA" : "en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`,
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
