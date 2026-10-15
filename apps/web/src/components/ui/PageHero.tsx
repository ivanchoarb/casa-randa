"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import Image from "next/image";
import type { Bilingual } from "@casa-randa/data";

/** Compact header for interior pages (not the homepage) — title + intro. */
export function PageHero({ title, intro, image }: { title: Bilingual; intro: Bilingual; image?: string }) {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-[var(--night)] text-[var(--on-dark)]">
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--night)] via-[var(--night)]/50 to-transparent" />
        </>
      )}
      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <Reveal>
          <h1 className="text-fluid-h2 font-[family-name:var(--font-display)] font-bold">{t(title)}</h1>
          <p className="mt-4 max-w-2xl text-[var(--on-dark-2)]">{t(intro)}</p>
        </Reveal>
      </div>
    </div>
  );
}
