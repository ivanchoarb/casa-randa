"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { CATEGORIES, type CategoryKey, type Place } from "./places";
import { PlacePlaceholder } from "./PlacePlaceholder";

const chip = (on: boolean) =>
  `rounded-full border px-4 py-1.5 text-sm transition-colors duration-200 ${
    on
      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--panel)]"
      : "border-[var(--ink)]/25 text-[var(--ink-2)] hover:border-[var(--ink)]"
  }`;

function Photo({ place, sizes, className = "" }: { place: Place; sizes: string; className?: string }) {
  return (
    <div className={`gallery-photo relative overflow-hidden ${className}`}>
      {place.images[0] ? (
        <Image
          src={place.images[0]}
          alt={place.name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <PlacePlaceholder className="absolute inset-0" />
      )}
    </div>
  );
}

export function GuideList({ places }: { places: Place[] }) {
  const { lang, t } = useLanguage();
  const [active, setActive] = useState<CategoryKey | "all">("all");

  // Solo categorías con lugares: un chip que lleva a una lista vacía es un callejón sin salida.
  const categories = CATEGORIES.filter((c) => places.some((p) => p.category === c.key));
  const filtered = active === "all" ? places : places.filter((p) => p.category === active);
  // Destacado = el primer lugar con foto, solo en la vista "Todo".
  const featured = active === "all" ? filtered.find((p) => p.images[0]) : undefined;
  const rest = featured ? filtered.filter((p) => p !== featured) : filtered;
  const label = (key: CategoryKey) => {
    const c = CATEGORIES.find((c) => c.key === key)!;
    return lang === "es" ? c.es : c.en;
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActive("all")} className={chip(active === "all")}>
          {lang === "es" ? "Todo" : "All"} ({places.length})
        </button>
        {categories.map((c) => (
          <button key={c.key} type="button" onClick={() => setActive(c.key)} className={chip(active === c.key)}>
            {lang === "es" ? c.es : c.en} ({places.filter((p) => p.category === c.key).length})
          </button>
        ))}
      </div>

      {/* Sin Reveal: la lista puede ser más alta que el umbral de visibilidad y quedaría oculta. */}
      {featured && (
        <Link
          href={`/que-hacer-en-panama/${featured.slug}`}
          className="group mt-8 grid overflow-hidden border border-[var(--ink)]/10 bg-[var(--panel)] transition-colors duration-200 hover:border-[var(--caoba)]/40 md:grid-cols-5"
        >
          <Photo place={featured} sizes="(max-width: 768px) 100vw, 60vw" className="aspect-[16/10] md:col-span-3 md:aspect-auto md:min-h-[320px]" />
          <div className="flex flex-col justify-center p-6 sm:p-8 md:col-span-2">
            <span className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-[0.14em] text-[var(--caoba)] uppercase">
              {lang === "es" ? "Destacado" : "Featured"} · {label(featured.category)}
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold">{featured.name}</h2>
            <p className="mt-3 text-[var(--ink-2)]">{t(featured.teaser)}</p>
            {t(featured.distance) && (
              <p className="mt-4 text-sm font-semibold text-[var(--ink)]">📍 {t(featured.distance)}</p>
            )}
            <span className="nav-link mt-5 inline-block font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--caoba)]">
              {lang === "es" ? "Ver guía completa →" : "View full guide →"}
            </span>
          </div>
        </Link>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((place) => (
          <Link
            key={place.slug}
            href={`/que-hacer-en-panama/${place.slug}`}
            className="group flex flex-col overflow-hidden border border-[var(--ink)]/10 bg-[var(--panel)] transition-colors duration-200 hover:border-[var(--caoba)]/40"
          >
            <Photo place={place} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="aspect-[4/3]" />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-wide text-[var(--caoba)] uppercase">
                  {label(place.category)}
                </span>
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--ink-2)]">
                  {"$".repeat(place.priceLevel)}
                </span>
              </div>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold">{place.name}</h3>
              <p className="mt-3 line-clamp-3 text-sm text-[var(--ink-2)]">{t(place.teaser)}</p>
              {t(place.distance) && (
                <p className="mt-3 line-clamp-2 text-xs font-semibold text-[var(--ink)]">📍 {t(place.distance)}</p>
              )}
              <span className="nav-link mt-auto inline-block self-start pt-4 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--caoba)]">
                {lang === "es" ? "Ver guía completa →" : "View full guide →"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
