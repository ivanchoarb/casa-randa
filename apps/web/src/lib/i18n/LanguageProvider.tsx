"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  // Solo "/" y "/en" son la misma página en dos idiomas reales (ver
  // app/en/page.tsx) — el resto del sitio (tienda, guía, check-in...) no
  // tiene una ruta /en propia todavía, así que arranca en español salvo
  // que estemos justo en "/en". El toggle sigue siendo puramente de
  // cliente en esas otras páginas (ver LangToggle.tsx).
  const [lang, setLang] = useState<Lang>(() => (pathname === "/en" ? "en" : "es"));

  // El HTML servido por / y /en siempre dice lang="es" (viene fijo en
  // layout.tsx — cambiarlo por página exigiría leer la URL en el layout
  // raíz, lo que en Next vuelve dinámico todo el sitio y pierde el
  // prerender estático). Se corrige en el cliente apenas hidrata, que es
  // lo que de verdad importa para lectores de pantalla y crawlers que
  // ejecutan JS; queda documentado como límite conocido, no un descuido.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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
