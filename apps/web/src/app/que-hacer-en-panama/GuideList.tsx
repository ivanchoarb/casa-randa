"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import { CATEGORIES, PLACES, type CategoryKey } from "./places";
import { PlacePlaceholder } from "./PlacePlaceholder";

export function GuideList() {
  const { lang, t } = useLanguage();
  const [active, setActive] = useState<CategoryKey | "all">("all");

  const visible = active === "all" ? PLACES : PLACES.filter((p) => p.category === active);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <Reveal className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-200 ${
            active === "all"
              ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--panel)]"
              : "border-[var(--ink)]/25 text-[var(--ink-2)] hover:border-[var(--ink)]"
          }`}
        >
          {lang === "es" ? "Todo" : "All"}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActive(c.key)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-200 ${
              active === c.key
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--panel)]"
                : "border-[var(--ink)]/25 text-[var(--ink-2)] hover:border-[var(--ink)]"
            }`}
          >
            {lang === "es" ? c.es : c.en}
          </button>
        ))}
      </Reveal>

      {/* Not wrapped in Reveal: this grid can be tall enough (several
          stacked cards on mobile) that its 20%-visible threshold wouldn't
          clear until well after the user scrolls past it — a listing page
          should show its results immediately, not gate them behind a
          scroll reveal meant for narrative sections. */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((place) => {
          const category = CATEGORIES.find((c) => c.key === place.category)!;
          return (
            <Link
              key={place.slug}
              href={`/que-hacer-en-panama/${place.slug}`}
              className="group block overflow-hidden border border-[var(--ink)]/10 bg-[var(--panel)] transition-colors duration-200 hover:border-[var(--caoba)]/40"
            >
              <div className="gallery-photo relative aspect-[4/3] overflow-hidden">
                {place.images[0] ? (
                  <Image
                    src={place.images[0]}
                    alt={place.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <PlacePlaceholder className="absolute inset-0" />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-wide text-[var(--caoba)] uppercase">
                    {lang === "es" ? category.es : category.en}
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--ink-2)]">
                    {"$".repeat(place.priceLevel)}
                  </span>
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold">{place.name}</h3>
                <p className="mt-3 text-sm text-[var(--ink-2)]">{t(place.teaser)}</p>
                <span className="nav-link mt-4 inline-block font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--caoba)]">
                  {lang === "es" ? "Ver guía completa →" : "View full guide →"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
