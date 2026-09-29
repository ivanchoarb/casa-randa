"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Branded stand-in for a place with no licensed photo yet — deliberately
 * not a stock substitute, which would misrepresent the actual venue in a
 * guide that bills itself as an honest recommendation. Swap in real
 * photos via `images` in places.ts and this never renders again.
 */
export function PlacePlaceholder({ className = "" }: { className?: string }) {
  const { lang } = useLanguage();

  return (
    <div className={`flex flex-col items-center justify-center gap-2 bg-[var(--night)] ${className}`}>
      <span className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-wide text-[var(--lamp-fill)]">CR</span>
      <span className="font-[family-name:var(--font-display)] text-xs tracking-wide text-[var(--on-dark-2)] uppercase">
        {lang === "es" ? "Foto próximamente" : "Photo coming soon"}
      </span>
    </div>
  );
}
