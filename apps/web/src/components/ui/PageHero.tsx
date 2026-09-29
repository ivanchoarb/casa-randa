"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import type { Bilingual } from "@casa-randa/data";

/** Compact header for interior pages (not the homepage) — title + intro. */
export function PageHero({ title, intro }: { title: Bilingual; intro: Bilingual }) {
  const { t } = useLanguage();

  return (
    <div className="bg-[var(--night)] text-[var(--on-dark)]">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <Reveal>
          <h1 className="text-fluid-h2 font-[family-name:var(--font-display)] font-bold">{t(title)}</h1>
          <p className="mt-4 max-w-2xl text-[var(--on-dark-2)]">{t(intro)}</p>
        </Reveal>
      </div>
    </div>
  );
}
