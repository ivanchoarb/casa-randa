"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { CATEGORIES, type Place } from "../places";
import { ImageCarousel } from "../ImageCarousel";

const fieldLabel = "font-[family-name:var(--font-display)] text-xs font-semibold tracking-[0.1em] text-[var(--caoba)] uppercase";

export function PlaceDetail({ place }: { place: Place }) {
  const { lang, t } = useLanguage();
  const category = CATEGORIES.find((c) => c.key === place.category)!;

  const requestSubject =
    lang === "es" ? `Solicitar experiencia: ${place.name}` : `Request experience: ${place.name}`;
  const requestHref = `mailto:booking@randahome.com?subject=${encodeURIComponent(requestSubject)}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <Link href="/que-hacer-en-panama" className="nav-link font-[family-name:var(--font-display)] text-sm">
        {lang === "es" ? "← Volver a la guía" : "← Back to the guide"}
      </Link>

      <Reveal delayMs={40} className="mt-6">
        <ImageCarousel images={place.images} alt={place.name} />
      </Reveal>

      <Reveal delayMs={60}>
        <p className="mt-6 font-[family-name:var(--font-display)] text-xs font-semibold tracking-[0.14em] text-[var(--caoba)] uppercase">
          {lang === "es" ? category.es : category.en}
        </p>
        <h1 className="text-fluid-h2 mt-2 font-[family-name:var(--font-display)] font-bold">{place.name}</h1>
        <p className="mt-4 max-w-2xl text-[var(--ink-2)]">{t(place.teaser)}</p>
        <p className="mt-3 text-sm font-[family-name:var(--font-display)] font-semibold text-[var(--ink-2)]">
          {"$".repeat(place.priceLevel)}
        </p>
      </Reveal>

      <Reveal delayMs={120} className="mt-10 border-t border-[var(--ink)]/10 pt-8">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          {lang === "es" ? "Por qué lo recomendamos" : "Why we recommend it"}
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--ink-2)]">{t(place.why)}</p>
      </Reveal>

      <Reveal delayMs={160} className="mt-10 grid gap-8 border-t border-[var(--ink)]/10 pt-8 sm:grid-cols-2">
        <div>
          <h3 className={fieldLabel}>{lang === "es" ? "Distancia" : "Distance"}</h3>
          <p className="mt-2 text-sm text-[var(--ink-2)]">{t(place.distance)}</p>
        </div>
        <div>
          <h3 className={fieldLabel}>{lang === "es" ? "Cómo llegar" : "Getting there"}</h3>
          <p className="mt-2 text-sm text-[var(--ink-2)]">{t(place.howToGetThere)}</p>
        </div>
        <div>
          <h3 className={fieldLabel}>{lang === "es" ? "Horario" : "Hours"}</h3>
          <p className="mt-2 text-sm text-[var(--ink-2)]">{t(place.hours)}</p>
        </div>
        <div>
          <h3 className={fieldLabel}>{lang === "es" ? "Precio de referencia" : "Reference pricing"}</h3>
          <p className="mt-2 text-sm text-[var(--ink-2)]">{t(place.priceReference)}</p>
        </div>
      </Reveal>

      <Reveal
        delayMs={200}
        scale
        className="mt-10 border-t-4 border-[var(--lamp-fill)] bg-[var(--night)] px-6 py-8 text-center text-[var(--on-dark)] sm:px-10"
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          {lang === "es" ? "¿Quiere vivir esta experiencia?" : "Want to experience this?"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--on-dark-2)]">
          {lang === "es"
            ? "Podemos ayudarle a organizar el traslado y crear una experiencia a su medida."
            : "We can help arrange transport and tailor the experience to your group."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <MagneticLink
            href={requestHref}
            className="inline-flex items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[family-name:var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[var(--lamp-fill-hover)]"
          >
            {lang === "es" ? "Solicitar experiencia" : "Request experience"}
          </MagneticLink>
          <a
            href={place.officialSite}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--on-dark-2)] underline decoration-[var(--on-dark-2)]/40 underline-offset-2 transition-colors hover:text-[var(--on-dark)]"
          >
            {lang === "es" ? "Sitio oficial" : "Official site"}
          </a>
          <a
            href={place.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--on-dark-2)] underline decoration-[var(--on-dark-2)]/40 underline-offset-2 transition-colors hover:text-[var(--on-dark)]"
          >
            {lang === "es" ? "Abrir mapa" : "Open map"}
          </a>
          {place.phone && (
            <a
              href={`tel:${place.phone.replace(/[^+\d]/g, "")}`}
              className="text-sm text-[var(--on-dark-2)] underline decoration-[var(--on-dark-2)]/40 underline-offset-2 transition-colors hover:text-[var(--on-dark)]"
            >
              {place.phone}
            </a>
          )}
        </div>
      </Reveal>
    </div>
  );
}
